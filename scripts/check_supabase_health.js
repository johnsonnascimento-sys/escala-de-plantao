import process from "node:process";
import { createClient } from "@supabase/supabase-js";

const getEnvValue = (...names) => {
  for (const name of names) {
    const value = process.env[name]?.trim();
    if (value) return value;
  }
  return "";
};

const SUPABASE_URL = getEnvValue("VITE_SUPABASE_URL", "SUPABASE_URL");
const SUPABASE_ANON_KEY = getEnvValue("VITE_SUPABASE_ANON_KEY", "SUPABASE_ANON_KEY");
const SUPABASE_SERVICE_ROLE_KEY = getEnvValue("SUPABASE_SERVICE_ROLE_KEY");
const HEALTHCHECK_SOURCE = getEnvValue("HEALTHCHECK_SOURCE") || "scheduled";
const TABLE_NAME = "escala_app_state";
const ROW_ID = "current";
const HEALTHCHECK_LOG_TABLE = "escala_db_healthchecks";

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const fail = (message, details = null) => {
  const payload = {
    status: "fail",
    message,
    ...(details ? { details } : {}),
  };

  console.error(JSON.stringify(payload));
  process.exit(1);
};

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  fail("Variaveis SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_ANON_KEY/VITE_SUPABASE_ANON_KEY sao obrigatorias.");
}

const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    detectSessionInUrl: false,
    persistSession: false,
  },
});

const serviceClient =
  SUPABASE_SERVICE_ROLE_KEY
    ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      })
    : null;

const startedAt = Date.now();

try {
  const { data, error } = await client
    .from(TABLE_NAME)
    .select("id, updated_at, payload")
    .eq("id", ROW_ID)
    .maybeSingle();

  if (error) {
    throw new Error(`Falha ao consultar ${TABLE_NAME}: ${error.message}`);
  }

  if (!data) {
    throw new Error(`Nenhuma linha ${ROW_ID} encontrada em ${TABLE_NAME}.`);
  }

  if (data.id !== ROW_ID) {
    throw new Error(`Linha inesperada retornada por ${TABLE_NAME}: id=${String(data.id)}`);
  }

  if (!data.payload || typeof data.payload !== "object") {
    throw new Error("O campo payload nao foi retornado como objeto JSON.");
  }

  const result = {
    status: "ok",
    table: TABLE_NAME,
    row_id: ROW_ID,
    elapsed_ms: Date.now() - startedAt,
    updated_at: data.updated_at ?? null,
  };

  if (serviceClient) {
    const { error: insertError } = await serviceClient.from(HEALTHCHECK_LOG_TABLE).insert({
      id: createId(),
      test_source: HEALTHCHECK_SOURCE,
      status: result.status,
      message: "Conexao e leitura da linha current confirmadas.",
      details: "",
      duration_ms: result.elapsed_ms,
      tested_at: new Date().toISOString(),
      tested_by_user_id: null,
      tested_by_email: null,
      table_name: TABLE_NAME,
      row_id: ROW_ID,
    });

    if (insertError) {
      result.log_error = insertError.message;
    } else {
      result.logged = true;
    }
  }

  console.log(JSON.stringify(result));
} catch (error) {
  const failure = {
    status: "fail",
    table: TABLE_NAME,
    row_id: ROW_ID,
    elapsed_ms: Date.now() - startedAt,
    message: "Erro inesperado durante o healthcheck do Supabase.",
    details: error?.message ?? String(error),
  };

  if (serviceClient) {
    const { error: insertError } = await serviceClient.from(HEALTHCHECK_LOG_TABLE).insert({
      id: createId(),
      test_source: HEALTHCHECK_SOURCE,
      status: failure.status,
      message: failure.message,
      details: failure.details,
      duration_ms: failure.elapsed_ms,
      tested_at: new Date().toISOString(),
      tested_by_user_id: null,
      tested_by_email: null,
      table_name: TABLE_NAME,
      row_id: ROW_ID,
    });

    if (insertError) {
      failure.log_error = insertError.message;
    } else {
      failure.logged = true;
    }
  }

  console.error(JSON.stringify(failure));
  process.exit(1);
}
