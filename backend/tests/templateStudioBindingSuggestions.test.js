import test from "node:test";
import assert from "node:assert/strict";

import {
  suggestBindingsForPage,
  suggestBindingsForSection,
} from "../utils/templateStudioBindingSuggestions.js";

test("suggestBindingsForSection detects dynamic tour collection sections", () => {
  const suggestions = suggestBindingsForSection({
    type: "featuredPackages",
    label: "Featured packages",
    content: {
      title: "Popular safari packages",
      body: "Highlight private and group tours.",
    },
  });

  assert.equal(suggestions.some((suggestion) => suggestion.sourceKey === "tourPackages"), true);
  assert.equal(
    suggestions.some((suggestion) => suggestion.bindingType === "dynamic-collection"),
    true
  );
});

test("suggestBindingsForSection detects blog and testimonial candidates from imported content", () => {
  const suggestions = suggestBindingsForSection({
    type: "customHtml",
    label: "Imported stories and reviews",
    content: {
      htmlTemplate:
        "<section><h2>Latest blog stories</h2><div>Traveler reviews and recent blog posts</div></section>",
    },
  });

  assert.equal(suggestions.some((suggestion) => suggestion.sourceKey === "blogs"), true);
  assert.equal(suggestions.some((suggestion) => suggestion.sourceKey === "testimonials"), true);
});

test("suggestBindingsForPage groups page suggestions by section id", () => {
  const pageSuggestions = suggestBindingsForPage([
    {
      id: "section-1",
      type: "faq",
      content: { title: "Questions before you book" },
    },
    {
      id: "section-2",
      type: "contact",
      content: { body: "Speak with our travel team" },
    },
  ]);

  assert.deepEqual(Object.keys(pageSuggestions), ["section-1", "section-2"]);
  assert.equal(
    pageSuggestions["section-2"].some((suggestion) => suggestion.sourceKey === "siteSettings.contact"),
    true
  );
});
