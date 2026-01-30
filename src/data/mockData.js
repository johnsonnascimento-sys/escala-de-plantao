export const employees = [
  { id: 1, name: 'Andre', role: 'Juiz', score: 120, avatar: 'A' },
  { id: 2, name: 'Cláudia', role: 'Servidor', score: 95, avatar: 'C' },
  { id: 3, name: 'Emanuel', role: 'Servidor', score: 110, avatar: 'E' },
  { id: 4, name: 'Jefferson', role: 'Servidor', score: 105, avatar: 'J' },
  { id: 5, name: 'Johnson', role: 'Servidor', score: 85, avatar: 'Jo' },
  { id: 6, name: 'Marco', role: 'Servidor', score: 90, avatar: 'M' },
  { id: 7, name: 'Maria', role: 'Juiz', score: 130, avatar: 'Ma' },
];

export const rules = [
  { id: 1, text: 'Equidade de Pontos - Janeiro', status: 'active' },
  { id: 2, text: 'Teletrabalho - 30%', status: 'active' },
  { id: 3, text: 'Plantão Recesso - 2x Pontos', status: 'warning' },
];

// Generate shifts for January 2026
export const shifts = [
  { id: 101, date: '2026-01-01', day: 'Qui', type: 'Feriado', judgeId: 1, serverId: 2 },
  { id: 102, date: '2026-01-02', day: 'Sex', type: 'Normal', judgeId: 7, serverId: 3 },
  { id: 103, date: '2026-01-03', day: 'Sáb', type: 'Fim de Semana', judgeId: 1, serverId: 4 },
  { id: 104, date: '2026-01-04', day: 'Dom', type: 'Fim de Semana', judgeId: 7, serverId: 5 },
  { id: 105, date: '2026-01-05', day: 'Seg', type: 'Normal', judgeId: 1, serverId: 6 },
  { id: 106, date: '2026-01-06', day: 'Ter', type: 'Normal', judgeId: 7, serverId: 2 },
  { id: 107, date: '2026-01-07', day: 'Qua', type: 'Normal', judgeId: 1, serverId: 3 },
  { id: 108, date: '2026-01-08', day: 'Qui', type: 'Normal', judgeId: 7, serverId: 4 },
  { id: 109, date: '2026-01-09', day: 'Sex', type: 'Normal', judgeId: 1, serverId: 5 },
  { id: 110, date: '2026-01-10', day: 'Sáb', type: 'Fim de Semana', judgeId: 7, serverId: 6 },
];
