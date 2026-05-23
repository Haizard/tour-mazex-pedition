import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { FaArrowLeft, FaMapMarkerAlt, FaUtensils } from "react-icons/fa";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import RestaurantDirectInquiryForm from "../components/Marketplace/RestaurantDirectInquiryForm";
import RestaurantAiConciergeCard from "../components/Marketplace/RestaurantAiConciergeCard";
import { fetchPublicRestaurantBySlug } from "../services/api";
import {
  getRestaurantDiningReassuranceItems,
  getRestaurantOperatorTrustLabel,
  getRestaurantSponsoredDisclosure,
  getRestaurantTrustLabel,
} from "../components/Marketplace/restaurantTrustUtils";
import { buildRestaurantIntentOptions } from "./restaurantDiscoveryUtils";

const RestaurantDetail = () => {
  const { slug } = useParams();
  const [restaurant, setRestaurant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedIntentId, setSelectedIntentId] = useState("direct");

  useEffect(() => {
    const loadRestaurant = async () => {
      setLoading(true);
      try {
        const response = await fetchPublicRestaurantBySlug(slug);
        setRestaurant(response.data || null);
      } catch (error) {
        console.error("Restaurant detail error:", error);
        setRestaurant(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) loadRestaurant();
  }, [slug]);

  const intentOptions = useMemo(() => buildRestaurantIntentOptions(restaurant || {}), [restaurant]);
  const selectedIntent = useMemo(
    () => intentOptions.find((option) => option.id === selectedIntentId) || intentOptions[0],
    [intentOptions, selectedIntentId]
  );
  const defaultMessage = useMemo(
    () => (restaurant && selectedIntent ? selectedIntent.payload.message : ""),
    [restaurant, selectedIntent]
  );

  if (loading) {
    return <div className="min-h-screen bg-[#f6f1e8] pt-40 text-center font-bold text-slate-500">Loading restaurant...</div>;
  }

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-[#f6f1e8] px-6 pt-40 text-center">
        <h1 className="text-2xl font-black uppercase text-slate-900">Restaurant not found</h1>
        <Link to="/discover/restaurants" className="mt-6 inline-block rounded-2xl bg-[#224433] px-6 py-3 text-xs font-black uppercase tracking-widest text-white">Back to restaurants</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f6f1e8] px-5 pb-16 pt-32 text-slate-900 md:pt-40">
      <main className="mx-auto max-w-7xl">
        <Link to="/discover/restaurants" className="inline-flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-500">
          <FaArrowLeft /> Back to restaurants
        </Link>

        <section className="mt-8 overflow-hidden rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
          <div className="grid lg:grid-cols-[1.1fr_0.9fr]">
            <div className="flex min-h-[420px] items-center justify-center bg-slate-200">
              {restaurant.photos?.[0] ? <img src={restaurant.photos[0]} alt={restaurant.name} className="h-full w-full object-cover" /> : <FaUtensils className="text-7xl text-slate-400" />}
            </div>
            <div className="p-8 md:p-10">
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-[#8b7451]">Restaurant Marketplace</p>
              <h1 className="mt-4 text-4xl font-black uppercase tracking-tight md:text-5xl">{restaurant.name}</h1>
              <p className="mt-4 flex items-center gap-2 text-sm font-black uppercase tracking-[0.16em] text-slate-500">
                <FaMapMarkerAlt className="text-primary" /> {restaurant.destination || "Destination on request"}
              </p>
              <p className="mt-6 text-base font-medium leading-8 text-slate-600">{restaurant.description || restaurant.summary || "Restaurant details are being prepared by the listed operator."}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                {[...(restaurant.cuisineTypes || []), ...(restaurant.dietaryFits || [])].map((item) => <span key={item} className="rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black uppercase tracking-[0.16em] text-slate-600">{item}</span>)}
              </div>
              <p className="mt-6 text-sm font-black text-slate-900">{getRestaurantTrustLabel(restaurant)}</p>
              <p className="mt-2 text-[11px] font-black uppercase tracking-[0.16em] text-[#234232]">
                {getRestaurantOperatorTrustLabel(restaurant)}
              </p>
              <p className="mt-2 text-xs font-medium leading-5 text-slate-500">
                {getRestaurantSponsoredDisclosure(restaurant)}
              </p>
              {restaurant.openingHoursSummary ? (
                <div className="mt-4 rounded-2xl bg-[#eef6f0] px-4 py-4">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">Dining signal</p>
                  <p className="mt-2 text-sm font-bold text-slate-900">{restaurant.openingHoursSummary}</p>
                  <p className="mt-1 text-sm font-medium text-slate-600">
                    {restaurant.reservationStyleSummary || "Reservation details are confirmed by the operator."}
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        </section>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <div className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
              {restaurant.trustModules?.operatorCredibility?.title || "Operator credibility"}
            </p>
            <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
              {restaurant.trustModules?.operatorCredibility?.body ||
                getRestaurantOperatorTrustLabel(restaurant)}
            </p>
          </div>
          <div className="rounded-[28px] border border-[#d8c8ae] bg-white p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#8b7451]">
              {restaurant.trustModules?.restaurantProof?.title || "Restaurant proof"}
            </p>
            <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-slate-600">
              {(restaurant.trustModules?.restaurantProof?.items || [getRestaurantTrustLabel(restaurant)])
                .filter(Boolean)
                .map((item) => (
                  <li key={item}>{item}</li>
                ))}
            </ul>
          </div>
          <div className="rounded-[28px] border border-emerald-100 bg-[#eef6f0] p-5 shadow-sm">
            <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#234232]">
              {restaurant.trustModules?.diningReassurance?.title || "Dining reassurance"}
            </p>
            <ul className="mt-3 space-y-2 text-sm font-medium leading-6 text-slate-600">
              {(restaurant.trustModules?.diningReassurance?.items ||
                getRestaurantDiningReassuranceItems(restaurant)
              )
                .filter(Boolean)
                .map((item) => (
                  <li key={item}>{item}</li>
                ))}
            </ul>
          </div>
        </section>

        <div className="mt-8 grid gap-8 xl:grid-cols-[minmax(0,1fr)_420px]">
          <RestaurantAiConciergeCard restaurant={restaurant} />
          <aside className="rounded-[36px] border border-[#d8c8ae] bg-white shadow-[0_24px_80px_rgba(35,66,50,0.12)]">
            <div className="bg-[#234232] p-6 text-white">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[#d9c79f]">Restaurant Inquiry</p>
              <h2 className="mt-2 text-2xl font-black uppercase tracking-tight">
                {selectedIntent?.label || "Request this restaurant"}
              </h2>
              <p className="mt-3 text-sm font-medium leading-6 text-white/75">
                {selectedIntent?.description || "Ask directly about this restaurant or request it inside a wider itinerary."}
              </p>
              <div className="mt-5 grid grid-cols-2 gap-2 rounded-2xl bg-white/10 p-1">
                {intentOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onClick={() => setSelectedIntentId(option.id)}
                    className={`rounded-xl px-3 py-3 text-[10px] font-black uppercase tracking-[0.14em] transition ${
                      selectedIntentId === option.id
                        ? "bg-white text-[#234232]"
                        : "text-white/75 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.id === "direct" ? "Direct" : "Itinerary"}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-1">
              {selectedIntent?.intentType === "direct-restaurant" ? (
                <RestaurantDirectInquiryForm restaurant={restaurant} />
              ) : (
                <PlanMyTripWizard
                  compact
                  showIntro={false}
                  sourceChannel={selectedIntent.payload.sourceChannel}
                  campaignLabel={selectedIntent.payload.campaignLabel}
                  defaultDestinations={selectedIntent.payload.destinations}
                  defaultMessage={defaultMessage}
                  operatorTenantId={selectedIntent.payload.operatorTenantId}
                  operatorTenantSlug={selectedIntent.payload.operatorTenantSlug}
                  restaurantId={selectedIntent.payload.restaurantId}
                  restaurantName={selectedIntent.payload.restaurantName}
                  restaurantIntentType={selectedIntent.payload.restaurantIntentType}
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default RestaurantDetail;
