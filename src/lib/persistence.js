import { createClient } from "@supabase/supabase-js";

export const STORAGE_KEYS = {
  overrides: "escala.overrides.v1",
  servers: "escala.servers.v1",
  compensationRules: "escala.compensation-rules.v1",
  meta: "escala.state.meta.v1",
};

const SUPABASE_TABLE = "escala_app_state";
const SUPABASE_ROW_ID = "current";
const SUPABASE_HEALTHCHECK_TABLE = "escala_db_healthchecks";
const FALLBACK_SUPABASE_CONFIG = {
  url: "https://jqkvqxpwbvbywjptuext.supabase.co",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impxa3ZxeHB3YnZieXdqcHR1ZXh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA0MjEyMDEsImV4cCI6MjA5NTk5NzIwMX0.cN00Vxzuti3lBb4FAdmAlpdo-gywN_Ri-7KJw39jRNU",
};

const normalizePersistedPayload = (payload) => ({
  overrides: Array.isArray(payload?.overrides) ? payload.overrides : [],
  servers: Array.isArray(payload?.servers) ? payload.servers : [],
  compensationRules: Array.isArray(payload?.compensationRules) ? payload.compensationRules : null,
});

const normalizeLocalMeta = (meta) => ({
  lastLocalSaveAt: typeof meta?.lastLocalSaveAt === "string" && meta.lastLocalSaveAt ? meta.lastLocalSaveAt : null,
  lastRemoteSyncAt: typeof meta?.lastRemoteSyncAt === "string" && meta.lastRemoteSyncAt ? meta.lastRemoteSyncAt : null,
  lastRemoteSeenAt: typeof meta?.lastRemoteSeenAt === "string" && meta.lastRemoteSeenAt ? meta.lastRemoteSeenAt : null,
  pendingRemoteSync: Boolean(meta?.pendingRemoteSync),
  lastSyncErrorAt: typeof meta?.lastSyncErrorAt === "string" && meta.lastSyncErrorAt ? meta.lastSyncErrorAt : null,
});

const normalizeDatabaseHealthcheckRecord = (record) => ({
  id: record.id ?? null,
  test_source: record.test_source ?? "manual",
  status: record.status === "fail" ? "fail" : "ok",
  message: record.message ?? "",
  details: record.details ?? "",
  duration_ms: Number.isFinite(Number(record.duration_ms)) ? Number(record.duration_ms) : null,
  tested_at: record.tested_at ?? null,
  tested_by_user_id: record.tested_by_user_id ?? null,
  tested_by_email: record.tested_by_email ?? null,
  table_name: record.table_name ?? SUPABASE_TABLE,
  row_id: record.row_id ?? SUPABASE_ROW_ID,
});

const createDatabaseHealthcheckId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const isMissingHealthcheckTableError = (message = "") =>
  /could not find the table.*escala_db_healthchecks|schema cache/i.test(String(message));

const parseTimestamp = (value) => {
  if (typeof value !== "string" || !value) {
    return null;
  }

  const parsed = Date.parse(value);
  return Number.isNaN(parsed) ? null : parsed;
};

const isTimestampNewer = (candidate, baseline) => {
  const candidateMs = parseTimestamp(candidate);
  if (candidateMs === null) {
    return false;
  }

  const baselineMs = parseTimestamp(baseline);
  if (baselineMs === null) {
    return true;
  }

  return candidateMs > baselineMs;
};

const hasPersistedState = (state) =>
  Boolean(state?.overrides?.length || state?.servers?.length || Array.isArray(state?.compensationRules));

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

export const readStoredValue = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
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
  compensationRules: readStoredJson(STORAGE_KEYS.compensationRules, null),
});

export const readLocalAppMeta = () => normalizeLocalMeta(readStoredValue(STORAGE_KEYS.meta, {}));

export const writeLocalAppMeta = (meta) => {
  writeStoredJson(STORAGE_KEYS.meta, normalizeLocalMeta(meta));
};

export const writeLocalAppState = ({ overrides = [], servers = [], compensationRules = [] }) => {
  writeStoredJson(STORAGE_KEYS.overrides, overrides);
  writeStoredJson(STORAGE_KEYS.servers, servers);
  writeStoredJson(STORAGE_KEYS.compensationRules, compensationRules);
};

const writePersistedSnapshotLocally = ({ overrides = [], servers = [], compensationRules = [] }, meta = {}) => {
  writeLocalAppState({ overrides, servers, compensationRules });
  writeLocalAppMeta(meta);
};

const syncLocalStateToRemote = async (client, state, localMeta) => {
  const syncedAt = new Date().toISOString();
  const payload = {
    overrides: state.overrides,
    servers: state.servers,
    compensationRules: state.compensationRules,
  };

  const { error } = await client
    .from(SUPABASE_TABLE)
    .upsert(
      {
        id: SUPABASE_ROW_ID,
        payload,
        updated_at: syncedAt,
      },
      { onConflict: "id" },
    );

  if (error) {
    return {
      remoteSaved: false,
      remoteError: error.message,
      remoteSyncedAt: null,
    };
  }

  writePersistedSnapshotLocally(state, {
    ...localMeta,
    lastRemoteSyncAt: syncedAt,
    lastRemoteSeenAt: syncedAt,
    pendingRemoteSync: false,
    lastSyncErrorAt: null,
  });

  return {
    remoteSaved: true,
    remoteError: null,
    remoteSyncedAt: syncedAt,
  };
};

