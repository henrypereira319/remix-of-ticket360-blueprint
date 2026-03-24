import { supabaseAdmin } from "../server/supabase/admin.mjs";
import { supabaseDbUrl, supabasePublishableKey, supabaseUrl } from "../server/supabase/env.mjs";

const mask = (value) => {
  if (!value) {
    return "nao configurado";
  }

  if (value.length <= 8) {
    return "configurado";
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
};

const run = async () => {
  console.log(`Supabase URL: ${supabaseUrl}`);
  console.log(`Publishable key: ${mask(supabasePublishableKey)}`);
  console.log(`DB URL: ${supabaseDbUrl ? "configurado" : "nao configurado"}`);

  const { data, error } = await supabaseAdmin.auth.admin.listUsers({
    page: 1,
    perPage: 1,
  });

  if (error) {
    throw error;
  }

  console.log(`Admin auth ok. Usuarios encontrados nesta pagina: ${data.users.length}`);
};

run().catch((error) => {
  console.error("Supabase smoke falhou.");
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
