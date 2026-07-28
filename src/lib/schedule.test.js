import test from "node:test";
import assert from "node:assert/strict";
import { SERVIDOR_A_DEFINIR } from "../data/scheduleData.js";
import {
  calculateCreditedMinutes,
  DEFAULT_COMPENSATION_RULES,
  formatMinutesAsHours,
  getBankHoursStats,
  MODALIDADE_PONTOS_REMUNERADOS,
  MODALIDADE_SOBREAVISO_TERCO,
  MODALIDADE_TRABALHO_100,
  parseHoursToMinutes,
  REGIME_BANCO_HORAS,
  REGIME_PONTOS,
  validateCompensationRules,
} from "./compensation.js";
import { applyOverrides, buildBaseSchedule, getPlantaoMeta, getStatsGlobais } from "./schedule.js";

test("separa datas anteriores da previsao anual e mantem o dia atual como previsto", () => {
  const escala = [
    { data: "2026-07-27", servidor: "SERVIDOR TESTE", pontos: 3, valor: 100 },
    { data: "2026-07-28", servidor: "SERVIDOR TESTE", pontos: 4, valor: 200 },
    { data: "2026-07-29", servidor: "SERVIDOR TESTE", pontos: 3, valor: 100 },
  ];

  const stats = getStatsGlobais(escala, "2026-07-28")["SERVIDOR TESTE"];

  assert.deepEqual(stats.realizados, { dias: 1, pontos: 3, valor: 100 });
  assert.deepEqual(stats.previstoAnual, { dias: 3, pontos: 10, valor: 400 });
});

test("Johnson tem 15 pontos realizados e 38 previstos em 28/07/2026", () => {
  const criarPlantao = (data, pontos) => ({ data, servidor: "JOHNSON TEIXEIRA", pontos, valor: 0 });
  const escala = [
    criarPlantao("2026-01-18", 4),
    criarPlantao("2026-02-07", 3),
    criarPlantao("2026-04-02", 4),
    criarPlantao("2026-05-01", 4),
    criarPlantao("2026-08-02", 4),
    criarPlantao("2026-09-27", 4),
    criarPlantao("2026-11-14", 3),
    criarPlantao("2026-12-08", 4),
    criarPlantao("2026-12-13", 4),
    criarPlantao("2026-12-20", 4),
  ];
  const statsJohnson = getStatsGlobais(escala, "2026-07-28")["JOHNSON TEIXEIRA"];

  assert.equal(statsJohnson.realizados.pontos, 15);
  assert.equal(statsJohnson.previstoAnual.pontos, 38);
});

test("contabiliza substituicoes e plantoes manuais na versao consolidada", () => {
  const escalaBase = [
    { data: "2026-01-10", servidor: "ANA", juiz: "Juiz", desc: "Sabado", tipo: "SAB", pontos: 3, valor: 100, origem: "base" },
  ];
  const escalaConsolidada = applyOverrides(escalaBase, [
    {
      id: "replace-1",
      mode: "replace",
      date: "2026-01-10",
      judge_name: "Juiz",
      server_name: "BIA",
      desc: "Sabado",
      tipo: "SAB",
      created_at: "2026-01-01T00:00:00.000Z",
      updated_at: "2026-01-01T00:00:00.000Z",
    },
    {
      id: "create-1",
      mode: "create",
      date: "2026-08-01",
      judge_name: "Juiz",
      server_name: "BIA",
      desc: "Domingo",
      tipo: "DOM",
      created_at: "2026-01-02T00:00:00.000Z",
      updated_at: "2026-01-02T00:00:00.000Z",
    },
  ]);

  const stats = getStatsGlobais(escalaConsolidada, "2026-07-28");

  assert.equal(stats.ANA, undefined);
  assert.deepEqual(stats.BIA.realizados, { dias: 1, pontos: 3, valor: 582.53 });
  assert.deepEqual(stats.BIA.previstoAnual, { dias: 2, pontos: 7, valor: 1359.23 });
});

test("ignora plantoes pendentes e nao cria estatistica para servidor sem plantao", () => {
  const stats = getStatsGlobais(
    [{ data: "2026-01-10", servidor: SERVIDOR_A_DEFINIR, pontos: 3, valor: 582.53 }],
    "2026-07-28",
  );

  assert.deepEqual(stats, {});
  assert.equal(stats["SERVIDOR SEM PLANTAO"], undefined);
});

test("julho mantem pontos e agosto zera pontos e remuneracao", () => {
  assert.deepEqual(getPlantaoMeta("DOM", "2026-07-31", DEFAULT_COMPENSATION_RULES), { pontos: 4, valor: 776.7 });
  assert.deepEqual(getPlantaoMeta("DOM", "2026-08-01", DEFAULT_COMPENSATION_RULES), { pontos: 0, valor: 0 });
  assert.deepEqual(getPlantaoMeta("SAB", "2026-08-31", DEFAULT_COMPENSATION_RULES), { pontos: 0, valor: 0 });
  assert.deepEqual(getPlantaoMeta("SAB", "2026-09-01", DEFAULT_COMPENSATION_RULES), { pontos: 3, valor: 582.53 });
});

