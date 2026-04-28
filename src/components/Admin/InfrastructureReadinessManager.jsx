import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Card from "../UI/Card";
import {
  fetchBusinessTruthRegistry,
  fetchInfrastructureHealth,
  fetchOperationsRecordReadModel,
  fetchPartnerRecordReadModel,
  fetchRevenueRecordReadModel,
  fetchTravelerRecordReadModel,
} from "../../services/api";

const toneClasses = {
  active: "bg-emerald-50 text-emerald-700",
  "shadow-prep": "bg-amber-50 text-amber-700",
  planned: "bg-slate-100 text-slate-700",
};

const InfrastructureReadinessManager = () => {
  const [registry, setRegistry] = useState(null);
  const [health, setHealth] = useState(null);
  const [operationsReadModel, setOperationsReadModel] = useState(null);
  const [partnerReadModel, setPartnerReadModel] = useState(null);
  const [revenueReadModel, setRevenueReadModel] = useState(null);
  const [travelerReadModel, setTravelerReadModel] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [
          registryResponse,
          healthResponse,
          operationsResponse,
          partnerResponse,
          revenueResponse,
          travelerResponse,
        ] = await Promise.all([
          fetchBusinessTruthRegistry(),
          fetchInfrastructureHealth(),
          fetchOperationsRecordReadModel(),
          fetchPartnerRecordReadModel(),
          fetchRevenueRecordReadModel(),
          fetchTravelerRecordReadModel(),
        ]);

        setRegistry(registryResponse.data);
        setHealth(healthResponse.data);
        setOperationsReadModel(operationsResponse.data);
        setPartnerReadModel(partnerResponse.data);
        setRevenueReadModel(revenueResponse.data);
        setTravelerReadModel(travelerResponse.data);
      } catch (requestError) {
        setError(requestError.response?.data?.message || "Unable to load data-platform readiness.");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const services = health?.services || [];
  const entities = registry?.entities || [];
  const cutoverPlan = registry?.cutoverPlan || [];
  const operationsSummary = operationsReadModel?.summary || [];
  const recentOperationsRecords = operationsReadModel?.recentRecords || [];
  const partnerSummary = partnerReadModel?.summary || [];
  const recentPartnerRecords = partnerReadModel?.recentRecords || [];
  const revenueSummary = revenueReadModel?.summary || [];
  const recentRevenueRecords = revenueReadModel?.recentRecords || [];
  const travelerSummary = travelerReadModel?.summary || [];
  const recentTravelerRecords = travelerReadModel?.recentRecords || [];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-primary">
            Migration Control
          </p>
          <h2 className="text-3xl font-black uppercase tracking-tighter text-gray-900">
            Data Platform Readiness
          </h2>
          <p className="mt-2 max-w-3xl text-sm font-medium text-slate-500">
            Track what still lives in MongoDB today, what is moving into PostgreSQL next, and which
            supporting infrastructure layers are ready for shadow migration.
          </p>
        </div>
        <Badge variant="accent">{entities.length} Truth Domains</Badge>
      </div>

      {error && (
        <div className="rounded-3xl border border-red-200 bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
          {error}
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card className="border-none p-8 shadow-xl">
          <div className="mb-6 flex items-center justify-between gap-3">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              Infrastructure Services
            </h3>
            {health?.shadowMigrationEnabled && <Badge variant="accent">Shadow Ready</Badge>}
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {loading && <p className="text-sm font-medium text-slate-500">Loading services...</p>}
            {!loading &&
              services.map((service) => (
                <div key={service.key} className="rounded-[28px] border border-slate-200 bg-white p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                      {service.label}
                    </p>
                    <span
                      className={`rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest ${
                        toneClasses[service.mode] || toneClasses.planned
                      }`}
                    >
                      {service.mode}
                    </span>
                    <Badge variant={service.configured ? "accent" : "secondary"}>
                      {service.configured ? "Configured" : "Not Configured"}
                    </Badge>
                  </div>
                  <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                    {(health?.targetServices || []).find((target) => target.key === service.key)?.role ||
                      "No service description available."}
                  </p>
                  {service.notes?.length > 0 && (
                    <p className="mt-3 text-xs font-bold leading-5 text-slate-500">
                      {service.notes.join(" ")}
                    </p>
                  )}
                </div>
              ))}
          </div>
        </Card>

        <Card className="border-none p-8 shadow-xl">
          <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
            Cutover Waves
          </h3>
          <div className="space-y-4">
            {loading && <p className="text-sm font-medium text-slate-500">Loading cutover plan...</p>}
            {!loading &&
              cutoverPlan.map((wave) => (
                <div key={wave.wave} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                      {wave.label}
                    </p>
                    <Badge variant="secondary">{wave.entities.length} Domains</Badge>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {wave.entities.map((entity) => (
                      <Badge key={entity.key} variant="secondary">
                        {entity.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </Card>
      </div>

      <Card className="border-none p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              PostgreSQL Partner Read Model
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Distribution partners and referral-network truth now queried directly from the
              dedicated PostgreSQL partner table.
            </p>
          </div>
          <Badge variant={partnerReadModel?.configured ? "accent" : "secondary"}>
            {partnerReadModel?.configured ? "Live From PostgreSQL" : "Not Connected"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading && <p className="text-sm font-medium text-slate-500">Loading partner records...</p>}
          {!loading &&
            partnerSummary.map((item) => (
              <div key={item.partnerType} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {item.partnerType}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {item.totalRecords}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Active {item.activeRecords}
                </p>
              </div>
            ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              Recent Partner Records
            </h4>
            {partnerReadModel?.generatedAt && (
              <p className="text-xs font-bold text-slate-400">
                Snapshot {new Date(partnerReadModel.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {loading && <p className="text-sm font-medium text-slate-500">Loading recent partners...</p>}
          {!loading && recentPartnerRecords.length === 0 && (
            <p className="text-sm font-medium text-slate-500">
              No PostgreSQL partner records have been synced for this tenant yet.
            </p>
          )}
          {!loading &&
            recentPartnerRecords.map((record) => (
              <div
                key={record.sourceId}
                className="rounded-[24px] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {record.companyName || record.sourceId}
                      </p>
                      <Badge variant="secondary">{record.partnerType}</Badge>
                      <Badge variant="secondary">{record.status}</Badge>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {record.serviceFocus || "No service focus set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-xs font-bold text-slate-400">
                      {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "Unknown sync"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              PostgreSQL Operations Read Model
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Guide assignments, accommodation stays, and airport transfers coming straight from
              the dedicated PostgreSQL operations tables.
            </p>
          </div>
          <Badge variant={operationsReadModel?.configured ? "accent" : "secondary"}>
            {operationsReadModel?.configured ? "Live From PostgreSQL" : "Not Connected"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading && <p className="text-sm font-medium text-slate-500">Loading operations records...</p>}
          {!loading &&
            operationsSummary.map((item) => (
              <div key={item.recordType} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {item.recordType}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {item.totalRecords}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Active {item.activeRecords}
                </p>
              </div>
            ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              Recent Operations Records
            </h4>
            {operationsReadModel?.generatedAt && (
              <p className="text-xs font-bold text-slate-400">
                Snapshot {new Date(operationsReadModel.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {loading && <p className="text-sm font-medium text-slate-500">Loading recent operations...</p>}
          {!loading && recentOperationsRecords.length === 0 && (
            <p className="text-sm font-medium text-slate-500">
              No PostgreSQL operations records have been synced for this tenant yet.
            </p>
          )}
          {!loading &&
            recentOperationsRecords.map((record) => (
              <div
                key={`${record.recordType}-${record.sourceId}`}
                className="rounded-[24px] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{record.recordType}</Badge>
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {record.label || record.sourceId}
                      </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {record.supportingLabel || "No secondary label"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="accent">{record.stage}</Badge>
                    <p className="text-xs font-bold text-slate-400">
                      {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "Unknown sync"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              PostgreSQL Revenue Read Model
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              These totals come directly from the dedicated PostgreSQL revenue tables, not the
              original MongoDB collections.
            </p>
          </div>
          <Badge variant={revenueReadModel?.configured ? "accent" : "secondary"}>
            {revenueReadModel?.configured ? "Live From PostgreSQL" : "Not Connected"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading && <p className="text-sm font-medium text-slate-500">Loading revenue records...</p>}
          {!loading &&
            revenueSummary.map((item) => (
              <div key={item.recordType} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {item.recordType}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {item.totalRecords}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Value {item.currency} {item.totalValue.toLocaleString()}
                </p>
              </div>
            ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              Recent Synced Records
            </h4>
            {revenueReadModel?.generatedAt && (
              <p className="text-xs font-bold text-slate-400">
                Snapshot {new Date(revenueReadModel.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {loading && <p className="text-sm font-medium text-slate-500">Loading recent records...</p>}
          {!loading && recentRevenueRecords.length === 0 && (
            <p className="text-sm font-medium text-slate-500">
              No PostgreSQL revenue records have been synced for this tenant yet.
            </p>
          )}
          {!loading &&
            recentRevenueRecords.map((record) => (
              <div
                key={`${record.recordType}-${record.sourceId}`}
                className="rounded-[24px] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="secondary">{record.recordType}</Badge>
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {record.label || record.sourceId}
                      </p>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {record.sourceId}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="accent">{record.stage}</Badge>
                    <p className="text-sm font-black text-slate-900">
                      {record.currency} {record.amount.toLocaleString()}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "Unknown sync"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">
              PostgreSQL Traveler Read Model
            </h3>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Lead qualification and traveler-source truth coming directly from the dedicated
              PostgreSQL inquiry table.
            </p>
          </div>
          <Badge variant={travelerReadModel?.configured ? "accent" : "secondary"}>
            {travelerReadModel?.configured ? "Live From PostgreSQL" : "Not Connected"}
          </Badge>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          {loading && <p className="text-sm font-medium text-slate-500">Loading traveler records...</p>}
          {!loading &&
            travelerSummary.map((item) => (
              <div key={item.leadStage} className="rounded-[28px] border border-slate-200 bg-slate-50 p-5">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-primary">
                  {item.leadStage}
                </p>
                <p className="mt-3 text-3xl font-black tracking-tight text-slate-900">
                  {item.totalRecords}
                </p>
                <p className="mt-2 text-sm font-bold text-slate-500">
                  Avg lead score {item.averageLeadScore.toLocaleString()}
                </p>
              </div>
            ))}
        </div>

        <div className="mt-8 space-y-4">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900">
              Recent Traveler Records
            </h4>
            {travelerReadModel?.generatedAt && (
              <p className="text-xs font-bold text-slate-400">
                Snapshot {new Date(travelerReadModel.generatedAt).toLocaleString()}
              </p>
            )}
          </div>

          {loading && <p className="text-sm font-medium text-slate-500">Loading recent travelers...</p>}
          {!loading && recentTravelerRecords.length === 0 && (
            <p className="text-sm font-medium text-slate-500">
              No PostgreSQL traveler records have been synced for this tenant yet.
            </p>
          )}
          {!loading &&
            recentTravelerRecords.map((record) => (
              <div
                key={record.sourceId}
                className="rounded-[24px] border border-slate-200 bg-white px-5 py-4"
              >
                <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {record.travelerName || record.sourceId}
                      </p>
                      <Badge variant="secondary">{record.leadStage}</Badge>
                      <Badge variant="secondary">{record.status}</Badge>
                    </div>
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">
                      {record.sourceChannel} • {record.destinations.join(", ") || "No destination set"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <Badge variant="accent">{record.leadTemperature}</Badge>
                    <p className="text-sm font-black text-slate-900">
                      Score {record.leadScore}
                    </p>
                    <p className="text-xs font-bold text-slate-400">
                      {record.updatedAt ? new Date(record.updatedAt).toLocaleString() : "Unknown sync"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>

      <Card className="border-none p-8 shadow-xl">
        <h3 className="mb-6 text-xl font-black uppercase tracking-tight text-slate-900">
          Business Truth Map
        </h3>

        <div className="space-y-4">
          {loading && <p className="text-sm font-medium text-slate-500">Loading truth map...</p>}
          {!loading &&
            entities.map((entity) => (
              <div key={entity.key} className="rounded-[28px] border border-slate-200 bg-white px-5 py-5">
                <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black uppercase tracking-wide text-slate-900">
                        {entity.label}
                      </p>
                      <Badge variant="secondary">Now {entity.currentOwner}</Badge>
                      <Badge variant="accent">Target {entity.targetOwner}</Badge>
                      <Badge variant="secondary">{entity.serviceBoundary}</Badge>
                    </div>
                    <p className="text-sm font-medium leading-6 text-slate-600">{entity.notes}</p>
                  </div>
                  <div className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Wave {entity.cutoverWave} • Order {entity.cutoverOrder}
                  </div>
                </div>
              </div>
            ))}
        </div>
      </Card>
    </div>
  );
};

export default InfrastructureReadinessManager;
