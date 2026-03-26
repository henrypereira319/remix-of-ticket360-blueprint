import { config as loadEnv } from "dotenv";
import { startHttpServer } from "./app.mjs";

loadEnv({ path: ".env.local", override: false });
loadEnv({ override: false });

const run = async () => {
  const port = Number(process.env.PORT ?? 8787);
  const host = process.env.HOST ?? "0.0.0.0";
  await startHttpServer({ port, host });
  console.log(`backend http ok em http://${host}:${port}`);
};

run().catch((error) => {
  console.error("backend http falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
