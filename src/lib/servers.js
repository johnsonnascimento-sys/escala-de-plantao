import { defaultServidores } from "../data/scheduleData";

const DATE_RANGE_REGEX = /^(\d{4}-\d{2}-\d{2})\s*(?:a|to|-|ate|,)\s*(\d{4}-\d{2}-\d{2})$/i;
const createRangeId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

export const normalizeServerName = (value) =>
  (value || "")
    .trim()
    .replace(/\s+/g, " ")
    .toUpperCase();

export const normalizeDateRanges = (ranges = []) =>
  (Array.isArray(ranges) ? ranges : [])
    .filter((range) => Array.isArray(range) && range.length >= 2)
    .map(([start, end]) => [String(start), String(end)]);

export const serializeDateRanges = (ranges = []) => normalizeDateRanges(ranges).map(([start, end]) => `${start} a ${end}`).join("\n");

export const createDateRangeDraft = (start = "", end = "", id = createRangeId()) => ({
  id,
  start: String(start ?? ""),
  end: String(end ?? ""),
});

export const normalizeDateRangeDrafts = (drafts = []) =>
  (Array.isArray(drafts) ? drafts : [])
    .filter((draft) => draft && typeof draft === "object")
    .map((draft) => createDateRangeDraft(draft.start, draft.end, draft.id ?? createRangeId()));

export const dateRangesToDrafts = (ranges = []) => normalizeDateRanges(ranges).map(([start, end]) => createDateRangeDraft(start, end));

export const draftRangesToDateRanges = (drafts = []) =>
  normalizeDateRangeDrafts(drafts)
    .map(({ start, end }) => [String(start).trim(), String(end).trim()])
    .filter(([start, end]) => Boolean(start) || Boolean(end));

export const parseDateRanges = (text = "") => {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const ranges = [];
  const invalidLines = [];

  lines.forEach((line) => {
    const match = line.match(DATE_RANGE_REGEX);
    if (!match) {
      invalidLines.push(line);
      return;
    }

    const [, start, end] = match;
    ranges.push([start, end]);
  });

  return { ranges, invalidLines };
};

export const normalizeServerRecord = (server) => ({
  id: server.id ?? null,
  nome: normalizeServerName(server.nome),
  janOnly: Boolean(server.janOnly ?? server.jan_only ?? false),
  ferias: normalizeDateRanges(server.ferias),
  impedimentos: normalizeDateRanges(server.impedimentos),
  indisponibilidadesPlantao: normalizeDateRanges(server.indisponibilidadesPlantao ?? server.indisponibilidades_plantao),
  active: server.active !== false,
  created_at: server.created_at ?? null,
  updated_at: server.updated_at ?? null,
});

export const mergeServerLists = (defaultServers = defaultServidores, persistedServers = []) => {
  const persistedByName = new Map(
    (persistedServers || [])
      .map(normalizeServerRecord)
      .map((server) => [normalizeServerName(server.nome), server]),
  );

  const merged = defaultServers.map((server) => {
    const normalizedDefault = normalizeServerRecord(server);
    const persisted = persistedByName.get(normalizeServerName(normalizedDefault.nome));
    return persisted ? { ...normalizedDefault, ...persisted } : normalizedDefault;
  });

  const extras = [...persistedByName.entries()]
    .filter(([normalizedName]) => !defaultServers.some((item) => normalizeServerName(item.nome) === normalizedName))
    .map(([, server]) => server)
    .sort((a, b) => a.nome.localeCompare(b.nome));

  return [...merged, ...extras];
};

export const serverToFormState = (server = null) => ({
  id: server?.id ?? null,
  nome: server?.nome ?? "",
  janOnly: server?.janOnly ?? false,
  active: server?.active !== false,
  feriasRows: dateRangesToDrafts(server?.ferias ?? []),
  impedimentosRows: dateRangesToDrafts(server?.impedimentos ?? []),
  indisponibilidadesPlantaoRows: dateRangesToDrafts(server?.indisponibilidadesPlantao ?? []),
});
