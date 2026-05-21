export const TRAVELER_GOOGLE_PROMPT_DELAY_MS = 30000;
export const TRAVELER_GOOGLE_PROMPT_DISMISSED_KEY = "traveler-google-prompt-dismissed";
export const TRAVELER_AUTH_TOKEN_KEY = "travelerAuthToken";

const platformPublicPaths = new Set([
  "/",
  "/features",
  "/pricing",
  "/operators",
  "/partners",
  "/templates",
]);

export const isTravelerGooglePromptPath = (pathname = "", isPlatform = false) => {
  const path = String(pathname || "/");

  if (path.startsWith("/demo/")) {
    return false;
  }

  return (
    isPlatform ||
    platformPublicPaths.has(path) ||
    path.startsWith("/discover")
  );
};

export const shouldScheduleTravelerGooglePrompt = ({
  pathname = "",
  isAdminRoute = false,
  isPlatform = false,
  isDismissed = false,
  isSignedIn = false,
} = {}) => (
  !isAdminRoute &&
  !isDismissed &&
  !isSignedIn &&
  isTravelerGooglePromptPath(pathname, isPlatform)
);

export const buildTravelerGoogleAuthUrl = ({
  returnTo = "/",
  sessionKey = "",
} = {}) => {
  const params = new URLSearchParams();
  params.set("returnTo", returnTo || "/");

  if (sessionKey) {
    params.set("sessionKey", sessionKey);
  }

  return `/api/traveler-auth/google?${params.toString()}`;
};
