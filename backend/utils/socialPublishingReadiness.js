const sortAccountsByFreshness = (accounts = []) =>
  [...accounts].sort((left, right) => {
    const leftVerified = left?.lastVerifiedAt ? new Date(left.lastVerifiedAt).getTime() : 0;
    const rightVerified = right?.lastVerifiedAt ? new Date(right.lastVerifiedAt).getTime() : 0;
    if (rightVerified !== leftVerified) {
      return rightVerified - leftVerified;
    }

    const leftCreated = left?.createdAt ? new Date(left.createdAt).getTime() : 0;
    const rightCreated = right?.createdAt ? new Date(right.createdAt).getTime() : 0;
    return rightCreated - leftCreated;
  });

export const resolveSocialPublishingReadiness = ({
  accounts = [],
  platforms = [],
} = {}) => {
  const requestedPlatforms = Array.isArray(platforms) && platforms.length > 0
    ? [...new Set(platforms)]
    : ["facebook", "instagram"];

  const metaAccounts = (accounts || []).filter((account) => account?.provider === "meta");
  const whatsappAccounts = (accounts || []).filter((account) => account?.provider === "whatsapp");
  const activeMetaAccounts = sortAccountsByFreshness(
    metaAccounts.filter((account) => account?.status === "active")
  );
  const activeWhatsAppAccounts = sortAccountsByFreshness(
    whatsappAccounts.filter((account) => account?.status === "active")
  );
  const eligibleMetaAccount = activeMetaAccounts.find((account) => {
    if (!account?.pageId) {
      return false;
    }

    if (requestedPlatforms.includes("instagram")) {
      return Boolean(
        account.instagramBusinessAccountId ||
          account?.metadata?.verification?.instagramBusinessAccountId
      );
    }

    return true;
  }) || null;

  if (eligibleMetaAccount) {
    return {
      ready: true,
      account: eligibleMetaAccount,
      message: "",
      activeMetaCount: activeMetaAccounts.length,
      activeWhatsAppCount: activeWhatsAppAccounts.length,
      requestedPlatforms,
    };
  }

  if (!activeMetaAccounts.length) {
    const hasSavedMetaConnection = metaAccounts.length > 0;
    if (activeWhatsAppAccounts.length > 0 && !hasSavedMetaConnection) {
      return {
        ready: false,
        account: null,
        message:
          "WhatsApp is connected, but Facebook and Instagram publishing still require an active Meta account.",
        activeMetaCount: 0,
        activeWhatsAppCount: activeWhatsAppAccounts.length,
        requestedPlatforms,
      };
    }

    return {
      ready: false,
      account: null,
      message: hasSavedMetaConnection
        ? "Verify your Meta connection again so it becomes active before publishing Facebook or Instagram posts."
        : "Connect an active Meta account before publishing Facebook or Instagram posts.",
      activeMetaCount: 0,
      activeWhatsAppCount: activeWhatsAppAccounts.length,
      requestedPlatforms,
    };
  }

  if (requestedPlatforms.includes("instagram")) {
    return {
      ready: false,
      account: null,
      message:
        "Instagram publishing requires a Meta connection with an Instagram Business Account ID.",
      activeMetaCount: activeMetaAccounts.length,
      activeWhatsAppCount: activeWhatsAppAccounts.length,
      requestedPlatforms,
    };
  }

  return {
    ready: false,
    account: null,
    message: "The active Meta connection is missing the Facebook Page ID required for publishing.",
    activeMetaCount: activeMetaAccounts.length,
    activeWhatsAppCount: activeWhatsAppAccounts.length,
    requestedPlatforms,
  };
};
