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
    const tablesResult = await client.query(`
      select schemaname, tablename
      from pg_tables
      where schemaname not in ('pg_catalog', 'information_schema')
      order by schemaname, tablename
    `);
    const extensionsResult = await client.query(`
      select extname
      from pg_extension
      order by extname
    `);

    console.log("Schemas/tabelas:");
    console.log(JSON.stringify(tablesResult.rows, null, 2));
    console.log("Extensions:");
    console.log(JSON.stringify(extensionsResult.rows, null, 2));
  } finally {
    await client.end();
  }
};

run().catch((error) => {
  console.error("Postgres inspect falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
