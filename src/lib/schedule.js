import {
  MOTIVO_SORTEIO_ANDRE,
  PTS_DOM_FERIADO,
  PTS_SABADO,
  SERVIDOR_A_DEFINIR,
  VALOR_DOM_FERIADO,
  VALOR_SABADO,
} from "../data/scheduleData";

export const parseDate = (dateStr) => {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d);
};

export const formatDateBr = (dateStr) => dateStr.split("-").reverse().join("/");

export const normalizeText = (value) =>
  (value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();

export const getPlantaoMeta = (tipo) => {
  const isSabado = tipo === "SAB";
  return {
    pontos: isSabado ? PTS_SABADO : PTS_DOM_FERIADO,
    valor: isSabado ? VALOR_SABADO : VALOR_DOM_FERIADO,
  };
};

export const isDateBetween = (target, start, end) => {
  const current = parseDate(target);
  return current >= parseDate(start) && current <= parseDate(end);
};

export const isEmFerias = (servidor, dataPlantaoStr) =>
  (servidor.ferias || []).some(([inicio, fim]) => isDateBetween(dataPlantaoStr, inicio, fim));

export const isImpedido = (servidor, dataPlantaoStr) =>
  (servidor.impedimentos || []).some(([inicio, fim]) => isDateBetween(dataPlantaoStr, inicio, fim));

export const isIndisponivelPlantao = (servidor, dataPlantaoStr) =>
  (servidor.indisponibilidadesPlantao || []).some(([inicio, fim]) => isDateBetween(dataPlantaoStr, inicio, fim));

export const getServidorByNome = (servidores, nome) =>
  servidores.find((servidor) => normalizeText(servidor.nome) === normalizeText(nome));

export const getDisponibilidadeMensagem = (servidores, nome, data) => {
  const servidor = getServidorByNome(servidores, nome);
  if (!servidor) return null;
  if (servidor.active === false) return `${servidor.nome} esta inativo(a) e nao participa da escala automatica.`;
  if (isEmFerias(servidor, data)) return `${servidor.nome} esta de ferias nesta data.`;
  if (isImpedido(servidor, data)) return `${servidor.nome} possui impedimento/recusa nesta data.`;
  if (isIndisponivelPlantao(servidor, data)) return `${servidor.nome} esta temporariamente fora da escala e este dia deve ficar a definir por sorteio.`;
  return null;
};

export const buildBaseSchedule = (plantoesBase, servidores) => {
  const saldoPontos = servidores.reduce((acc, servidor) => {
    acc[servidor.nome] = 0;
    return acc;
  }, {});

  return plantoesBase.map((plantao) => {
    const { pontos, valor } = getPlantaoMeta(plantao.tipo);
    let servidorEscolhido = plantao.fixo || null;
    let notes = "";

    if (plantao.fixo) {
      const servidorFixo = getServidorByNome(servidores, plantao.fixo);
      if (servidorFixo && (servidorFixo.active === false || isIndisponivelPlantao(servidorFixo, plantao.data))) {
        servidorEscolhido = SERVIDOR_A_DEFINIR;
        notes = MOTIVO_SORTEIO_ANDRE;
      }
    }

    if (!servidorEscolhido) {
      const disponiveis = servidores
      .filter((servidor) => {
          if (servidor.active === false) return false;
          if (isEmFerias(servidor, plantao.data)) return false;
          if (isImpedido(servidor, plantao.data)) return false;
          if (isIndisponivelPlantao(servidor, plantao.data)) return false;
          return true;
        })
        .sort((a, b) => {
          const saldoDiff = saldoPontos[a.nome] - saldoPontos[b.nome];
          if (saldoDiff !== 0) return saldoDiff;
          return a.nome.localeCompare(b.nome);
        });

      servidorEscolhido = disponiveis[0]?.nome || "Nenhum Disponivel";
    }

    if (saldoPontos[servidorEscolhido] !== undefined) {
      saldoPontos[servidorEscolhido] += pontos;
    }

    return {
      ...plantao,
      servidor: servidorEscolhido,
      pontos,
      valor,
      origem: "base",
      notes,
    };
  });
};

export const applyOverrides = (baseSchedule, overrides) => {
  const replacedDates = new Set();
  const overridesOrdenados = [...overrides].sort((a, b) => {
    if (a.date === b.date) return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
    return a.date.localeCompare(b.date);
  });

  const normalizedBase = baseSchedule.map((item) => ({ ...item }));
  const createdEntries = [];

  overridesOrdenados.forEach((override) => {
    if (override.mode === "replace") {
      const idx = normalizedBase.findIndex((item) => item.data === override.date);
      if (idx >= 0) {
        normalizedBase[idx] = {
          ...normalizedBase[idx],
          juiz: override.judge_name || normalizedBase[idx].juiz,
          servidor: override.server_name || normalizedBase[idx].servidor,
          desc: override.desc || normalizedBase[idx].desc,
          tipo: override.tipo || normalizedBase[idx].tipo,
          ...getPlantaoMeta(override.tipo || normalizedBase[idx].tipo),
          origem: "override",
          notes: override.notes || "",
          overrideId: override.id,
        };
        replacedDates.add(override.date);
      }
      return;
    }

    if (override.mode === "create") {
      createdEntries.push({
        data: override.date,
        juiz: override.judge_name,
        servidor: override.server_name,
        desc: override.desc,
        tipo: override.tipo,
        ...getPlantaoMeta(override.tipo),
        origem: "manual",
        notes: override.notes || "",
        overrideId: override.id,
      });
    }
  });

  return [...normalizedBase, ...createdEntries].sort((a, b) => {
    if (a.data === b.data) {
      if (a.origem === "manual" && b.origem !== "manual") return 1;
      if (a.origem !== "manual" && b.origem === "manual") return -1;
      return a.servidor.localeCompare(b.servidor);
    }
    return a.data.localeCompare(b.data);
  });
};

export const getStatsGlobais = (escala) =>
  escala.reduce((acc, plantao) => {
    if (plantao.servidor === SERVIDOR_A_DEFINIR || plantao.servidor === "Nenhum Disponivel") {
      return acc;
    }
    if (!acc[plantao.servidor]) {
      acc[plantao.servidor] = { dias: 0, pontos: 0, valor: 0 };
    }
    acc[plantao.servidor].dias += 1;
    acc[plantao.servidor].pontos += plantao.pontos;
    acc[plantao.servidor].valor += plantao.valor;
    return acc;
  }, {});

export const validateOverride = ({ mode, date, judge_name, server_name, desc, tipo }, baseSchedule) => {
  if (!date || !judge_name || !server_name || !desc || !tipo) {
    return "Preencha data, magistrado, servidor, descricao e tipo.";
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return "A data deve estar no formato YYYY-MM-DD.";
  }

  if (!["SAB", "DOM"].includes(tipo)) {
    return "Tipo invalido. Use SAB ou DOM.";
  }

  const existsOnBase = baseSchedule.some((item) => item.data === date);
  if (mode === "replace" && !existsOnBase) {
    return "Nao existe plantao base nesta data para substituir.";
  }

  if (mode === "create" && existsOnBase) {
    return "Ja existe plantao nesta data. Use a edicao para substituir.";
  }

  return null;
};

export const isPlantaoPendente = (plantao) => plantao.servidor === SERVIDOR_A_DEFINIR;
