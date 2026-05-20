import test from "node:test";
import assert from "node:assert/strict";

import {
  buildTemplateAssignmentRows,
  buildTenantAssignmentSummary,
  filterTemplateAssignmentRows,
} from "./templateAssignmentState.js";

const sampleTenants = [
  { _id: "tenant-1", name: "Kili Trails", slug: "kili-trails" },
  { _id: "tenant-2", name: "Summit Routes", slug: "summit-routes" },
];

const sampleAssignments = [
  {
    id: "assignment-1",
    tenantId: "tenant-1",
    masterTemplateId: "signature-safari",
    assignmentStatus: "active",
    active: true,
    assignedAt: "2026-05-20T09:00:00.000Z",
  },
  {
    id: "assignment-2",
    tenantId: "tenant-1",
    masterTemplateId: "old-template",
    assignmentStatus: "archived",
    active: false,
    assignedAt: "2026-05-18T09:00:00.000Z",
  },
];

const sampleTemplates = [
  { id: "signature-safari", name: "Signature Safari", status: "published" },
  { id: "old-template", name: "Legacy Trek", status: "draft" },
];

test("buildTenantAssignmentSummary resolves the active assignment and template", () => {
  const summary = buildTenantAssignmentSummary({
    tenant: sampleTenants[0],
    assignments: sampleAssignments,
    templates: sampleTemplates,
  });

  assert.equal(summary.activeAssignment.id, "assignment-1");
  assert.equal(summary.activeTemplate.name, "Signature Safari");
  assert.equal(summary.historyCount, 2);
});

test("buildTemplateAssignmentRows shapes tenant assignment rows", () => {
  const rows = buildTemplateAssignmentRows({
    tenants: sampleTenants,
    assignments: sampleAssignments,
    templates: sampleTemplates,
  });

  assert.equal(rows.length, 2);
  assert.equal(rows[0].activeTemplateName, "Signature Safari");
  assert.equal(rows[1].activeTemplateName, "No active template");
});

test("filterTemplateAssignmentRows applies search and status filters", () => {
  const rows = buildTemplateAssignmentRows({
    tenants: sampleTenants,
    assignments: sampleAssignments,
    templates: sampleTemplates,
  });

  const filtered = filterTemplateAssignmentRows(rows, {
    search: "kili",
    status: "active",
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].tenantId, "tenant-1");
});
