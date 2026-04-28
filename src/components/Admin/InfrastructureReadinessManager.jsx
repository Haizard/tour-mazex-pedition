import { useEffect, useState } from "react";

import Badge from "../UI/Badge";
import Card from "../UI/Card";
import {
  fetchBusinessTruthRegistry,
  fetchInfrastructureHealth,
} from "../../services/api";

const toneClasses = {
  active: "bg-emerald-50 text-emerald-700",
  "shadow-prep": "bg-amber-50 text-amber-700",
  planned: "bg-slate-100 text-slate-700",
};

const InfrastructureReadinessManager = () => {
  const [registry, setRegistry] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError("");

      try {
        const [registryResponse, healthResponse] = await Promise.all([
          fetchBusinessTruthRegistry(),
          fetchInfrastructureHealth(),
        ]);

        setRegistry(registryResponse.data);
        setHealth(healthResponse.data);
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
