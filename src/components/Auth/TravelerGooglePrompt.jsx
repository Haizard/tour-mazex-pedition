/* eslint-disable react/prop-types */
import { FaGoogle, FaTimes } from "react-icons/fa";
import { getMarketplaceTravelerSessionKey } from "../Marketplace/travelerSession";
import {
  buildTravelerGoogleAuthUrl,
  TRAVELER_GOOGLE_PROMPT_DISMISSED_KEY,
} from "./travelerGooglePromptState";

/**
 * Prompts the traveler to sign in with Google.
 *
 * @param {{ onDismiss?: () => void, returnTo?: string, label?: string, variant?: 'floating' | 'inline' }} props
 *   - returnTo: custom return URL after sign-in (default: current pathname)
 *   - label: custom button label (default: "Continue with Google")
 *   - variant: "floating" (fixed top-right prompt) or "inline" (embedded in page content)
 */
const TravelerGooglePrompt = ({
  onDismiss,
  returnTo: returnToProp,
  label = "Continue with Google",
  variant = "floating",
}) => {
  const startGoogleLogin = () => {
    const returnTo =
      returnToProp || `${window.location.pathname}${window.location.search || ""}`;
    window.location.href = buildTravelerGoogleAuthUrl({
      returnTo,
      sessionKey: getMarketplaceTravelerSessionKey(),
    });
  };

  const dismissPrompt = () => {
    window.sessionStorage.setItem(TRAVELER_GOOGLE_PROMPT_DISMISSED_KEY, "true");
    onDismiss?.();
  };

  const promptContent = (
    <>
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8b7451]">
            Traveler Account
          </p>
          <h2 className="mt-2 text-lg font-black uppercase tracking-tight">
            Save your trip ideas
          </h2>
        </div>
        {variant === "inline" ? null : (
          <button
            type="button"
            onClick={dismissPrompt}
            className="grid h-8 w-8 place-items-center rounded-full border border-slate-200 text-slate-500 transition hover:text-slate-950"
            aria-label="Dismiss Google sign in prompt"
          >
            <FaTimes />
          </button>
        )}
      </div>
      <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
        Sign in with Google to keep hotels, tours, comparisons, and inquiries connected to your traveler profile.
      </p>
      <button
        type="button"
        onClick={startGoogleLogin}
        className="mt-4 inline-flex w-full items-center justify-center gap-3 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black uppercase tracking-[0.16em] text-white transition hover:bg-[#2f5b3a]"
      >
        <FaGoogle /> {label}
      </button>
      {variant === "inline" ? null : (
        <button
          type="button"
          onClick={dismissPrompt}
          className="mt-3 w-full text-center text-xs font-black uppercase tracking-[0.16em] text-slate-500 hover:text-slate-950"
        >
          Not now
        </button>
      )}
    </>
  );

  if (variant === "inline") {
    return <div className="w-full">{promptContent}</div>;
  }

  return (
    <aside className="fixed right-4 top-24 z-[1200] w-[min(360px,calc(100vw-2rem))] rounded-2xl border border-[#d8c8ae] bg-white p-4 text-slate-950 shadow-2xl shadow-slate-950/20">
      {promptContent}
    </aside>
  );
};

export default TravelerGooglePrompt;
