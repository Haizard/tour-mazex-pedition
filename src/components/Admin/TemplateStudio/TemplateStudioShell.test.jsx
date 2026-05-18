import test from "node:test";
import assert from "node:assert/strict";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

import TemplateStudioShell from "./TemplateStudioShell.jsx";

test("TemplateStudioShell renders the structured studio shell with top bar actions", () => {
  const markup = renderToStaticMarkup(
    React.createElement(TemplateStudioShell, {
      pageName: "About Us",
      pageType: "about",
      selectedSection: {
        id: "section_about_story",
        label: "Our Story",
        type: "rich-text",
        sourceType: "imported",
      },
    }),
  );

  assert.match(markup, /data-testid="template-studio-shell"/);
  assert.match(markup, /data-testid="template-studio-topbar"/);
  assert.match(markup, /data-testid="template-studio-sidebar"/);
  assert.match(markup, /data-testid="template-studio-canvas"/);
  assert.match(markup, /data-testid="template-studio-inspector"/);

  assert.match(markup, />Import</);
  assert.match(markup, />AI Create</);
  assert.match(markup, />Add Section</);
  assert.match(markup, />Preview</);
  assert.match(markup, />Save</);
  assert.match(markup, />Publish</);

  assert.match(markup, /Pages/);
  assert.match(markup, /Templates/);
  assert.match(markup, /Inspector/);
  assert.match(markup, /About Us/);
  assert.match(markup, /Our Story/);
});
