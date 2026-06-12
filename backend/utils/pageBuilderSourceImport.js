import crypto from "node:crypto";

const stripStyleBlocks = (source = "") =>
  String(source || "").replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

export const extractCssFromSource = (source = "") => {
  const blocks = [];
  String(source || "").replace(/<style\b[^>]*>([\s\S]*?)<\/style>/gi, (_match, css) => {
    blocks.push(css);
    return "";
  });
  return blocks.join("\n").trim();
};

export const sanitizeImportedHtml = (source = "") =>
  stripStyleBlocks(source)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/\son[a-z]+\s*=\s*"[^"]*"/gi, "")
    .replace(/\son[a-z]+\s*=\s*'[^']*'/gi, "")
    .replace(/\son[a-z]+\s*=\s*[^\s>]+/gi, "")
    .replace(/javascript:/gi, "")
    .trim();

const textFromFirst = (html = "", tagName) => {
  const match = html.match(new RegExp(`<${tagName}\\b[^>]*>([\\s\\S]*?)<\\/${tagName}>`, "i"));
  return match ? match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim() : "";
};

const attrFromFirst = (html = "", tagName, attrName) => {
  const tag = html.match(new RegExp(`<${tagName}\\b[^>]*>`, "i"))?.[0] || "";
  return tag.match(new RegExp(`${attrName}\\s*=\\s*"([^"]*)"`, "i"))?.[1] ||
    tag.match(new RegExp(`${attrName}\\s*=\\s*'([^']*)'`, "i"))?.[1] ||
    "";
};

