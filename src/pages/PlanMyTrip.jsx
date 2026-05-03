import { useLocation } from "react-router-dom";
import PlanMyTripWizard from "../components/PlanMyTrip/PlanMyTripWizard";
import Testimonial from "../components/Testimonial/Testimonial";
import TripCTA from "../components/Home/TripCTA";
import LogoSlider from "../components/Home/LogoSlider";
import HeroImage from "../assets/tembo.jpg";

const PlanMyTrip = () => {
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const sourceChannel = searchParams.get("source") || "plan-my-trip";
  const campaignLabel = searchParams.get("campaign") || "";
  const defaultReferralCode = searchParams.get("referral") || "";
  const defaultDestinations = searchParams.get("destination")
    ? [searchParams.get("destination")]
    : [];

  return (
    <div className="min-h-screen bg-gray-50 pt-24">
      <section className="relative overflow-hidden">
        <div
          className="min-h-[360px] bg-cover bg-center md:min-h-[440px]"
          style={{ backgroundImage: `url(${HeroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/55 to-black/30" />
          <div className="relative container mx-auto flex min-h-[360px] items-center px-4 py-16 md:min-h-[440px]">
            <div className="max-w-3xl text-white">
              <p className="text-[11px] font-black uppercase tracking-[0.38em] text-safari-gold">
                Plan My Trip
              </p>
              <h1 className="mt-5 text-4xl font-black uppercase tracking-tight md:text-6xl">
                Build your Tanzania journey with us
              </h1>
              <p className="mt-5 max-w-2xl text-base leading-8 text-white/85 md:text-lg">
                Share your route ideas, dates, group size, and comfort style.
                Our safari team will turn your answers into a custom itinerary
                designed around the exact experience you want.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="pb-16 pt-16">
        <div className="container mx-auto px-4">
          <div className="mx-auto mb-8 max-w-4xl text-center">
            <p className="text-[11px] font-black uppercase tracking-[0.35em] text-primary">
              Consultation Form
            </p>
            <h2 className="mt-4 text-4xl font-black uppercase tracking-tighter text-slate-900 md:text-5xl">
              Let us plan it properly
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600">
              Complete each step and we will use the details to shape a safari
              proposal that matches your timing, route, and accommodation
              preferences.
            </p>
          </div>

          <div className="mx-auto max-w-5xl">
            <PlanMyTripWizard
              sourceChannel={sourceChannel}
              campaignLabel={campaignLabel}
              defaultReferralCode={defaultReferralCode}
              defaultDestinations={defaultDestinations}
            />
          </div>
        </div>
      </section>

      <Testimonial />

      <div className="mt-6 md:mt-10">
        <TripCTA />
      </div>
      <LogoSlider />
    </div>
  );
};

export default PlanMyTrip;
