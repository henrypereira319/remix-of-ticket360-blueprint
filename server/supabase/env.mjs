import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";

const currentFile = fileURLToPath(import.meta.url);
const currentDir = path.dirname(currentFile);
const workspaceRoot = path.resolve(currentDir, "..", "..");

const envPaths = [".env", ".env.local"];

envPaths.forEach((relativePath) => {
  const absolutePath = path.join(workspaceRoot, relativePath);

  if (existsSync(absolutePath)) {
    loadEnv({ path: absolutePath, override: true });
  }
});

export const supabaseUrl = process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? "";
export const supabasePublishableKey =
  process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? "";
export const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "";
export const supabaseDbUrl = process.env.SUPABASE_DB_URL ?? "";

export const assertSupabaseServerEnv = () => {
  if (!supabaseUrl) {
    throw new Error("SUPABASE_URL nao configurado.");
  }

  if (!supabaseServiceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY nao configurado.");
  }
};
