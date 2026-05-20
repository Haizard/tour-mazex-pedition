import mongoose from "mongoose";

const tenantTemplateAssignmentSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
      index: true,
    },
    masterTemplateId: { type: String, required: true, trim: true, lowercase: true },
    active: { type: Boolean, default: true },
    assignmentStatus: {
      type: String,
      enum: ["active", "archived", "pending"],
      default: "active",
    },
    assignedAt: { type: Date, default: Date.now },
    assignedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PlatformAdmin",
      default: null,
    },
    endedAt: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

tenantTemplateAssignmentSchema.index(
  { tenantId: 1, active: 1 },
  {
    unique: true,
    partialFilterExpression: { active: true },
    name: "one_active_template_assignment_per_tenant",
  }
);

const TenantTemplateAssignment =
  mongoose.models.TenantTemplateAssignment ||
  mongoose.model("TenantTemplateAssignment", tenantTemplateAssignmentSchema);

export default TenantTemplateAssignment;
