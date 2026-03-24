import pg from "pg";
import { supabaseDbUrl } from "../server/supabase/env.mjs";

const { Client } = pg;

const run = async () => {
  if (!supabaseDbUrl) {
    throw new Error("SUPABASE_DB_URL nao configurado.");
  }

  const client = new Client({
    connectionString: supabaseDbUrl,
    ssl: {
      rejectUnauthorized: false,
    },
  });

  await client.connect();

  try {
    const versionResult = await client.query("select version() as version");
    const timeResult = await client.query("select now() as now");

    console.log("Postgres direto ok.");
    console.log(`Hora do banco: ${timeResult.rows[0]?.now?.toISOString?.() ?? timeResult.rows[0]?.now}`);
    console.log(`Versao: ${String(versionResult.rows[0]?.version ?? "").slice(0, 80)}...`);
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error("Postgres smoke falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
