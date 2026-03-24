import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { withTransaction } from "../server/db/client.mjs";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const migrationsDir = path.join(currentDir, "..", "server", "db", "migrations");

const ensureMigrationTable = async (client) => {
  await client.query(`
    create schema if not exists app_private;
    create table if not exists app_private.schema_migrations (
      version text primary key,
      applied_at timestamptz not null default now()
    );
  `);
};

const getMigrationFiles = () =>
  readdirSync(migrationsDir)
    .filter((fileName) => fileName.endsWith(".sql"))
    .sort((left, right) => left.localeCompare(right));

const run = async () => {
  const migrationFiles = getMigrationFiles();

  await withTransaction(async (client) => {
    await ensureMigrationTable(client);

    const appliedResult = await client.query("select version from app_private.schema_migrations");
    const appliedVersions = new Set(appliedResult.rows.map((row) => row.version));

    for (const fileName of migrationFiles) {
      if (appliedVersions.has(fileName)) {
        console.log(`skip ${fileName}`);
        continue;
      }

      const sql = readFileSync(path.join(migrationsDir, fileName), "utf8");
      console.log(`apply ${fileName}`);
      await client.query(sql);
      await client.query("insert into app_private.schema_migrations (version) values ($1)", [fileName]);
    }
  });

  console.log("db migrate ok");
};

run().catch((error) => {
  console.error("db migrate falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
