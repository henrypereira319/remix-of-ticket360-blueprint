import pg from "pg";
import { supabaseDbUrl } from "../supabase/env.mjs";

const { Pool } = pg;

let pool;

export const getDbPool = () => {
  if (!supabaseDbUrl) {
    throw new Error("SUPABASE_DB_URL nao configurado.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: supabaseDbUrl,
      ssl: {
        rejectUnauthorized: false,
      },
      max: 10,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 10_000,
    });
  }

  return pool;
};

export const withDbClient = async (callback) => {
  const client = await getDbPool().connect();

  try {
    return await callback(client);
  } finally {
    client.release();
  }
};

export const withTransaction = async (callback) =>
  withDbClient(async (client) => {
    await client.query("begin");

    try {
      const result = await callback(client);
      await client.query("commit");
      return result;
    } catch (error) {
      await client.query("rollback");
      throw error;
    }
  });
