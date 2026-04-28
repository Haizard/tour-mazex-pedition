const parseCsv = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

export const getObjectStorageStrategy = (env = null) => {
  const runtimeEnv = env || globalThis.process?.env || {};
  const configuredProvider = String(runtimeEnv.MEDIA_STORAGE_PROVIDER || "mongo-inline").trim().toLowerCase();
  const allowedProviders = new Set(["mongo-inline", "s3-compatible"]);
  const provider = allowedProviders.has(configuredProvider) ? configuredProvider : "mongo-inline";
  const bucket = String(runtimeEnv.S3_BUCKET || "").trim();
  const endpoint = String(runtimeEnv.S3_ENDPOINT || "").trim();
  const publicBaseUrl = String(runtimeEnv.S3_PUBLIC_BASE_URL || "").trim();

  const s3Configured = Boolean(bucket && endpoint);
  const activeProvider = provider === "s3-compatible" && s3Configured ? "s3-compatible" : "mongo-inline";

  return {
    requestedProvider: provider,
    activeProvider,
    configured: activeProvider === "mongo-inline" ? true : s3Configured,
    bucket,
    endpoint,
    publicBaseUrl,
    cacheControl: runtimeEnv.MEDIA_CACHE_CONTROL || "public, max-age=31536000",
    signedUrlTtlSeconds: Number(runtimeEnv.S3_SIGNED_URL_TTL_SECONDS || 900),
    allowedMimePrefixes: parseCsv(runtimeEnv.MEDIA_ALLOWED_MIME_PREFIXES || "image/,video/,application/pdf"),
    reasons:
      provider === "s3-compatible" && !s3Configured
        ? ["S3-compatible storage requested but bucket or endpoint is missing, falling back to mongo-inline."]
        : [],
  };
};

export const persistMediaAsset = ({
  filename,
  contentType,
  buffer,
  tenantId,
  strategy = getObjectStorageStrategy(),
} = {}) => {
  const size = Number(buffer?.length || 0);
  const mimeAllowed = strategy.allowedMimePrefixes.some((prefix) => contentType?.startsWith(prefix));

  if (!mimeAllowed) {
    throw new Error("Unsupported media type for upload.");
  }

  if (strategy.activeProvider === "s3-compatible") {
    const safeFilename = String(filename || "file").replace(/[^a-zA-Z0-9._-]+/g, "-");
    const storageKey = `${tenantId || "global"}/${Date.now()}-${safeFilename}`;
    return {
      storageProvider: "s3-compatible",
      storageKey,
      storageBucket: strategy.bucket,
      storageEndpoint: strategy.endpoint,
      publicUrl: strategy.publicBaseUrl ? `${strategy.publicBaseUrl.replace(/\/$/, "")}/${storageKey}` : "",
      contentType,
      size,
      inlineData: null,
    };
  }

  return {
    storageProvider: "mongo-inline",
    storageKey: "",
    storageBucket: "",
    storageEndpoint: "",
    publicUrl: "",
    contentType,
    size,
    inlineData: buffer,
  };
};

export const buildMediaResponsePayload = (media = {}) => ({
  mediaId: media._id,
  url: media.publicUrl || `/api/media/${media._id}`,
  storageProvider: media.storageProvider || "mongo-inline",
  storageKey: media.storageKey || "",
  size: Number(media.size || 0),
  contentType: media.contentType || "application/octet-stream",
});

export const buildStoredMediaReadPlan = (media = {}, headers = {}) => {
  if ((media.storageProvider || "mongo-inline") === "s3-compatible" && media.publicUrl) {
    return {
      mode: "redirect",
      redirectUrl: media.publicUrl,
    };
  }

  const totalSize = Number(media.size || media.data?.length || 0);
  const range = headers.range || "";

  if (!range) {
    return {
      mode: "inline-full",
      totalSize,
      start: 0,
      end: Math.max(totalSize - 1, 0),
    };
  }

  const [startRaw, endRaw] = String(range).replace(/bytes=/, "").split("-");
  const start = Number.parseInt(startRaw, 10);
  const end = endRaw ? Number.parseInt(endRaw, 10) : totalSize - 1;

  if (Number.isNaN(start) || Number.isNaN(end) || start < 0 || end < start || end >= totalSize) {
    return {
      mode: "invalid-range",
      totalSize,
    };
  }

  return {
    mode: "inline-range",
    totalSize,
    start,
    end,
  };
};
