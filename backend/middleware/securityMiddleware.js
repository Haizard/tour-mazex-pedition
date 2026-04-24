const DEFAULT_WINDOW_MS = 10 * 60 * 1000;

const getClientIp = (req) =>
  req.ip ||
  req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() ||
  req.socket?.remoteAddress ||
  "unknown";

export const applySecurityHeaders = (_req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
  res.setHeader("Cross-Origin-Resource-Policy", "same-site");
  next();
};

export const createRateLimit = ({
  windowMs = DEFAULT_WINDOW_MS,
  max = 10,
  message = "Too many requests. Please try again shortly.",
  keyGenerator,
} = {}) => {
  const requests = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key =
      keyGenerator?.(req) ||
      `${getClientIp(req)}:${req.method}:${req.baseUrl || ""}:${req.path || ""}`;
    const existing = requests.get(key);

    if (!existing || existing.resetAt <= now) {
      requests.set(key, {
        count: 1,
        resetAt: now + windowMs,
      });
      next();
      return;
    }

    if (existing.count >= max) {
      const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
      res.setHeader("Retry-After", String(retryAfterSeconds));
      res.status(429).json({
        message,
        retryAfterSeconds,
      });
      return;
    }

    existing.count += 1;
    requests.set(key, existing);
    next();
  };
};

const defaultAllowedOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://mazexpeditions.com",
  "https://www.mazexpeditions.com",
  "https://tourism-website-inky.vercel.app",
  "https://mazexpeditions.vercel.app",
];

export const buildAllowedOrigins = () => {
  const extraOrigins = String(process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);

  return [...new Set([...defaultAllowedOrigins, ...extraOrigins])];
};

export const isAllowedOrigin = (origin, allowedOrigins = buildAllowedOrigins()) => {
  if (!origin) {
    return true;
  }

  if (allowedOrigins.includes(origin)) {
    return true;
  }

  return /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin);
};
