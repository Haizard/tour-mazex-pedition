const toSearchableText = (value) => {
  if (!value) {
    return "";
  }

  if (typeof value === "string") {
    return value.toLowerCase();
  }

  if (Array.isArray(value)) {
    return value.map((item) => toSearchableText(item)).join(" ");
  }

  if (typeof value === "object") {
    return Object.values(value)
      .map((item) => toSearchableText(item))
      .join(" ");
  }

  return String(value).toLowerCase();
};

const includesAny = (haystack, needles = []) => needles.some((needle) => haystack.includes(needle));

const buildSuggestion = ({
  sourceKey,
  bindingType,
  fieldPath = "items",
  confidence = 0.6,
  rationale,
}) => ({
  sourceKey,
  bindingType,
  fieldPath,
  confidence,
  rationale,
});

export const suggestBindingsForSection = (section = {}) => {
  const label = String(section.label || section.type || "").toLowerCase();
  const contentText = toSearchableText(section.content || section.contentConfig || {});
  const searchable = `${label} ${contentText}`;
  const suggestions = [];

  if (
    includesAny(searchable, ["tour", "package", "itinerary", "safari", "expedition"]) ||
    includesAny(label, ["featuredpackages", "tourgrid"])
  ) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "tourPackages",
        bindingType: "dynamic-collection",
        confidence: 0.9,
        rationale: "This section looks like a package/tour listing.",
      })
    );
  }

  if (includesAny(searchable, ["blog", "story", "article", "journal", "news"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "blogs",
        bindingType: "dynamic-collection",
        confidence: 0.82,
        rationale: "This section looks like a blog/article listing or editorial block.",
      })
    );
  }

  if (includesAny(searchable, ["review", "testimonial", "traveler say", "guest say"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "testimonials",
        bindingType: "dynamic-collection",
        confidence: 0.84,
        rationale: "This section appears to present traveler proof or reviews.",
      })
    );
  }

  if (includesAny(searchable, ["destination", "places", "where we go", "regions"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "taxonomies.destinations",
        bindingType: "dynamic-collection",
        confidence: 0.76,
        rationale: "This section appears to list travel destinations or regional categories.",
      })
    );
  }

  if (includesAny(searchable, ["contact", "email us", "call us", "speak with us", "travel team"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "siteSettings.contact",
        bindingType: "dynamic-single",
        fieldPath: "contact",
        confidence: 0.74,
        rationale: "This section appears to show contact information or a contact CTA.",
      })
    );
  }

  if (includesAny(searchable, ["plan my trip", "inquiry", "request dates", "talk to a specialist"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "inquiryForm",
        bindingType: "mixed",
        fieldPath: "form",
        confidence: 0.72,
        rationale: "This section appears to drive an inquiry or booking request flow.",
      })
    );
  }

  if (includesAny(searchable, ["faq", "questions", "before you book"])) {
    suggestions.push(
      buildSuggestion({
        sourceKey: "faqs",
        bindingType: "dynamic-collection",
        confidence: 0.7,
        rationale: "This section appears to be a frequently asked questions block.",
      })
    );
  }

  return suggestions;
};

export const suggestBindingsForPage = (sections = []) =>
  (Array.isArray(sections) ? sections : []).reduce((accumulator, section, index) => {
    const sectionId = section.id || section._id || `section-${index + 1}`;
    accumulator[sectionId] = suggestBindingsForSection(section);
    return accumulator;
  }, {});