test("calcula trabalho 100% e sobreaviso em minutos", () => {
  assert.equal(parseHoursToMinutes("05:00"), 300);
  assert.equal(calculateCreditedMinutes(MODALIDADE_TRABALHO_100, 300), 600);
  assert.equal(formatMinutesAsHours(600), "10:00");
  assert.equal(parseHoursToMinutes("24:00"), 1440);
  assert.equal(calculateCreditedMinutes(MODALIDADE_SOBREAVISO_TERCO, 1440), 480);
  assert.equal(formatMinutesAsHours(480), "08:00");
  assert.equal(parseHoursToMinutes("5.5"), null);
});

test("somente apuracao confirmada aumenta o banco de horas", () => {
  const base = buildBaseSchedule(
    [
      { data: "2026-08-01", juiz: "Juiz", desc: "Sabado", tipo: "SAB", fixo: "ANA" },
      { data: "2026-08-02", juiz: "Juiz", desc: "Domingo", tipo: "DOM", fixo: "ANA" },
    ],
    [{ nome: "ANA", ferias: [], impedimentos: [] }],
    DEFAULT_COMPENSATION_RULES,
  );
  const escala = applyOverrides(base, [
    {
      id: "confirmed",
      mode: "replace",
      date: "2026-08-01",
      server_name: "ANA",
      tipo: "SAB",
      compensation_mode: MODALIDADE_TRABALHO_100,
      reported_minutes: 300,
      credited_minutes: 600,
      compensation_confirmed_at: "2026-08-02T10:00:00.000Z",
    },
  ], DEFAULT_COMPENSATION_RULES);

  assert.deepEqual(getBankHoursStats(escala).ANA, { minutosConfirmados: 600, plantoesPendentes: 1 });
  assert.equal(escala.every((shift) => shift.regimeCompensacao === REGIME_BANCO_HORAS && shift.pontos === 0 && shift.valor === 0), true);
});

test("regras consecutivas sao aceitas e periodos sobrepostos sao rejeitados", () => {
  const rules = [
    { id: "jul", label: "Julho", start_date: "2026-07-01", end_date: "2026-07-31", regime: REGIME_PONTOS },
  ];
  const consecutive = { id: "ago", label: "Agosto", start_date: "2026-08-01", end_date: "2026-08-31", regime: REGIME_BANCO_HORAS };
  const overlapping = { id: "overlap", label: "Sobreposta", start_date: "2026-07-31", end_date: "2026-08-10", regime: REGIME_BANCO_HORAS };

  assert.equal(validateCompensationRules(consecutive, rules), null);
  assert.match(validateCompensationRules(overlapping, rules), /sobrepoe/);
});

test("modalidade explicita permite banco de horas em qualquer mes", () => {
  const base = buildBaseSchedule(
    [{ data: "2026-07-05", juiz: "Juiz", desc: "Domingo", tipo: "DOM", fixo: "ANA" }],
    [{ nome: "ANA", ferias: [], impedimentos: [] }],
    DEFAULT_COMPENSATION_RULES,
  );
  const [shift] = applyOverrides(base, [{
    id: "julho-banco",
    mode: "replace",
    date: "2026-07-05",
    server_name: "ANA",
    tipo: "DOM",
    compensation_mode: MODALIDADE_TRABALHO_100,
    reported_minutes: 300,
    credited_minutes: 600,
    compensation_confirmed_at: "2026-07-06T10:00:00.000Z",
  }], DEFAULT_COMPENSATION_RULES);

  assert.equal(shift.regimeCompensacao, REGIME_BANCO_HORAS);
  assert.equal(shift.pontos, 0);
  assert.equal(shift.valor, 0);
  assert.equal(getBankHoursStats([shift]).ANA.minutosConfirmados, 600);
});

test("modalidade remunerada explicita pode prevalecer sobre regra do periodo", () => {
  const meta = getPlantaoMeta("DOM", "2026-08-02", DEFAULT_COMPENSATION_RULES, MODALIDADE_PONTOS_REMUNERADOS);
  assert.deepEqual(meta, { pontos: 4, valor: 776.7 });

  const base = buildBaseSchedule(
    [{ data: "2026-08-02", juiz: "Juiz", desc: "Domingo", tipo: "DOM", fixo: "ANA" }],
    [{ nome: "ANA", ferias: [], impedimentos: [] }],
    DEFAULT_COMPENSATION_RULES,
  );
  const [shift] = applyOverrides(base, [{
    id: "agosto-remunerado",
    mode: "replace",
    date: "2026-08-02",
    server_name: "ANA",
    tipo: "DOM",
    compensation_mode: MODALIDADE_PONTOS_REMUNERADOS,
  }], DEFAULT_COMPENSATION_RULES);

  assert.equal(shift.regimeCompensacao, REGIME_PONTOS);
  assert.equal(shift.pontos, 4);
  assert.equal(shift.valor, 776.7);
});
