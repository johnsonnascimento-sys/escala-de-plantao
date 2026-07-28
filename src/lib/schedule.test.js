import test from "node:test";
import assert from "node:assert/strict";
import { SERVIDOR_A_DEFINIR } from "../data/scheduleData.js";
import { applyOverrides, getStatsGlobais } from "./schedule.js";

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
