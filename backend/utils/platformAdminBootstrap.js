import PlatformAdmin from "../models/PlatformAdmin.js";
import { hashAdminPassword } from "./adminAuth.js";

export const getConfiguredPlatformAdminUsername = (env = process.env) =>
  String(env.PLATFORM_ADMIN_USERNAME || "platform-admin").trim().toLowerCase();

export const getConfiguredPlatformAdminPassword = (env = process.env) =>
  String(
    env.PLATFORM_ADMIN_PASSWORD || env.ADMIN_PASSWORD || env.LEGACY_ADMIN_PASSWORD || ""
  );

export const shouldRecoverPlatformAdminWithEnv = ({
  username = "",
  password = "",
  env = process.env,
} = {}) => {
  const configuredUsername = getConfiguredPlatformAdminUsername(env);
  const configuredPassword = getConfiguredPlatformAdminPassword(env);

  return Boolean(
    configuredPassword &&
      String(username || "").trim().toLowerCase() === configuredUsername &&
      String(password || "") === configuredPassword
  );
};

export const ensureDefaultPlatformAdmin = async (env = process.env) => {
  const username = getConfiguredPlatformAdminUsername(env);
  const password = getConfiguredPlatformAdminPassword(env);

  if (!username || !password) {
    return null;
  }

  const passwordRecord = await hashAdminPassword(password);

  return PlatformAdmin.findOneAndUpdate(
    { username },
    {
      $setOnInsert: {
        username,
        displayName: "Platform Admin",
        role: "super_admin",
        status: "active",
        ...passwordRecord,
      },
    },
    { upsert: true, new: true }
  );
};

export const syncConfiguredPlatformAdminPassword = async (admin, env = process.env) => {
  if (!admin?._id) {
    return null;
  }

  const password = getConfiguredPlatformAdminPassword(env);
  if (!password) {
    return admin;
  }

  const passwordRecord = await hashAdminPassword(password);
  admin.passwordSalt = passwordRecord.passwordSalt;
  admin.passwordHash = passwordRecord.passwordHash;
  admin.status = admin.status || "active";
  await admin.save();
  return admin;
};
