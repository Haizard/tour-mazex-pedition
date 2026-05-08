import { S3Client, PutObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl as defaultGetSignedUrl } from "@aws-sdk/s3-request-presigner";

const parseCsv = (value = "") =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

const normalizeAwsEndpoint = ({ endpoint = "", bucket = "", region = "us-east-1" } = {}) => {
  const rawEndpoint = String(endpoint || "").trim();
  if (!rawEndpoint) {
    return rawEndpoint;
  }

  try {
    const parsed = new URL(rawEndpoint);
    const hostname = parsed.hostname.toLowerCase();
    const bucketPrefix = bucket ? `${String(bucket).toLowerCase()}.` : "";
    const usesLegacyAwsHost =
      hostname === "s3.amazonaws.com" || hostname === `${bucketPrefix}s3.amazonaws.com`;

    if (usesLegacyAwsHost && region && region !== "us-east-1") {
      return `${parsed.protocol}//s3.${region}.amazonaws.com`;
    }
  } catch (_error) {
    return rawEndpoint;
  }

  return rawEndpoint;
};

export const getObjectStorageStrategy = (env = null) => {
  const runtimeEnv = env || globalThis.process?.env || {};
  const configuredProvider = String(runtimeEnv.MEDIA_STORAGE_PROVIDER || "mongo-inline").trim().toLowerCase();
  const allowedProviders = new Set(["mongo-inline", "s3-compatible"]);
  const provider = allowedProviders.has(configuredProvider) ? configuredProvider : "mongo-inline";
  const bucket = String(runtimeEnv.S3_BUCKET || "").trim();
  const endpoint = normalizeAwsEndpoint({
    endpoint: runtimeEnv.S3_ENDPOINT,
    bucket,
    region: String(runtimeEnv.S3_REGION || "us-east-1").trim(),
  });
  const publicBaseUrl = String(runtimeEnv.S3_PUBLIC_BASE_URL || "").trim();
  const region = String(runtimeEnv.S3_REGION || "us-east-1").trim();
  const accessKeyId = String(runtimeEnv.S3_ACCESS_KEY_ID || "").trim();
  const secretAccessKey = String(runtimeEnv.S3_SECRET_ACCESS_KEY || "").trim();
  const forcePathStyle = String(runtimeEnv.S3_FORCE_PATH_STYLE || "true").trim().toLowerCase() !== "false";

  const s3Configured = Boolean(bucket && endpoint);
  const activeProvider = provider === "s3-compatible" && s3Configured ? "s3-compatible" : "mongo-inline";

  return {
    requestedProvider: provider,
    activeProvider,
    configured: activeProvider === "mongo-inline" ? true : s3Configured,
    bucket,
    endpoint,
    publicBaseUrl,
    region,
    accessKeyId,
    secretAccessKey,
    forcePathStyle,
    cacheControl: runtimeEnv.MEDIA_CACHE_CONTROL || "public, max-age=31536000",
    signedUrlTtlSeconds: Number(runtimeEnv.S3_SIGNED_URL_TTL_SECONDS || 900),
    allowedMimePrefixes: parseCsv(runtimeEnv.MEDIA_ALLOWED_MIME_PREFIXES || "image/,video/,application/pdf"),
    reasons:
      provider === "s3-compatible" && !s3Configured
        ? ["S3-compatible storage requested but bucket or endpoint is missing, falling back to mongo-inline."]
        : [],
  };
};

const buildPublicUrl = (publicBaseUrl = "", storageKey = "") =>
  publicBaseUrl ? `${String(publicBaseUrl).replace(/\/$/, "")}/${storageKey}` : "";

export const createObjectStorageClient = (strategy = getObjectStorageStrategy()) => {
  if (strategy.activeProvider !== "s3-compatible") {
    return null;
  }

  const clientConfig = {
    region: strategy.region || "us-east-1",
    endpoint: strategy.endpoint,
    forcePathStyle: strategy.forcePathStyle,
  };

  if (strategy.accessKeyId && strategy.secretAccessKey) {
    clientConfig.credentials = {
      accessKeyId: strategy.accessKeyId,
      secretAccessKey: strategy.secretAccessKey,
    };
  }

  return new S3Client(clientConfig);
};

export const assertMediaUploadAllowed = ({
  buffer,
  strategy = getObjectStorageStrategy(),
  maxInlineBytes = 15 * 1024 * 1024,
} = {}) => {
  const size = Number(buffer?.length || 0);

  if (strategy.activeProvider === "mongo-inline" && size > maxInlineBytes) {
    throw new Error("File is too large. Max size for direct DB storage is 15MB.");
  }
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
      publicUrl: buildPublicUrl(strategy.publicBaseUrl, storageKey),
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

export const uploadStoredMediaAsset = async ({
  filename,
  contentType,
  buffer,
  tenantId,
  strategy = getObjectStorageStrategy(),
  s3Client = createObjectStorageClient(strategy),
} = {}) => {
  const asset = persistMediaAsset({
    filename,
    contentType,
    buffer,
    tenantId,
    strategy,
  });

  assertMediaUploadAllowed({ buffer, strategy });

  if (asset.storageProvider === "s3-compatible") {
    if (!s3Client) {
      throw new Error("S3-compatible storage is active but no object storage client is available.");
    }

    await s3Client.send(
      new PutObjectCommand({
        Bucket: asset.storageBucket,
        Key: asset.storageKey,
        Body: buffer,
        ContentType: contentType,
        CacheControl: strategy.cacheControl,
      })
    );
  }

  return asset;
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

export const resolveStoredMediaReadPlan = async ({
  media = {},
  headers = {},
  strategy = getObjectStorageStrategy(),
  s3Client = createObjectStorageClient(strategy),
  signUrl = defaultGetSignedUrl,
} = {}) => {
  const basePlan = buildStoredMediaReadPlan(media, headers);

  if (basePlan.mode === "redirect") {
    return basePlan;
  }

  if (
    (media.storageProvider || "mongo-inline") === "s3-compatible" &&
    media.storageBucket &&
    media.storageKey
  ) {
    if (!s3Client) {
      throw new Error("S3-compatible storage is active but no object storage client is available.");
    }

    const redirectUrl = await signUrl(
      s3Client,
      new GetObjectCommand({
        Bucket: media.storageBucket,
        Key: media.storageKey,
      }),
      { expiresIn: strategy.signedUrlTtlSeconds }
    );

    return {
      mode: "redirect",
      redirectUrl,
    };
  }

  return basePlan;
};

/**
 * Generates a signed URL for a specific bucket and key.
 * Used for direct artifact retrieval (PDFs, invoices) outside the media model.
 * 
 * [SKILL: Storage Utility]
 */
export const getSignedUrlForKey = async ({
  bucket,
  key,
  strategy = getObjectStorageStrategy(),
  s3Client = createObjectStorageClient(strategy),
  signUrl = defaultGetSignedUrl,
} = {}) => {
  if (strategy.activeProvider !== "s3-compatible" || !s3Client) {
    return null;
  }

  return await signUrl(
    s3Client,
    new GetObjectCommand({
      Bucket: bucket || strategy.bucket,
      Key: key,
    }),
    { expiresIn: strategy.signedUrlTtlSeconds }
  );
};
