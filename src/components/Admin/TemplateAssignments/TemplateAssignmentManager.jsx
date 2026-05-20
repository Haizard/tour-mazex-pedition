import { useEffect, useMemo, useState } from "react";

import {
  assignPlatformTemplateToTenant,
  fetchPlatformTemplateAssignments,
} from "../../../services/api";
import {
  buildTemplateAssignmentRows,
  buildTenantAssignmentSummary,
  filterTemplateAssignmentRows,
} from "./templateAssignmentState";

const inputClass =
  "w-full rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-semibold text-zinc-950 outline-none focus:border-zinc-950";

const panelClass = "rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm";

const formatAssignedAt = (value = "") => {
  if (!value) {
    return "Not assigned yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not assigned yet";
  }

  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TemplateAssignmentManager = ({
  tenants = [],
  templates = [],
  selectedTenant = null,
}) => {
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadAssignments = async () => {
      setLoading(true);
      try {
        const response = await fetchPlatformTemplateAssignments();
        if (!cancelled) {
          setAssignments(Array.isArray(response.data?.assignments) ? response.data.assignments : []);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error?.response?.data?.message || "Failed to load template assignments.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadAssignments();

    return () => {
      cancelled = true;
    };
  }, []);

  const rows = useMemo(
    () => buildTemplateAssignmentRows({ tenants, assignments, templates }),
    [assignments, templates, tenants]
  );
  const visibleRows = useMemo(
    () => filterTemplateAssignmentRows(rows, { search, status }),
    [rows, search, status]
  );

  const assignmentCounts = useMemo(() => {
    const counts = {};
    assignments.forEach((assignment) => {
      if (assignment.active === false) {
        return;
      }
      counts[assignment.masterTemplateId] = (counts[assignment.masterTemplateId] || 0) + 1;
    });
    return counts;
  }, [assignments]);

  const selectedSummary = useMemo(
    () => buildTenantAssignmentSummary({ tenant: selectedTenant, assignments, templates }),
    [assignments, selectedTenant, templates]
  );

  useEffect(() => {
    if (!selectedTenant) {
      setSelectedTemplateId("");
      return;
    }

    setSelectedTemplateId(selectedSummary.activeAssignment?.masterTemplateId || "");
  }, [selectedSummary.activeAssignment?.masterTemplateId, selectedTenant]);

  const handleAssign = async () => {
    if (!selectedTenant?._id || !selectedTemplateId) {
      return;
    }

    setAssigning(true);
    setMessage("");
    try {
      const response = await assignPlatformTemplateToTenant({
        tenantId: selectedTenant._id,
        masterTemplateId: selectedTemplateId,
      });

      const responseHistory = Array.isArray(response.data?.history) ? response.data.history : [];
      setAssignments((current) => {
        const remaining = current.filter((assignment) => assignment.tenantId !== selectedTenant._id);
        return [...responseHistory, ...remaining];
      });
      setMessage(response.data?.message || "Template assignment updated.");
    } catch (error) {
      setMessage(error?.response?.data?.message || "Failed to assign template.");
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="mt-8 grid grid-cols-1 gap-6 xl:grid-cols-[1.2fr_0.9fr]">
      <div className={panelClass}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Active Assignments
            </p>
            <h3 className="mt-2 text-2xl font-black text-zinc-950">
              Platform-owned template control
            </h3>
          </div>
          <p className="max-w-xl text-sm font-medium text-zinc-500">
            Keep one active website template per tenant while preserving assignment history for
            controlled Template Studio personalization.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_180px]">
          <input
            className={inputClass}
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search tenant or template..."
          />
          <select
            className={inputClass}
            value={status}
            onChange={(event) => setStatus(event.target.value)}
          >
            <option value="all">All statuses</option>
            <option value="active">Active</option>
            <option value="unassigned">Unassigned</option>
          </select>
        </div>

        <div className="mt-6 space-y-3">
          {loading && <p className="text-sm font-medium text-zinc-500">Loading assignments...</p>}
          {!loading &&
            visibleRows.map((row) => (
              <div
                key={row.tenantId}
                className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4"
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-sm font-black text-zinc-950">{row.tenantName}</p>
                    <p className="text-xs font-semibold text-zinc-500">
                      {row.tenantSlug} · {row.activeTemplateName}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest">
                    <span className="rounded-full bg-zinc-950 px-3 py-1 text-white">
                      {row.activeAssignmentStatus}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                      {row.historyCount} record{row.historyCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white px-3 py-1 text-zinc-600">
                      {formatAssignedAt(row.assignedAt)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          {!loading && !visibleRows.length && (
            <p className="text-sm font-medium text-zinc-500">No tenants match the current filters.</p>
          )}
        </div>
      </div>

      <div className="space-y-6">
        <div className={panelClass}>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Template Coverage
          </p>
          <div className="mt-5 space-y-3">
            {templates.map((template) => (
              <div
                key={template.id}
                className="flex items-center justify-between rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-4"
              >
                <div>
                  <p className="text-sm font-black text-zinc-950">{template.name}</p>
                  <p className="text-xs font-semibold text-zinc-500">
                    {template.category || template.pageType || "Website Template"}
                  </p>
                </div>
                <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black uppercase tracking-widest text-zinc-700">
                  {assignmentCounts[template.id] || 0} active tenant
                  {(assignmentCounts[template.id] || 0) === 1 ? "" : "s"}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className={panelClass}>
          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-500">
            Selected Tenant
          </p>
          <h3 className="mt-2 text-xl font-black text-zinc-950">
            {selectedTenant?.name || "Choose a tenant"}
          </h3>
          <p className="mt-2 text-sm font-medium text-zinc-500">
            {selectedSummary.activeTemplate
              ? `Currently running ${selectedSummary.activeTemplate.name}. Switching creates a fresh active assignment and preserves history.`
              : "Assign a single active website template to unlock controlled Template Studio personalization."}
          </p>

          <div className="mt-5 space-y-4">
            <select
              className={inputClass}
              disabled={!selectedTenant}
              value={selectedTemplateId}
              onChange={(event) => setSelectedTemplateId(event.target.value)}
            >
              <option value="">Choose a master template</option>
              {templates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              disabled={!selectedTenant || !selectedTemplateId || assigning}
              onClick={handleAssign}
              className="w-full rounded-xl bg-zinc-950 px-5 py-3 text-sm font-black uppercase tracking-widest text-white disabled:opacity-50"
            >
              {assigning ? "Assigning..." : "Assign Active Template"}
            </button>
          </div>

          {message && (
            <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
              {message}
            </div>
          )}

          <div className="mt-5 space-y-2">
            {(assignments || [])
              .filter((assignment) => assignment.tenantId === selectedTenant?._id)
              .slice(0, 5)
              .map((assignment) => {
                const template = templates.find((entry) => entry.id === assignment.masterTemplateId);
                return (
                  <div
                    key={assignment._id || assignment.id}
                    className="rounded-2xl border border-zinc-200 bg-zinc-50/80 px-4 py-3"
                  >
                    <p className="text-sm font-black text-zinc-950">
                      {template?.name || assignment.masterTemplateId}
                    </p>
                    <p className="text-xs font-semibold text-zinc-500">
                      {assignment.active === false ? "Archived" : "Active"} · {formatAssignedAt(assignment.assignedAt)}
                    </p>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateAssignmentManager;
