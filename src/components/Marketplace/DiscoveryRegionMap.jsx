const DiscoveryRegionMap = ({ regions = [], activeRegion = "", onSelectRegion, onClearRegion }) => (
  <section className="rounded-[36px] border border-[#d8c8ae] bg-white p-6 shadow-[0_20px_60px_rgba(35,66,50,0.08)] md:p-8">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#8b7451]">
          Region-first discovery
        </p>
        <h2 className="mt-2 text-2xl font-black uppercase tracking-tight text-slate-900">
          Start with the route region
        </h2>
        <p className="mt-3 max-w-2xl text-sm font-medium leading-7 text-slate-600">
          Pick a destination cluster on the map to filter the marketplace before you compare packages.
        </p>
      </div>
      {activeRegion ? (
        <button
          type="button"
          onClick={onClearRegion}
          className="rounded-full border border-slate-200 px-4 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-slate-600 transition hover:border-primary hover:text-primary"
        >
          Clear region
        </button>
      ) : null}
    </div>

    <div className="mt-8 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div className="rounded-[30px] border border-[#d9cfbe] bg-[#f8f4eb] p-4">
        <svg viewBox="0 0 100 100" className="h-[340px] w-full rounded-[24px] bg-[linear-gradient(180deg,#eef4ed_0%,#fdf8ef_100%)]">
          <path
            d="M15 18C24 12 39 11 54 15C65 18 74 18 84 26C89 31 90 41 86 49C83 56 76 60 71 68C66 75 58 86 44 85C29 84 18 77 15 65C12 54 9 50 11 40C12 32 8 23 15 18Z"
            fill="#dbe8d9"
            stroke="#bfd2bf"
            strokeWidth="1.5"
          />
          <path
            d="M58 18C65 20 74 22 80 30C82 34 84 41 82 46"
            fill="none"
            stroke="#aac3aa"
            strokeWidth="1"
            strokeDasharray="2 2"
          />
          {regions.map((region) => {
            const isActive = activeRegion === region.label;
            return (
              <g key={region.id}>
                <circle
                  cx={region.coordinates?.x || 50}
                  cy={region.coordinates?.y || 50}
                  r={isActive ? 7 : 5.2}
                  fill={isActive ? "#224433" : "#d9a441"}
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="cursor-pointer transition-all"
                  onClick={() => onSelectRegion?.(region.label)}
                />
                <text
                  x={(region.coordinates?.x || 50) + 4}
                  y={(region.coordinates?.y || 50) - 6}
                  fontSize="3.2"
                  fontWeight="800"
                  fill="#29412f"
                >
                  {region.label}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="space-y-3">
        {regions.map((region) => {
          const isActive = activeRegion === region.label;
          return (
            <button
              key={region.id}
              type="button"
              onClick={() => onSelectRegion?.(region.label)}
              className={`w-full rounded-[24px] border px-5 py-4 text-left transition ${
                isActive
                  ? "border-[#224433] bg-[#224433] text-white shadow-lg"
                  : "border-slate-200 bg-slate-50 text-slate-800 hover:border-primary hover:bg-white"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide">{region.label}</p>
                  <p className={`mt-2 text-sm font-medium ${isActive ? "text-white/80" : "text-slate-500"}`}>
                    {region.tourCount} tour{region.tourCount === 1 ? "" : "s"} from {region.operatorCount} operator
                    {region.operatorCount === 1 ? "" : "s"}
                  </p>
                </div>
                <span className={`text-sm font-black ${isActive ? "text-[#f4d589]" : "text-[#224433]"}`}>
                  From ${Number(region.startingPrice || 0).toLocaleString()}
                </span>
              </div>
              {(region.destinations || []).length > 0 ? (
                <div className="mt-3 flex flex-wrap gap-2">
                  {region.destinations.slice(0, 3).map((destination) => (
                    <span
                      key={`${region.id}-${destination}`}
                      className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] ${
                        isActive ? "bg-white/10 text-white" : "bg-white text-slate-500"
                      }`}
                    >
                      {destination}
                    </span>
                  ))}
                </div>
              ) : null}
            </button>
          );
        })}
      </div>
    </div>
  </section>
);

export default DiscoveryRegionMap;

