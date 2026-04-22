import React, { useMemo, useState } from "react";
import { createInquiry } from "../../services/api";
import {
  FaArrowLeft,
  FaArrowRight,
  FaCheck,
  FaClock,
  FaMapMarkedAlt,
  FaRegCommentDots,
  FaRoute,
} from "react-icons/fa";

const initialFormData = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  destinations: [],
  tripLengthDays: "",
  adults: 1,
  childrenUnder5: 0,
  children6To15: 0,
  travelWhen: "",
  sleepingArrangement: "",
  accommodationPreferences: [],
  message: "",
  contactPreference: "whatsapp",
};

const destinationOptions = [
  "Tanzania Safari",
  "Kilimanjaro Trekking",
  "Tanzania Safari + Zanzibar",
];

const accommodationOptions = [
  "Luxury Lodge",
  "Boutique Lodge",
  "5 Stars Property",
  "4 Stars Property",
  "3 Stars Property",
  "Tented Camp",
  "Private Villa",
  "Family-Friendly Stay",
  "Honeymoon Setup",
  "Budget-Friendly Stay",
];

const stepConfig = [
  {
    id: "contact",
    title: "About You",
    icon: <FaRegCommentDots />,
    description: "Tell us who we are planning this safari for.",
  },
  {
    id: "trip",
    title: "Trip Basics",
    icon: <FaMapMarkedAlt />,
    description: "Choose the destination ideas and travel setup.",
  },
  {
    id: "stay",
    title: "Stay Style",
    icon: <FaClock />,
    description: "Share your timing and accommodation preferences.",
  },
  {
    id: "final",
    title: "Final Details",
    icon: <FaRoute />,
    description: "Add the final requirements so we can design the itinerary.",
  },
];

