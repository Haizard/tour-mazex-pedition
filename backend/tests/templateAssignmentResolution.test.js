import test from "node:test";
import assert from "node:assert/strict";

import {
  buildAssignmentAwareTemplateSource,
  isSectionLocked,
  isSectionPersonalizationAllowed,
  resolveActiveTemplateAssignment,
} from "../utils/templateAssignmentResolution.js";

test("resolveActiveTemplateAssignment returns the active assignment for a tenant", () => {
  const result = resolveActiveTemplateAssignment({
    tenantId: "tenant-alpha",
    assignments: [
      {
        tenantId: "tenant-alpha",
        masterTemplateId: "signature-safari",
        active: false,
        assignmentStatus: "archived",
      },
      {
        tenantId: "tenant-alpha",
        masterTemplateId: "summit-expedition",
        active: true,
        assignmentStatus: "active",
      },
      {
        tenantId: "tenant-bravo",
        masterTemplateId: "island-escape",
        active: true,
        assignmentStatus: "active",
      },
    ],
  });

  assert.equal(result.masterTemplateId, "summit-expedition");
  assert.equal(result.assignmentStatus, "active");
});

test("resolveActiveTemplateAssignment prefers the newest active assignment when duplicates exist", () => {
  const result = resolveActiveTemplateAssignment({
    tenantId: "tenant-alpha",
    assignments: [
      {
        tenantId: "tenant-alpha",
        id: "assignment-older",
        masterTemplateId: "signature-safari",
        active: true,
        assignedAt: "2026-05-18T08:00:00.000Z",
      },
      {
        tenantId: "tenant-alpha",
        id: "assignment-newer",
        masterTemplateId: "summit-expedition",
        active: true,
        assignedAt: "2026-05-20T08:00:00.000Z",
      },
    ],
  });

  assert.equal(result.id, "assignment-newer");
  assert.equal(result.masterTemplateId, "summit-expedition");
});

test("buildAssignmentAwareTemplateSource keeps master template identity separate from tenant personalization", () => {
  const result = buildAssignmentAwareTemplateSource({
    assignment: {
      id: "assignment-1",
      tenantId: "tenant-alpha",
      masterTemplateId: "signature-safari",
      active: true,
      assignedAt: "2026-05-20T09:00:00.000Z",
    },
    masterTemplate: {
      id: "signature-safari",
      name: "Signature Safari",
    },
    personalization: {
      personalizedFor: "Kili Trails",
      personalizationNote: "Adjusted colors and CTA labels.",
      pageType: "home",
    },
  });

  assert.equal(result.templateId, "signature-safari");
  assert.equal(result.templateName, "Signature Safari");
  assert.equal(result.assignmentId, "assignment-1");
  assert.equal(result.masterTemplateId, "signature-safari");
  assert.equal(result.personalizationMode, "assignment");
  assert.equal(result.personalizedFor, "Kili Trails");
});

test("assignment helpers respect locked and editable section rules", () => {
  assert.equal(
    isSectionLocked({
      assignmentMeta: { structureLocked: true },
    }),
    true
  );

  assert.equal(
    isSectionPersonalizationAllowed({
      assignmentMeta: { contentEditable: true },
    }),
    true
  );

  assert.equal(
    isSectionPersonalizationAllowed({
      assignmentMeta: { contentEditable: false, styleEditable: false, bindingEditable: false },
    }),
    false
  );
});