export const loadPersistedAppState = async () => {
  const localState = readLocalAppState();
  const localMeta = readLocalAppMeta();
  const client = getSupabaseClient();

  if (!client) {
    return {
      source: "local",
      remoteConfigured: false,
      syncStatus: localMeta.pendingRemoteSync ? "offline_pending" : "offline",
      localMeta,
      overrides: localState.overrides,
      servers: localState.servers,
      compensationRules: localState.compensationRules,
    };
  }

  try {
    const { data, error } = await client.from(SUPABASE_TABLE).select("payload, updated_at").eq("id", SUPABASE_ROW_ID).maybeSingle();

    if (error) {
      return {
        source: "local",
        remoteConfigured: true,
        syncStatus: localMeta.pendingRemoteSync ? "offline_pending" : "offline",
        remoteError: error.message,
        localMeta,
        overrides: localState.overrides,
        servers: localState.servers,
        compensationRules: localState.compensationRules,
      };
    }

    if (!data?.payload || typeof data.payload !== "object") {
      if (hasPersistedState(localState)) {
        const syncResult = await syncLocalStateToRemote(client, localState, localMeta);
        if (syncResult.remoteSaved) {
          return {
            source: "local",
            remoteConfigured: true,
            syncStatus: "resynced_local",
            remoteUpdatedAt: syncResult.remoteSyncedAt,
            localMeta: readLocalAppMeta(),
            overrides: localState.overrides,
            servers: localState.servers,
            compensationRules: localState.compensationRules,
          };
        }

        return {
          source: "local",
          remoteConfigured: true,
          syncStatus: "pending_remote_sync",
          remoteError: syncResult.remoteError,
          localMeta,
          overrides: localState.overrides,
          servers: localState.servers,
          compensationRules: localState.compensationRules,
        };
      }

      return {
        source: "local",
        remoteConfigured: true,
        syncStatus: "remote_empty",
        localMeta,
        overrides: localState.overrides,
        servers: localState.servers,
        compensationRules: localState.compensationRules,
      };
    }

    const nextState = normalizePersistedPayload(data.payload);
    const remoteUpdatedAt = data.updated_at ?? null;

    if (
      hasPersistedState(localState) &&
      (!hasPersistedState(nextState) || localMeta.pendingRemoteSync || isTimestampNewer(localMeta.lastLocalSaveAt, remoteUpdatedAt))
    ) {
      const syncResult = await syncLocalStateToRemote(client, localState, localMeta);

      if (syncResult.remoteSaved) {
        return {
          source: "local",
          remoteConfigured: true,
          syncStatus: "resynced_local",
          remoteUpdatedAt: syncResult.remoteSyncedAt,
          localMeta: readLocalAppMeta(),
          overrides: localState.overrides,
          servers: localState.servers,
          compensationRules: localState.compensationRules,
        };
      }

      return {
        source: "local",
        remoteConfigured: true,
        syncStatus: "pending_remote_sync",
        remoteUpdatedAt,
        remoteError: syncResult.remoteError,
        localMeta,
        overrides: localState.overrides,
        servers: localState.servers,
        compensationRules: localState.compensationRules,
      };
    }

    if (hasPersistedState(nextState) || !hasPersistedState(localState)) {
      writePersistedSnapshotLocally(nextState, {
        ...localMeta,
        lastRemoteSeenAt: remoteUpdatedAt,
        lastRemoteSyncAt: remoteUpdatedAt,
        pendingRemoteSync: false,
        lastSyncErrorAt: null,
      });
    }

    return {
      source: "remote",
      remoteConfigured: true,
      syncStatus: "remote",
      remoteUpdatedAt,
      localMeta: readLocalAppMeta(),
      overrides: nextState.overrides,
      servers: nextState.servers,
      compensationRules: nextState.compensationRules,
    };
  } catch (error) {
    return {
      source: "local",
      remoteConfigured: true,
      syncStatus: localMeta.pendingRemoteSync ? "offline_pending" : "offline",
      remoteError: error?.message ?? "Falha ao carregar a persistencia remota.",
      localMeta,
      overrides: localState.overrides,
      servers: localState.servers,
      compensationRules: localState.compensationRules,
    };
  }
};