const IntroCard = ({ onCancel, onProceed }) => {
  return (
    <div className="overflow-hidden rounded-[24px] border border-white/10 bg-[#f8f3ec] shadow-xl">
      <div className="grid grid-cols-1 md:grid-cols-[1fr_1fr]">
        <div className="bg-[#17331c] p-6 md:p-8 text-white">
          <div className="mb-3 inline-flex rounded-full border border-white/20 px-3 py-0.5 text-[9px] font-black uppercase tracking-[0.3em] text-white/80">
            Plan My Trip
          </div>
          <h2 className="text-2xl font-black uppercase leading-tight tracking-tight md:text-3xl">
            Build your safari trip, step by step.
          </h2>
          <p className="mt-4 text-[11px] leading-relaxed text-white/80 font-medium">
            This planner helps us understand your preferred destinations,
            travel dates, room style, and who is traveling with you so we can
            shape a custom Tanzania itinerary around your exact needs.
          </p>
        </div>

        <div className="p-6 md:p-8 bg-white">
          <div className="space-y-4">
            <div className="rounded-xl border border-[#d8c9b7] bg-white p-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-primary">
                Quick Guide
              </p>
              <ul className="mt-3 space-y-2 text-[11px] font-bold leading-relaxed text-slate-600">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Choose your destinations
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Share traveler details
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">→</span>
                  Select your stay style
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={onProceed}
              className="flex-1 rounded-xl bg-primary px-4 py-3 text-[11px] font-black uppercase tracking-widest text-white shadow-md transition-all hover:bg-primary/90"
            >
              Start Planning
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="rounded-xl border border-slate-200 px-4 py-3 text-[11px] font-black uppercase tracking-widest text-slate-500 hover:bg-slate-50"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const PlanMyTripWizard = ({
  compact = false,
  showIntro = false,
  onCancel,
  onSuccess,
  className = "",
}) => {
  const [showForm, setShowForm] = useState(!showIntro);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState(initialFormData);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [successAutomation, setSuccessAutomation] = useState(null);

  const wrapperClass = compact
    ? "w-full"
    : "overflow-hidden rounded-[36px] border border-gray-100 bg-white shadow-2xl";

  const setField = (name, value) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
    setError("");
  };

  const toggleListValue = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: prev[field].includes(value)
        ? prev[field].filter((item) => item !== value)
        : [...prev[field], value],
    }));
    setError("");
  };

  const validateStep = () => {
    if (currentStep === 0) {
      if (
        !formData.firstName.trim() ||
        !formData.lastName.trim() ||
        !formData.email.trim() ||
        !formData.phone.trim()
      ) {
        return "Please complete your contact details before continuing.";
      }
    }

    if (currentStep === 1) {
      if (!formData.destinations.length || !formData.tripLengthDays || !formData.adults) {
        return "Please choose at least one destination, trip length, and adult count.";
      }
    }

    if (currentStep === 2) {
      if (
        !formData.travelWhen.trim() ||
        !formData.sleepingArrangement.trim() ||
        !formData.accommodationPreferences.length
      ) {
        return "Please tell us when you want to travel and your stay preferences.";
      }
    }

    if (currentStep === 3) {
      if (!formData.message.trim() || !formData.contactPreference) {
        return "Please share your trip notes and preferred contact method.";
      }
    }

    return "";
  };

  const handleNext = () => {
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }
    setCurrentStep((prev) => Math.min(prev + 1, stepConfig.length - 1));
  };

  const handleBack = () => {
    setError("");
    setCurrentStep((prev) => Math.max(prev - 1, 0));
  };

  const payload = useMemo(
    () => ({
      ...formData,
      name: `${formData.firstName} ${formData.lastName}`.trim(),
    }),
    [formData]
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validateStep();
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await createInquiry({
        ...payload,
        sourceChannel: "plan-my-trip",
      });
      setSuccessAutomation(response.data?.automation || null);
      setSuccess(true);
      setFormData(initialFormData);
      setCurrentStep(0);

      if (onSuccess) {
        onSuccess();
      }
    } catch (submitError) {
      console.error(submitError);
      setError("We could not send your request right now. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (!showForm) {
    return <IntroCard onCancel={onCancel} onProceed={() => setShowForm(true)} />;
  }

  return (
    <div className={`${wrapperClass} ${className}`}>
      <div className="grid grid-cols-1 md:grid-cols-[280px_1fr]">
        <div className="bg-primary p-6 md:p-10 text-white">
          <div className="mb-4 md:mb-5 inline-flex rounded-full border border-white/20 px-3 md:px-4 py-1 text-[9px] md:text-[10px] font-black uppercase tracking-[0.32em] text-white/85">
            Plan My Trip
          </div>
          <h1 className="text-2xl md:text-4xl font-black uppercase leading-tight md:leading-none tracking-tighter">
            Plan Your Trip
          </h1>
          <p className="mt-3 md:mt-5 text-xs md:text-sm leading-6 md:leading-7 text-white/80 line-clamp-2 md:line-clamp-none">
            Move through the steps and share the essentials our safari planners
            need to design your custom journey.
          </p>

          <div className="mt-6 md:mt-10 space-y-3 md:space-y-4 overflow-x-auto md:overflow-visible flex md:flex-col pb-2 md:pb-0">
            {stepConfig.map((step, index) => {
              const isActive = index === currentStep;
              const isDone = index < currentStep || success;
              return (
                <div
                  key={step.id}
                  className={`rounded-2xl border px-3 py-3 md:px-4 md:py-4 transition-all min-w-[140px] md:min-w-0 ${
                    isActive
                      ? "border-white/50 bg-white/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-center gap-2 md:gap-3">
                    <div
                      className={`flex h-8 w-8 md:h-10 md:w-10 shrink-0 items-center justify-center rounded-full text-xs md:text-sm ${
                        isDone ? "bg-white text-primary" : "bg-white/10 text-white"
                      }`}
                    >
                      {isDone ? <FaCheck /> : step.icon}
                    </div>
                    <div>
                      <p className="text-[8px] md:text-[10px] font-black uppercase tracking-[0.28em] text-white/60">
                        Step {index + 1}
                      </p>
                      <p className="text-[10px] md:text-xs font-black uppercase tracking-wide truncate">
                        {step.title}
                      </p>
                    </div>
                  </div>
                  <p className="mt-2 md:mt-3 text-[10px] md:text-xs leading-relaxed md:leading-6 text-white/70 hidden md:block">
                    {step.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="p-6 md:p-10">
          {success ? (
            <div className="flex min-h-[300px] md:min-h-[520px] flex-col items-center justify-center text-center">
              <div className="mb-6 flex h-16 w-16 md:h-20 md:w-20 items-center justify-center rounded-full bg-green-100 text-3xl md:text-4xl text-green-600">
                ✓
              </div>
              <h2 className="mb-3 text-2xl md:text-3xl font-black uppercase tracking-tighter text-slate-900">
                Plan Received
              </h2>
              <p className="max-w-md text-sm md:text-base leading-relaxed md:leading-7 text-slate-600">
                Our safari experts now have your trip details and will contact
                you with a custom proposal.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    setSuccess(false);
                    setSuccessAutomation(null);
                    if (showIntro) {
                      setShowForm(false);
                    }
                  }}
                  className="rounded-xl bg-primary px-6 py-3.5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white"
                >
                  Plan Another Trip
                </button>
                {onCancel && (
                  <button
                    type="button"
                    onClick={onCancel}
                    className="rounded-xl border border-slate-200 px-6 py-3.5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-600"
                  >
                    Close
                  </button>
                )}
                {successAutomation?.whatsappUrl && (
                  <a
                    href={successAutomation.whatsappUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-green-200 bg-green-50 px-6 py-3.5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-green-700"
                  >
                    Continue On WhatsApp
                  </a>
                )}
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-8">
              <div>
                <p className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.26em] text-primary">
                  {stepConfig[currentStep].title}
                </p>
                <h2 className="mt-1 md:mt-2 text-xl md:text-3xl font-black uppercase tracking-tighter text-slate-900 leading-tight">
                  {currentStep === 0 && "Tell us who is traveling"}
                  {currentStep === 1 && "Shape the core of the itinerary"}
                  {currentStep === 2 && "Choose your timing and stay style"}
                  {currentStep === 3 && "Add your final trip notes"}
                </h2>
              </div>

              {currentStep === 0 && (
                <div className="grid grid-cols-1 gap-4 md:gap-6 md:grid-cols-2">
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      First Name
                    </label>
                    <input required type="text" value={formData.firstName} onChange={(e) => setField("firstName", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Last Name
                    </label>
                    <input required type="text" value={formData.lastName} onChange={(e) => setField("lastName", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      E-mail
                    </label>
                    <input required type="email" value={formData.email} onChange={(e) => setField("email", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                  <div className="space-y-1 md:col-span-2">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Phone Number
                    </label>
                    <input required type="tel" value={formData.phone} onChange={(e) => setField("phone", e.target.value)} placeholder="International format" className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>
                </div>
              )}

              {currentStep === 1 && (
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-3">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Interested Destinations
                    </label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {destinationOptions.map((option) => (
                        <button key={option} type="button" onClick={() => toggleListValue("destinations", option)} className={`rounded-xl border px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-wide transition-all ${formData.destinations.includes(option) ? "border-primary bg-primary text-white shadow-lg" : "border-gray-200 bg-white text-slate-600 hover:border-primary/30"}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 md:gap-6">
                    <div className="space-y-1">
                      <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                        Trip Length
                      </label>
                      <input required type="number" min="1" value={formData.tripLengthDays} onChange={(e) => setField("tripLengthDays", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                        Adults
                      </label>
                      <input required type="number" min="1" value={formData.adults} onChange={(e) => setField("adults", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                        Kids (0-5)
                      </label>
                      <input type="number" min="0" value={formData.childrenUnder5} onChange={(e) => setField("childrenUnder5", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                    </div>
                    <div className="space-y-1">
                      <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                        Kids (6-15)
                      </label>
                      <input type="number" min="0" value={formData.children6To15} onChange={(e) => setField("children6To15", e.target.value)} className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      When Would You Like to Travel?
                    </label>
                    <input required type="text" value={formData.travelWhen} onChange={(e) => setField("travelWhen", e.target.value)} placeholder="e.g. July 2026" className="w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-bold outline-none focus:border-primary" />
                  </div>

                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Sleeping Arrangements
                    </label>
                    <textarea required value={formData.sleepingArrangement} onChange={(e) => setField("sleepingArrangement", e.target.value)} className="h-24 md:h-28 w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:border-primary" />
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Preferred Accommodation
                    </label>
                    <div className="flex flex-wrap gap-2 md:gap-3">
                      {accommodationOptions.map((option) => (
                        <button key={option} type="button" onClick={() => toggleListValue("accommodationPreferences", option)} className={`rounded-xl border px-3 py-2.5 md:px-4 md:py-3 text-[10px] md:text-xs font-black uppercase tracking-wide transition-all ${formData.accommodationPreferences.includes(option) ? "border-primary bg-primary text-white shadow-lg" : "border-gray-200 bg-white text-slate-600 hover:border-primary/30"}`}>
                          {option}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6 md:space-y-8">
                  <div className="space-y-1">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Tell Us More About Your Trip
                    </label>
                    <textarea required value={formData.message} onChange={(e) => setField("message", e.target.value)} className="h-28 md:h-40 w-full rounded-xl md:rounded-2xl border bg-gray-50 p-3.5 md:p-4 text-sm font-medium outline-none focus:border-primary" />
                  </div>

                  <div className="space-y-3">
                    <label className="ml-1 text-[9px] md:text-[10px] font-black uppercase text-gray-400">
                      Preferred Contact Method
                    </label>
                    <div className="grid grid-cols-3 gap-2 md:gap-3">
                      {[
                        { label: "WhatsApp", value: "whatsapp" },
                        { label: "E-mail", value: "email" },
                        { label: "Phone", value: "phone" },
                      ].map((option) => (
                        <button key={option.value} type="button" onClick={() => setField("contactPreference", option.value)} className={`rounded-xl md:rounded-2xl border px-2 py-3 md:px-4 md:py-4 text-[10px] md:text-sm font-black uppercase tracking-wide transition-all ${formData.contactPreference === option.value ? "border-primary bg-primary text-white shadow-lg" : "border-gray-200 bg-white text-slate-600 hover:border-primary/30"}`}>
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-bold text-red-600">
                  {error}
                </div>
              )}

              <div className="flex flex-col gap-3 border-t border-slate-100 pt-4 md:pt-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex gap-2 md:gap-3 order-2 sm:order-1">
                  {currentStep > 0 && (
                    <button type="button" onClick={handleBack} className="inline-flex items-center gap-2 rounded-xl md:rounded-2xl border border-slate-200 px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-600">
                      <FaArrowLeft />
                      Back
                    </button>
                  )}
                  {onCancel && (
                    <button type="button" onClick={onCancel} className="rounded-xl md:rounded-2xl border border-slate-200 px-4 py-3 md:px-5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-slate-500">
                      Cancel
                    </button>
                  )}
                </div>

                <div className="order-1 sm:order-2">
                  {currentStep < stepConfig.length - 1 ? (
                    <button type="button" onClick={handleNext} className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl md:rounded-2xl bg-primary px-6 py-3.5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg">
                      Next Step
                      <FaArrowRight />
                    </button>
                  ) : (
                    <button type="submit" disabled={loading} className="w-full sm:w-auto rounded-xl md:rounded-2xl bg-primary px-6 py-3.5 md:py-4 text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white shadow-lg disabled:opacity-60">
                      {loading ? "Sending..." : "Send Form"}
                    </button>
                  )}
                </div>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default PlanMyTripWizard;
