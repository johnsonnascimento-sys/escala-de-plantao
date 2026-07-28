export const REGIME_PONTOS = "points";
export const REGIME_BANCO_HORAS = "time_bank";
export const MODALIDADE_PONTOS_REMUNERADOS = "paid_points";
export const MODALIDADE_TRABALHO_100 = "work_100";
export const MODALIDADE_SOBREAVISO_TERCO = "on_call_third";

export const DEFAULT_COMPENSATION_RULES = [
  {
    id: "banco-horas-agosto-2026",
    label: "Banco de horas - agosto de 2026",
    start_date: "2026-08-01",
    end_date: "2026-08-31",
    regime: REGIME_BANCO_HORAS,
  },
];

export const normalizeCompensationRule = (rule, index = 0) => ({
  id: rule?.id ?? `compensation-rule-${index}`,
  label: String(rule?.label ?? "").trim(),
  start_date: rule?.start_date ?? "",
  end_date: rule?.end_date ?? "",
  regime: rule?.regime === REGIME_BANCO_HORAS ? REGIME_BANCO_HORAS : REGIME_PONTOS,
  created_at: rule?.created_at ?? null,
  updated_at: rule?.updated_at ?? null,
});

export const getCompensationRule = (date, rules = []) =>
  rules.find((rule) => date >= rule.start_date && date <= rule.end_date) ?? null;

export const getCompensationRegime = (date, rules = []) =>
  getCompensationRule(date, rules)?.regime ?? REGIME_PONTOS;

export const getShiftCompensationRegime = (date, rules = [], mode = null) => {
  if (mode === MODALIDADE_PONTOS_REMUNERADOS) return REGIME_PONTOS;
  if (mode === MODALIDADE_TRABALHO_100 || mode === MODALIDADE_SOBREAVISO_TERCO) return REGIME_BANCO_HORAS;
  return getCompensationRegime(date, rules);
};

export const parseHoursToMinutes = (value) => {
  const match = /^(\d{1,3}):([0-5]\d)$/.exec(String(value ?? "").trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
};

export const formatMinutesAsHours = (minutes = 0) => {
  const safeMinutes = Math.max(0, Math.round(Number(minutes) || 0));
  return `${String(Math.floor(safeMinutes / 60)).padStart(2, "0")}:${String(safeMinutes % 60).padStart(2, "0")}`;
};

export const calculateCreditedMinutes = (mode, reportedMinutes) => {
  const minutes = Math.max(0, Math.round(Number(reportedMinutes) || 0));
  if (mode === MODALIDADE_TRABALHO_100) return minutes * 2;
  if (mode === MODALIDADE_SOBREAVISO_TERCO) return Math.round(minutes / 3);
  return 0;
};

export const getCompensationModeLabel = (mode) => {
  if (mode === MODALIDADE_PONTOS_REMUNERADOS) return "Plantao remunerado (pontos)";
  if (mode === MODALIDADE_TRABALHO_100) return "Trabalho 100%";
  if (mode === MODALIDADE_SOBREAVISO_TERCO) return "Sobreaviso 1/3";
  return "Modalidade pendente";
};

export const decorateShiftCompensation = (shift, rules = []) => {
  const rule = getCompensationRule(shift.data, rules);
  const regime = getShiftCompensationRegime(shift.data, rules, shift.modalidadeCompensacao);

  if (regime !== REGIME_BANCO_HORAS) {
    return {
      ...shift,
      regimeCompensacao: REGIME_PONTOS,
      regraCompensacaoId: rule?.id ?? null,
      modalidadeCompensacao: shift.modalidadeCompensacao === MODALIDADE_PONTOS_REMUNERADOS ? MODALIDADE_PONTOS_REMUNERADOS : null,
      minutosApurados: 0,
      minutosCreditados: 0,
      compensacaoConfirmadaEm: null,
    };
  }

  return {
    ...shift,
    pontos: 0,
    valor: 0,
    regimeCompensacao: REGIME_BANCO_HORAS,
    regraCompensacaoId: rule?.id ?? null,
    modalidadeCompensacao: shift.modalidadeCompensacao ?? null,
    minutosApurados: Number(shift.minutosApurados) || 0,
    minutosCreditados: shift.compensacaoConfirmadaEm ? Number(shift.minutosCreditados) || 0 : 0,
    compensacaoConfirmadaEm: shift.compensacaoConfirmadaEm ?? null,
  };
};

export const getBankHoursStats = (schedule = []) =>
  schedule.reduce((acc, shift) => {
    if (shift.regimeCompensacao !== REGIME_BANCO_HORAS || !shift.servidor || shift.servidor.includes("A DEFINIR") || shift.servidor === "Nenhum Disponivel") {
      return acc;
    }

    if (!acc[shift.servidor]) {
      acc[shift.servidor] = { minutosConfirmados: 0, plantoesPendentes: 0 };
    }

    if (shift.compensacaoConfirmadaEm) {
      acc[shift.servidor].minutosConfirmados += shift.minutosCreditados;
    } else {
      acc[shift.servidor].plantoesPendentes += 1;
    }
    return acc;
  }, {});

export const validateCompensationRules = (candidate, rules = []) => {
  if (!candidate.label || !candidate.start_date || !candidate.end_date) {
    return "Informe nome, data inicial e data final.";
  }
  if (candidate.end_date < candidate.start_date) {
    return "A data final deve ser igual ou posterior a data inicial.";
  }
  const overlaps = rules.some(
    (rule) =>
      rule.id !== candidate.id &&
      candidate.start_date <= rule.end_date &&
      candidate.end_date >= rule.start_date,
  );
  return overlaps ? "O periodo informado se sobrepoe a outra regra cadastrada." : null;
};