export const savePersistedAppState = async ({ overrides = [], servers = [], compensationRules = [] }) => {
  const localMeta = {
    ...readLocalAppMeta(),
    lastLocalSaveAt: new Date().toISOString(),
    pendingRemoteSync: true,
    lastSyncErrorAt: null,
  };
  writePersistedSnapshotLocally({ overrides, servers, compensationRules }, localMeta);

  const client = getSupabaseClient();
  if (!client) {
    return {
      remoteSaved: false,
      remoteConfigured: false,
      localSavedAt: localMeta.lastLocalSaveAt,
      pendingRemoteSync: true,
    };
  }

  const syncResult = await syncLocalStateToRemote(client, { overrides, servers, compensationRules }, localMeta);

  if (!syncResult.remoteSaved) {
    writeLocalAppMeta({
      ...localMeta,
      pendingRemoteSync: true,
      lastSyncErrorAt: new Date().toISOString(),
    });
  }

  return {
    remoteSaved: syncResult.remoteSaved,
    remoteConfigured: true,
    remoteError: syncResult.remoteError,
    localSavedAt: localMeta.lastLocalSaveAt,
    remoteSyncedAt: syncResult.remoteSyncedAt,
    pendingRemoteSync: !syncResult.remoteSaved,
  };
};

export const loadDatabaseHealthcheckLogs = async ({ limit = 10 } = {}) => {
  const client = getSupabaseClient();

  if (!client) {
    return {
      remoteConfigured: false,
      logs: [],
    };
  }

  try {
    const { data, error } = await client
      .from(SUPABASE_HEALTHCHECK_TABLE)
      .select("id, test_source, status, message, details, duration_ms, tested_at, tested_by_user_id, tested_by_email, table_name, row_id")
      .order("tested_at", { ascending: false })
      .limit(limit);

    if (error) {
      if (isMissingHealthcheckTableError(error.message)) {
        return {
          remoteConfigured: true,
          remoteError: "A tabela public.escala_db_healthchecks ainda nao existe no banco remoto. Aplique a migration supabase/migrations/20260602190000_create_escala_db_healthchecks.sql e recarregue a pagina.",
          migrationPending: true,
          logs: [],
        };
      }

      return {
        remoteConfigured: true,
        remoteError: error.message,
        migrationPending: false,
        logs: [],
      };
    }

    return {
      remoteConfigured: true,
      migrationPending: false,
      logs: Array.isArray(data) ? data.map(normalizeDatabaseHealthcheckRecord) : [],
    };
  } catch (error) {
    return {
      remoteConfigured: true,
      remoteError: error?.message ?? "Falha ao carregar os logs de teste do banco.",
      migrationPending: false,
      logs: [],
    };
  }
};

export const runDatabaseHealthcheck = async ({ source = "manual" } = {}) => {
  const client = getSupabaseClient();

  if (!client) {
    return {
      remoteConfigured: false,
      remoteSaved: false,
      status: "fail",
      message: "Supabase nao configurado.",
      details: "",
      duration_ms: 0,
      log: null,
    };
  }

  const startedAt = Date.now();
  const { data: userData } = await client.auth.getUser();
  let status = "ok";
  let message = "Conexao e leitura da linha current confirmadas.";
  let details = "";

  try {
    const { data, error } = await client.from(SUPABASE_TABLE).select("id, payload, updated_at").eq("id", SUPABASE_ROW_ID).maybeSingle();

    if (error) {
      throw new Error(error.message);
    }

    if (!data) {
      throw new Error("Nenhuma linha current encontrada em escala_app_state.");
    }

    if (data.id !== SUPABASE_ROW_ID) {
      throw new Error(`Linha inesperada retornada: ${String(data.id)}.`);
    }

    if (!data.payload || typeof data.payload !== "object") {
      throw new Error("Payload da linha current invalido.");
    }
  } catch (error) {
    status = "fail";
    message = "Falha ao validar o banco remoto.";
    details = error?.message ?? String(error);
  }

  const logEntry = {
    id: createDatabaseHealthcheckId(),
    test_source: source,
    status,
    message,
    details,
    duration_ms: Date.now() - startedAt,
    tested_at: new Date().toISOString(),
    tested_by_user_id: userData?.user?.id ?? null,
    tested_by_email: userData?.user?.email ?? null,
    table_name: SUPABASE_TABLE,
    row_id: SUPABASE_ROW_ID,
  };

  const { error: insertError } = await client.from(SUPABASE_HEALTHCHECK_TABLE).insert(logEntry);

  if (insertError && isMissingHealthcheckTableError(insertError.message)) {
    return {
      remoteConfigured: true,
      remoteSaved: false,
      remoteError: "A tabela public.escala_db_healthchecks ainda nao existe no banco remoto. Aplique a migration supabase/migrations/20260602190000_create_escala_db_healthchecks.sql e recarregue a pagina.",
      status,
      message,
      details,
      duration_ms: logEntry.duration_ms,
      log: null,
      migrationPending: true,
    };
  }

  return {
    remoteConfigured: true,
    remoteSaved: !insertError,
    remoteError: insertError?.message ?? null,
    migrationPending: false,
    status,
    message,
    details,
    duration_ms: logEntry.duration_ms,
    log: normalizeDatabaseHealthcheckRecord(logEntry),
  };
};
