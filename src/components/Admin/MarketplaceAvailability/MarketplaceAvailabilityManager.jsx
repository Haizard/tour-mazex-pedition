import React, { useEffect, useMemo, useState } from "react";

import {
  applyMarketplaceAvailabilityBulkAction,
  createMarketplaceAvailabilityEntry,
  deleteMarketplaceAvailabilityEntry as removeMarketplaceAvailabilityEntry,
  fetchMarketplaceAvailabilityTourSchedule,
  fetchMarketplaceAvailabilityWorkspace,
  updateMarketplaceAvailabilityEntry as saveMarketplaceAvailabilityEntry,
} from "../../../services/api";
import AvailabilityBulkActionsBar from "./AvailabilityBulkActionsBar";
import AvailabilityFiltersBar from "./AvailabilityFiltersBar";
import AvailabilityHealthPanel from "./AvailabilityHealthPanel";
import AvailabilityOperationsTable from "./AvailabilityOperationsTable";
import AvailabilitySummaryStrip from "./AvailabilitySummaryStrip";
import {
  buildAvailabilityBulkPayload,
  filterAvailabilityRows,
  toggleAvailabilitySelection,
} from "./availabilityManagerState";
import TourScheduleDrawer from "./TourScheduleDrawer";

const MarketplaceAvailabilityManager = () => {
  const [workspace, setWorkspace] = useState({ rows: [], health: [], tours: [] });
  const [filters, setFilters] = useState({
    search: "",
    packageId: "",
    status: "",
    month: "",
    instantReady: false,
    requestOnly: false,
  });
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [schedule, setSchedule] = useState(null);
  const [activeTourId, setActiveTourId] = useState("");

  const loadWorkspace = async () => {
    setLoading(true);
    try {
      const response = await fetchMarketplaceAvailabilityWorkspace();
      setWorkspace(response.data || { rows: [], health: [], tours: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadWorkspace();
  }, []);

  const filteredRows = useMemo(
    () => filterAvailabilityRows(workspace.rows || [], filters),
    [workspace.rows, filters]
  );
  const topDemandTours = useMemo(
    () =>
      [...(workspace.tours || [])]
        .sort((left, right) => (right.demandScore || 0) - (left.demandScore || 0))
        .slice(0, 3),
    [workspace.tours]
  );

  const openTour = async (tourId) => {
    setActiveTourId(tourId);
    const response = await fetchMarketplaceAvailabilityTourSchedule(tourId);
    setSchedule(response.data);
  };

  const refreshTour = async (tourId) => {
    await Promise.all([loadWorkspace(), openTour(tourId)]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-[2rem] border border-zinc-200 bg-gradient-to-br from-zinc-950 via-zinc-900 to-zinc-800 px-6 py-7 text-white shadow-xl">
        <p className="text-xs font-black uppercase tracking-[0.24em] text-zinc-300">
          Marketplace Availability
        </p>
        <h2 className="mt-3 text-3xl font-black tracking-tight">
          Hybrid departure operations
        </h2>
        <p className="mt-3 max-w-3xl text-sm font-medium text-zinc-300">
          Manage guaranteed, limited, sold-out, and on-request departures across all live marketplace tours without diving back into each package editor.
        </p>
      </div>

      <AvailabilityFiltersBar
        filters={filters}
        tours={workspace.tours || []}
        onChange={(key, value) => setFilters((current) => ({ ...current, [key]: value }))}
      />

      <AvailabilitySummaryStrip summary={workspace.summary || {}} />

      <AvailabilityBulkActionsBar
        selectionCount={selectedRowIds.length}
        onAction={async (action, extra = {}) => {
          try {
            const { tourId, payload } = buildAvailabilityBulkPayload({
              action,
              rowIds: selectedRowIds,
              rows: workspace.rows || [],
              ...extra,
            });
            await applyMarketplaceAvailabilityBulkAction(tourId, payload);
            setSelectedRowIds([]);
            await loadWorkspace();
            if (activeTourId === tourId) {
              await openTour(tourId);
            }
          } catch (error) {
            alert(error?.response?.data?.message || error.message || "Unable to apply bulk action.");
          }
        }}
      />

      <div className="grid gap-6 2xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.65fr)]">
        <AvailabilityOperationsTable
          rows={filteredRows}
          selectedRowIds={selectedRowIds}
          onToggleRow={(rowId) =>
            setSelectedRowIds((current) => toggleAvailabilitySelection(current, rowId))
          }
          onOpenTour={openTour}
          onStatusChange={async (row, status) => {
            await saveMarketplaceAvailabilityEntry(row.tourId, row.dateKey, { status });
            await loadWorkspace();
            if (activeTourId === row.tourId) {
              await openTour(row.tourId);
            }
          }}
        />

        <AvailabilityHealthPanel
          health={workspace.health || []}
          topDemandTours={topDemandTours}
          onOpenTour={openTour}
        />
      </div>

      {loading && (
        <div className="rounded-3xl border border-zinc-200 bg-white px-5 py-4 text-sm font-semibold text-zinc-500 shadow-sm">
          Loading availability workspace...
        </div>
      )}

      <TourScheduleDrawer
        isOpen={Boolean(schedule)}
        schedule={schedule}
        onClose={() => {
          setSchedule(null);
          setActiveTourId("");
        }}
        onAddEntry={async (draft) => {
          await createMarketplaceAvailabilityEntry(activeTourId, draft);
          await refreshTour(activeTourId);
        }}
        onUpdateEntry={async (dateKey, patch) => {
          await saveMarketplaceAvailabilityEntry(activeTourId, dateKey, patch);
          await refreshTour(activeTourId);
        }}
        onDeleteEntry={async (dateKey) => {
          await removeMarketplaceAvailabilityEntry(activeTourId, dateKey);
          await refreshTour(activeTourId);
        }}
      />
    </div>
  );
};

export default MarketplaceAvailabilityManager;
