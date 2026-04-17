import crypto from "crypto";

const TOKEN_TTL_MS = 1000 * 60 * 60 * 12;

const getAuthSecret = () =>
  process.env.ADMIN_AUTH_SECRET ||
  process.env.JWT_SECRET ||
  "unsafe-dev-admin-secret";

const toBase64Url = (value) => Buffer.from(value).toString("base64url");
const fromBase64Url = (value) => Buffer.from(value, "base64url").toString("utf8");

const scryptAsync = (password, salt, keyLength) =>
  new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, keyLength, (error, derivedKey) => {
      if (error) {
        reject(error);
        return;
      }

      resolve(derivedKey);
    });
  });

export const hashAdminPassword = async (password, salt = crypto.randomBytes(16).toString("hex")) => {
  const derivedKey = await scryptAsync(password, salt, 64);
  return {
    passwordSalt: salt,
    passwordHash: derivedKey.toString("hex"),
  };
};

export const verifyAdminPassword = async (password, passwordSalt, passwordHash) => {
  const candidate = await scryptAsync(password, passwordSalt, 64);
  const stored = Buffer.from(passwordHash, "hex");

  if (candidate.length !== stored.length) {
    return false;
  }

  return crypto.timingSafeEqual(candidate, stored);
};

export const signAdminToken = ({
  adminId,
  tenantId,
  username,
  role,
  expiresInMs = TOKEN_TTL_MS,
}) => {
  const payload = {
    adminId,
    tenantId,
    username,
    role,
    exp: Date.now() + expiresInMs,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");

  return `${encodedPayload}.${signature}`;
};

export const verifyAdminToken = (token) => {
  if (!token || !token.includes(".")) {
    throw new Error("Invalid token format.");
  }

  const [encodedPayload, signature] = token.split(".");
  const expectedSignature = crypto
    .createHmac("sha256", getAuthSecret())
    .update(encodedPayload)
    .digest("base64url");

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);

  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    throw new Error("Invalid token signature.");
  }

  const payload = JSON.parse(fromBase64Url(encodedPayload));

  if (!payload.exp || payload.exp < Date.now()) {
    throw new Error("Token expired.");
  }

  return payload;
};
