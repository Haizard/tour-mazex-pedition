import { Client } from "pg";

const encodePasswordInConnectionString = (value = "") =>
  String(value || "").replace(
    /:\/\/([^:]+):([^@]+)@/,
    (_match, user, password) => `://${user}:${encodeURIComponent(password)}@`
  );

const buildConnectionStringFromParts = (env = globalThis.process?.env || {}) => {
  const host = String(env.SUPABASE_DB_HOST || "").trim();
  const port = Number(env.SUPABASE_DB_PORT || 5432);
  const database = String(env.SUPABASE_DB_NAME || "").trim();
  const user = String(env.SUPABASE_DB_USER || "").trim();
  const password = String(env.SUPABASE_DB_PASSWORD || "").trim();

  if (!host || !database || !user || !password) {
    return "";
  }

  return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
};

export const getPostgresConnectionString = (env = globalThis.process?.env || {}) => {
  const direct = String(env.SUPABASE_DB_URL || env.POSTGRES_URL || env.DATABASE_URL || "").trim();
  if (direct) {
    return encodePasswordInConnectionString(direct);
  }

  return buildConnectionStringFromParts(env);
};

export const isPostgresConfigured = (env = globalThis.process?.env || {}) =>
  Boolean(getPostgresConnectionString(env));

export const createPostgresClient = (env = globalThis.process?.env || {}) => {
  const connectionString = getPostgresConnectionString(env);

  if (!connectionString) {
    return null;
  }

  return new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
    },
  });
};

export const getPostgresHealth = async (env = globalThis.process?.env || {}) => {
  const client = createPostgresClient(env);

  if (!client) {
    return {
      configured: false,
      connected: false,
      pingOk: false,
    };
  }

  try {
    await client.connect();
    const result = await client.query("select current_database() as database_name, version() as server_version");

    return {
      configured: true,
      connected: true,
      pingOk: true,
      databaseName: result.rows[0]?.database_name || "",
      serverVersion: result.rows[0]?.server_version || "",
    };
  } catch (error) {
    return {
      configured: true,
      connected: false,
      pingOk: false,
      errorMessage: error.message,
    };
  } finally {
    await client.end().catch(() => {});
  }
};
