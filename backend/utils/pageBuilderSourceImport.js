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

      const selectors = selectorPart
        .split(",")
        .map((selector) => selector.trim())
        .filter(Boolean)
        .map((selector) =>
          selector.startsWith(`.${scopeClass}`) ? selector : `.${scopeClass} ${selector}`
        )
        .join(", ");

      return `${selectors} { ${body} }`;
    })
    .filter(Boolean)
    .join("\n");

const buildTemplate = (html = "", editable = {}) => {
  let template = html;
  if (editable.title) template = template.replace(editable.title, "{{title}}");
  if (editable.eyebrow) template = template.replace(editable.eyebrow, "{{eyebrow}}");
  if (editable.body) template = template.replace(editable.body, "{{body}}");
  if (editable.imageUrl) template = template.replace(editable.imageUrl, "{{imageUrl}}");
  if (editable.imageAlt) template = template.replace(editable.imageAlt, "{{imageAlt}}");
  if (editable.ctaLabel) template = template.replace(editable.ctaLabel, "{{ctaLabel}}");
  if (editable.ctaHref) template = template.replace(editable.ctaHref, "{{ctaHref}}");
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

