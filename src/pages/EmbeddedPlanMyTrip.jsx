import { useLocation } from "react-router-dom";

import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import { useTenant } from "../context/TenantContext";

const EmbeddedPlanMyTrip = () => {
  const location = useLocation();
  const { tenant } = useTenant();
  const searchParams = new URLSearchParams(location.search);

  return (
    <div className="min-h-screen bg-slate-50 px-4 py-6 md:px-6">
      <div className="mx-auto max-w-5xl">
        <div className="mb-5 rounded-[28px] border border-slate-200 bg-white px-5 py-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-[0.28em] text-primary">
            Embedded Planner
          </p>
          <h1 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
            {tenant?.name || "Tour Operator"} Trip Planner
          </h1>
          <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
            Share your route, timing, and travel style. This form is designed to capture safari-ready
            leads from partner sites, blogs, and campaign pages without leaving the host experience.
          </p>
        </div>

        <PlanMyTripWizard
          compact
          sourceChannel={searchParams.get("source") || "embed-widget"}
          campaignLabel={searchParams.get("campaign") || "embed-launch"}
          defaultReferralCode={searchParams.get("referral") || ""}
          defaultDestinations={searchParams.get("destination") ? [searchParams.get("destination")] : []}
        />
      </div>
    </div>
  );
};

export default EmbeddedPlanMyTrip;
