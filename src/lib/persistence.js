import { createClient } from "@supabase/supabase-js";

export const STORAGE_KEYS = {
  overrides: "escala.overrides.v1",
  servers: "escala.servers.v1",
};

const SUPABASE_TABLE = "escala_app_state";
const SUPABASE_ROW_ID = "current";

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  return url && anonKey ? { url, anonKey } : null;
};

let supabaseClient = null;

const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: false,
        detectSessionInUrl: false,
        persistSession: false,
      },
    });
  }

  return supabaseClient;
};

export const isRemotePersistenceConfigured = () => Boolean(getSupabaseConfig());

export const readStoredJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
};

export const writeStoredJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Local storage is a cache only.
  }
};

export const readLocalAppState = () => ({
  overrides: readStoredJson(STORAGE_KEYS.overrides, []),
  servers: readStoredJson(STORAGE_KEYS.servers, []),
});

export const writeLocalAppState = ({ overrides = [], servers = [] }) => {
  writeStoredJson(STORAGE_KEYS.overrides, overrides);
  writeStoredJson(STORAGE_KEYS.servers, servers);
};

export const loadPersistedAppState = async () => {
  const localState = readLocalAppState();
  const client = getSupabaseClient();

  if (!client) {
    return {
      source: "local",
      remoteConfigured: false,
      overrides: localState.overrides,
      servers: localState.servers,
    };
  }

  try {
    const { data, error } = await client.from(SUPABASE_TABLE).select("payload, updated_at").eq("id", SUPABASE_ROW_ID).maybeSingle();

    if (error) {
      return {
        source: "local",
        remoteConfigured: true,
        remoteError: error.message,
        overrides: localState.overrides,
        servers: localState.servers,
      };
    }

    if (!data?.payload) {
      return {
        source: "local",
        remoteConfigured: true,
        overrides: localState.overrides,
        servers: localState.servers,
      };
    }

    return {
      source: "remote",
      remoteConfigured: true,
      remoteUpdatedAt: data.updated_at ?? null,
      overrides: Array.isArray(data.payload.overrides) ? data.payload.overrides : [],
      servers: Array.isArray(data.payload.servers) ? data.payload.servers : [],
    };
  } catch (error) {
    return {
      source: "local",
      remoteConfigured: true,
      remoteError: error?.message ?? "Falha ao carregar a persistencia remota.",
      overrides: localState.overrides,
      servers: localState.servers,
    };
  }
};

export const savePersistedAppState = async ({ overrides = [], servers = [] }) => {
  writeLocalAppState({ overrides, servers });

  const client = getSupabaseClient();
  if (!client) {
    return {
      remoteSaved: false,
      remoteConfigured: false,
    };
  }

  const payload = {
    overrides,
    servers,
  };

  const { error } = await client
    .from(SUPABASE_TABLE)
    .upsert(
      {
        id: SUPABASE_ROW_ID,
        payload,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    );

  if (error) {
    return {
      remoteSaved: false,
      remoteConfigured: true,
      remoteError: error.message,
    };
  }

  return {
    remoteSaved: true,
    remoteConfigured: true,
  };
};