const findParagraphs = (html = "") =>
  [...html.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
    .map((match) => match[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim())
    .filter(Boolean);

export const extractEditableContentFromHtml = (html = "") => {
  const paragraphs = findParagraphs(html);
  const linkLabel = textFromFirst(html, "a");

  return {
    eyebrow: paragraphs[0] || "",
    title: textFromFirst(html, "h1") || textFromFirst(html, "h2") || "Imported section",
    body: paragraphs.slice(1).join("\n\n") || paragraphs[0] || "",
    imageUrl: attrFromFirst(html, "img", "src"),
    imageAlt: attrFromFirst(html, "img", "alt"),
    ctaLabel: linkLabel,
    ctaHref: attrFromFirst(html, "a", "href"),
  };
};

/**
 * Selectors that should NOT be scoped to the section wrapper.
 * These either target the document root, are universal, or are
 * at-rules that don't belong inside a scoped block.
 */
const GLOBAL_SELECTOR_PATTERNS = [
  /^html$/i,
  /^body$/i,
  /^\*$/,
  /^:root$/i,
  /^:host$/i,
  /^::selection$/i,
  /^::placeholder$/i,
  /^:focus-visible$/i,
  /^:focus-within$/i,
  /^:fullscreen$/i,
  /^\s*:where\s*\(/,      // :where(*)
  /^\s*:is\s*\(/,         // :is(*)
  /^\s*:has\s*\(/,        // :has(*)
  /^\s*:not\s*\(/,        // :not(*)
  /^\s*@/,                 // @keyframes, @media, @font-face, @supports, etc.
  /^\s*%/,
  /^\s*\//,               // comments
  /^\s*\*/,
  /^@/,
];

/**
 * Returns true if the selector should NOT be scoped to a parent wrapper.
 * These are root-level, universal, or at-rule selectors that would break
 * if prepended with `.scope-class `.
 */
const isGlobalSelector = (selector = "") => {
  const trimmed = selector.trim();
  // Empty or only whitespace
  if (!trimmed) return true;
  // Direct match against known global patterns
  for (const pattern of GLOBAL_SELECTOR_PATTERNS) {
    if (pattern.test(trimmed)) return true;
  }
  return false;
};

/**
 * Scopes CSS selectors so they only apply inside the imported section.
 *
 * Global selectors (html, body, *, :root, @keyframes, @media, etc.) are
 * passed through unchanged so the original layout intent is preserved.
 * All other selectors are prefixed with `.scopeClass ` to isolate them.
 *
 * @param {string} css - Raw CSS rules extracted from <style> blocks
 * @param {string} scopeClass - Unique class name for this import (e.g. "pb-import-abc123")
 * @returns {string} Scoped CSS string
 */
export const scopeImportedCss = (css = "", scopeClass = "") =>
  String(css || "")
    .split("}")
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => {
      const [selectorPart, ...bodyParts] = rule.split("{");
      const body = bodyParts.join("{").trim();
      if (!selectorPart || !body) {
        return "";
      }

      const scopedSelectors = selectorPart
        .split(",")
        .map((selector) => selector.trim())
        .filter(Boolean)
        .map((selector) => {
          // Already scoped — leave as-is
          if (selector.startsWith(`.${scopeClass}`)) return selector;
          // Global selector — leave unchanged so it keeps working
          if (isGlobalSelector(selector)) return selector;
          // Regular selector — scope it to the import wrapper
          return `.${scopeClass} ${selector}`;
        })
        .join(", ");

      return `${scopedSelectors} { ${body} }`;
    })
    .filter(Boolean)
    .join("\n");

/**
 * Escapes special regex characters in a plain text string so it can be
 * used safely inside a new RegExp() call.
 */
const escapeForRegex = (str = "") =>
  String(str).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Replaces a plain-text value in HTML with a {{variable}} placeholder,
 * matching case-insensitively and handling both attribute and text-node
 * contexts so the replacement is robust regardless of how the original
 * markup wraps the value.
 *
 * Falls back to a plain string replace if the value can't be safely
 * escaped (e.g. it contains characters that would break a regex).
 *
 * @param {string} html - Raw HTML string
 * @param {string} value - The plain text value to replace
 * @param {string} variable - The {{variable}} placeholder to substitute
 * @returns {string} HTML with the placeholder in place of the matched value
 */
const replaceWithVariable = (html = "", value = "", variable = "") => {
  if (!value || !variable) return html;
  try {
    const escaped = escapeForRegex(value);
    // Match the value as a standalone text node or attribute value,
    // case-insensitive to handle title-case / ALL-CAPS source markup.
    const regex = new RegExp(
      `(?:>\\s*)(${escaped})(?:\\s*<)|(?:src|alt|href|title|class)=["']([^"']*)${escaped}([^"']*)["']`,
      "gi"
    );
    return html.replace(regex, (_match, textMatch, attrPrefix, attrSuffix) => {
      if (textMatch !== undefined) {
        return `> ${variable} <`;
      }
      return `${attrPrefix || ""}${variable}${attrSuffix || ""}`;
    });
  } catch {
    // Value contains characters that can't be in a regex — use plain replace
    return html.replace(value, variable);
  }
};

const buildTemplate = (html = "", editable = {}) => {
  let template = html;
  if (editable.title) template = replaceWithVariable(template, editable.title, "{{title}}");
  if (editable.eyebrow) template = replaceWithVariable(template, editable.eyebrow, "{{eyebrow}}");
  if (editable.body) template = replaceWithVariable(template, editable.body, "{{body}}");
  if (editable.imageUrl) template = replaceWithVariable(template, editable.imageUrl, "{{imageUrl}}");
  if (editable.imageAlt) template = replaceWithVariable(template, editable.imageAlt, "{{imageAlt}}");
  if (editable.ctaLabel) template = replaceWithVariable(template, editable.ctaLabel, "{{ctaLabel}}");
  if (editable.ctaHref) template = replaceWithVariable(template, editable.ctaHref, "{{ctaHref}}");
  return template;
};

export const buildImportedSectionFromSource = ({ sourceCode = "", name = "Imported Section" }) => {
  const safeHtml = sanitizeImportedHtml(sourceCode);
  const editable = extractEditableContentFromHtml(safeHtml);
  const scopeClass = `pb-import-${crypto
    .createHash("sha1")
    .update(`${name}:${safeHtml}`)
    .digest("hex")
    .slice(0, 10)}`;
  const css = extractCssFromSource(sourceCode);

  return {
    type: "customHtml",
    variant: "imported",
    enabled: true,
    order: 1,
    dataConfig: {},
    contentConfig: {
      importName: name,
      eyebrow: editable.eyebrow,
      title: editable.title,
      body: editable.body,
      imageUrl: editable.imageUrl,
      imageAlt: editable.imageAlt,
      ctaLabel: editable.ctaLabel,
      ctaHref: editable.ctaHref,
      htmlTemplate: buildTemplate(safeHtml, editable),
      importedNotes: "Generated from pasted HTML/CSS and converted into editable CMS fields.",
    },
    styleConfig: {
      scopeClass,
      customCss: scopeImportedCss(css, scopeClass),
    },
  };
};

