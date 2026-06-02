import { createClient } from "@supabase/supabase-js";

export const STORAGE_KEYS = {
  overrides: "escala.overrides.v1",
  servers: "escala.servers.v1",
};

const SUPABASE_TABLE = "escala_app_state";
const SUPABASE_ROW_ID = "current";
const FALLBACK_SUPABASE_CONFIG = {
  url: "https://jqkvqxpwbvbywjptuext.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3ZxeHB3YnZieXdqcHR1ZXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEyMDEsImV4cCI6MjA5NTk5NzIwMX0.cN00Vxzuti3lBb4FAdmAlpdo-gywN_Ri-7KJw39jRNU",
};

const normalizePersistedPayload = (payload) => ({
  overrides: Array.isArray(payload?.overrides) ? payload.overrides : [],
  servers: Array.isArray(payload?.servers) ? payload.servers : [],
});

const isGitHubPagesHost = () => {
  try {
    return globalThis.location?.hostname?.endsWith("github.io") ?? false;
  } catch {
    return false;
  }
};

const getSupabaseConfig = () => {
  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

  if (isGitHubPagesHost()) {
    return FALLBACK_SUPABASE_CONFIG;
  }

  return url && anonKey ? { url, anonKey } : FALLBACK_SUPABASE_CONFIG;
};

let supabaseClient = null;

const getSupabaseClient = () => {
  const config = getSupabaseConfig();
  if (!config) return null;

  if (!supabaseClient) {
    supabaseClient = createClient(config.url, config.anonKey, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: false,
        persistSession: true,
      },
    });
  }

  return supabaseClient;
};

export const getCurrentAdminUser = async () => {
  const client = getSupabaseClient();
  if (!client) return null;

  const { data, error } = await client.auth.getUser();
  if (error) return null;
  return data.user ?? null;
};

export const signInAdmin = async ({ email, password }) => {
  const client = getSupabaseClient();
  if (!client) {
    return { error: new Error("Supabase nao configurado.") };
  }

  return client.auth.signInWithPassword({
    email,
    password,
  });
};

export const signOutAdmin = async () => {
  const client = getSupabaseClient();
  if (!client) return { error: new Error("Supabase nao configurado.") };

  return client.auth.signOut();
};

export const subscribeAuthState = (callback) => {
  const client = getSupabaseClient();
  if (!client) return () => {};

  const {
    data: { subscription },
  } = client.auth.onAuthStateChange(callback);

  return () => subscription.unsubscribe();
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

    if (!data?.payload || typeof data.payload !== "object") {
      return {
        source: "local",
        remoteConfigured: true,
        overrides: localState.overrides,
        servers: localState.servers,
      };
    }

    const nextState = normalizePersistedPayload(data.payload);

    return {
      source: "remote",
      remoteConfigured: true,
      remoteUpdatedAt: data.updated_at ?? null,
      overrides: nextState.overrides,
      servers: nextState.servers,
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
