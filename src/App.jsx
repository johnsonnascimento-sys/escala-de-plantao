import React, { useState, useMemo } from 'react';
import {
  Calendar, User, Shield, Briefcase, ChevronLeft, ChevronRight,
  CheckCircle2, AlertCircle, Coins, Filter, LayoutDashboard,
  Palmtree, Users, FileSpreadsheet, Flag, Info
} from 'lucide-react';

const App = () => {
  const [activeTab, setActiveTab] = useState('escala'); // abas: escala, ferias, feriados
  const [mesAtivo, setMesAtivo] = useState(1); // Iniciando em Fevereiro para visualização
  const [servidorSelecionado, setServidorSelecionado] = useState("Todos");

  // --- CONFIGURAÇÕES E DADOS ---
  const PTS_SABADO = 3;
  const PTS_DOM_FERIADO = 4;
  const VALOR_SABADO = 582.53;
  const VALOR_DOM_FERIADO = 776.70;
  const NOMES_MESES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  const servidores = [
    { nome: "ANDRE LUIS", janOnly: false, ferias: [["2026-01-07", "2026-02-04"], ["2026-02-05", "2026-02-13"], ["2026-02-16", "2026-02-17"], ["2026-02-19", "2026-02-27"]] },
    { nome: "CLÁUDIA MARIA", janOnly: true, ferias: [] },
    { nome: "EMANUEL CORREA", janOnly: false, ferias: [] },
    { nome: "JEFFERSON DONIZETI", janOnly: false, ferias: [["2026-01-12", "2026-01-12"], ["2026-07-20", "2026-07-31"]] },
    {
      nome: "JEFFERSON FARIA",
      janOnly: false,
      ferias: [
        ["2026-01-26", "2026-02-09"],
        ["2026-02-14", "2026-02-14"],
        ["2026-02-15", "2026-02-15"],
        ["2026-05-01", "2026-05-01"],
        ["2026-07-13", "2026-07-24"]
      ]
    },
    { nome: "JOHNSON TEIXEIRA", janOnly: false, ferias: [] },
    { nome: "MARCO AURELIO", janOnly: false, ferias: [["2026-10-26", "2026-10-30"], ["2026-11-03", "2026-11-19"], ["2026-11-23", "2026-11-30"]] },
    { nome: "MARIA LUCIA", janOnly: false, ferias: [["2026-03-02", "2026-03-10"], ["2026-06-29", "2026-07-08"], ["2026-10-13", "2026-10-21"], ["2026-11-09", "2026-11-19"]] },
  ];

  // Plantões base estritamente conforme as imagens fornecidas
  // NENHUMA DATA EXTRA INCLUÍDA
  const plantoesBase = [
    // JANEIRO
    { data: "2026-01-10", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "CLÁUDIA MARIA" },
    { data: "2026-01-11", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "EMANUEL CORREA" },
    { data: "2026-01-17", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-01-18", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },

    // FEVEREIRO
    { data: "2026-02-07", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-02-08", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "MARIA LUCIA" },
    { data: "2026-02-14", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "ANDRE LUIS" },
    { data: "2026-02-15", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "ANDRE LUIS" },

    // MARÇO
    { data: "2026-03-07", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-03-08", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-03-14", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-03-15", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "MARCO AURELIO" },

    // ABRIL
    { data: "2026-04-01", juiz: "Dr. Vitor", desc: "STM", tipo: "DOM", fixo: "EMANUEL CORREA" }, // STM (Jud) na imagem aparece como "STM" ou similar? Mantendo desc.
    { data: "2026-04-02", juiz: "Dr. Vitor", desc: "STM", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-04-03", juiz: "Dr. Vitor", desc: "Paixão", tipo: "DOM", fixo: "MARIA LUCIA" },
    { data: "2026-04-04", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-04-05", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "ANDRE LUIS" },
    { data: "2026-04-11", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-04-12", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "MARCO AURELIO" },

    // MAIO
    { data: "2026-05-01", juiz: "Dra. Vera", desc: "Trabalho", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-05-02", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "EMANUEL CORREA" },
    { data: "2026-05-03", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "MARIA LUCIA" },
    { data: "2026-05-09", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-05-10", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-05-30", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "ANDRE LUIS" },
    { data: "2026-05-31", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "EMANUEL CORREA" },

    // JUNHO
    { data: "2026-06-04", juiz: "Dr. Vitor", desc: "Corpus Christi", tipo: "DOM", fixo: "MARCO AURELIO" },
    { data: "2026-06-06", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-06-07", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-06-27", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "MARIA LUCIA" },
    { data: "2026-06-28", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "ANDRE LUIS" },

    // JULHO
    { data: "2026-07-04", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-07-05", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "EMANUEL CORREA" },
    { data: "2026-07-25", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-07-26", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "MARCO AURELIO" },

    // AGOSTO
    { data: "2026-08-01", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "MARIA LUCIA" },
    { data: "2026-08-02", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-08-22", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-08-23", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "ANDRE LUIS" },
    { data: "2026-08-29", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-08-30", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "MARIA LUCIA" },

    // SETEMBRO
    { data: "2026-09-19", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "EMANUEL CORREA" },
    { data: "2026-09-20", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "MARCO AURELIO" },
    { data: "2026-09-26", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-09-27", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },

    // OUTUBRO
    { data: "2026-10-12", juiz: "Dra. Vera", desc: "Aparecida", tipo: "DOM", fixo: "JEFFERSON FARIA" },
    { data: "2026-10-17", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "ANDRE LUIS" },
    { data: "2026-10-18", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "EMANUEL CORREA" },
    { data: "2026-10-24", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "MARIA LUCIA" },
    { data: "2026-10-25", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "JEFFERSON DONIZETI" },

    // NOVEMBRO
    { data: "2026-11-14", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-11-15", juiz: "Dr. Vitor", desc: "Proclamação", tipo: "DOM", fixo: "ANDRE LUIS" },
    { data: "2026-11-20", juiz: "Dr. Vitor", desc: "Conc. Negra", tipo: "DOM", fixo: "MARCO AURELIO" },
    { data: "2026-11-21", juiz: "Dr. Vitor", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON FARIA" },
    { data: "2026-11-22", juiz: "Dr. Vitor", desc: "Domingo", tipo: "DOM", fixo: "MARIA LUCIA" },

    // DEZEMBRO
    { data: "2026-12-08", juiz: "Dra. Vera", desc: "Dia Justiça", tipo: "DOM", fixo: "EMANUEL CORREA" },
    { data: "2026-12-12", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "JEFFERSON DONIZETI" },
    { data: "2026-12-13", juiz: "Dra. Vera", desc: "Domingo", tipo: "DOM", fixo: "JOHNSON TEIXEIRA" },
    { data: "2026-12-19", juiz: "Dra. Vera", desc: "Sábado", tipo: "SAB", fixo: "MARCO AURELIO" },
  ];

  const parseDate = (dateStr) => {
    // espera formato YYYY-MM-DD
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
  };

  const isEmFerias = (servidor, dataPlantaoStr) => {
    const dataPlantao = parseDate(dataPlantaoStr);
    return servidor.ferias.some(([inicio, fim]) => {
      const dInicio = parseDate(inicio);
      const dFim = parseDate(fim);
      return dataPlantao >= dInicio && dataPlantao <= dFim;
    });
  };

  // --- LÓGICA DE GERAÇÃO DA ESCALA AUTOMÁTICA ---
  const escalaTotal = useMemo(() => {
    // 1. Inicializar saldo de pontos dos servidores
    const saldoPontos = servidores.reduce((acc, s) => ({ ...acc, [s.nome]: 0 }), {});

    // 2. Processar cada plantão cronologicamente
    return plantoesBase.map(plantao => {
      const pontos = plantao.tipo === "SAB" ? PTS_SABADO : PTS_DOM_FERIADO;
      const valor = plantao.tipo === "SAB" ? VALOR_SABADO : VALOR_DOM_FERIADO;
      const mes = parseInt(plantao.data.split('-')[1]) - 1; // 0-based month

      let escolhidoNome = null;

      if (plantao.fixo) {
        escolhidoNome = plantao.fixo;
      } else {
        // Filtrar servidores disponíveis
        const disponiveis = servidores.filter(s => {
          // Verificar Regra Cláudia (Jan Only)
          if (s.janOnly && mes !== 0) return false;

          // Verificar Férias
          if (isEmFerias(s, plantao.data)) return false;

          return true;
        });

        // Ordenar por menor pontuação acumulada (Critério de Equidade)
        // Se empate, ordem alfabética para estabilidade
        disponiveis.sort((a, b) => {
          const diff = saldoPontos[a.nome] - saldoPontos[b.nome];
          if (diff !== 0) return diff;
          return a.nome.localeCompare(b.nome);
        });

        if (disponiveis.length > 0) {
          escolhidoNome = disponiveis[0].nome;
        } else {
          escolhidoNome = "Nenhum Disponível"; // Fallback
        }
      }

      // Atualizar saldo de pontos
      if (escolhidoNome && saldoPontos[escolhidoNome] !== undefined) {
        saldoPontos[escolhidoNome] += pontos;
      }

      return { ...plantao, servidor: escolhidoNome, pontos, valor };
    });
  }, []); // Dependências vazias pois dados base são constantes dentro do componente

  const statsGlobais = useMemo(() => {
    const counts = {};
    escalaTotal.forEach(p => {
      if (!counts[p.servidor]) counts[p.servidor] = { dias: 0, pontos: 0, valor: 0 };
      counts[p.servidor].dias++;
      counts[p.servidor].pontos += p.pontos;
      counts[p.servidor].valor += p.valor;
    });
    return counts;
  }, [escalaTotal]);

  const plantoesFiltrados = useMemo(() => {
    if (servidorSelecionado === "Todos") {
      return escalaTotal.filter(p => parseInt(p.data.split('-')[1]) === mesAtivo + 1);
    }
    return escalaTotal.filter(p => p.servidor === servidorSelecionado);
  }, [escalaTotal, mesAtivo, servidorSelecionado]);

  // --- DADOS DA PORTARIA STM 11682 + FERIADOS MUNICIPAIS/ESTADUAIS ---
  // (Mantido igual)
  const feriadosPortaria = {
    feriados: [
      { data: "01/01/2026", nome: "Ano Novo", tipo: "Nacional" },
      { data: "25/01/2026", nome: "Aniversário de São Paulo", tipo: "Municipal" },
      { data: "16/02/2026", nome: "Feriado Judicial", tipo: "Judicial (Lei 5.010/66)" },
      { data: "17/02/2026", nome: "Feriado Judicial", tipo: "Judicial (Lei 5.010/66)" },
      { data: "01/04/2026", nome: "Feriado Judicial", tipo: "Judicial (Lei 5.010/66)" },
      { data: "02/04/2026", nome: "Feriado Judicial", tipo: "Judicial (Lei 5.010/66)" },
      { data: "03/04/2026", nome: "Paixão de Cristo", tipo: "Judicial (Lei 5.010/66)" },
      { data: "08/04/2026", nome: "Solenidade OMJM", tipo: "Judicial" },
      { data: "21/04/2026", nome: "Tiradentes", tipo: "Nacional" },
      { data: "01/05/2026", nome: "Dia do Trabalho", tipo: "Nacional" },
      { data: "04/06/2026", nome: "Corpus Christi", tipo: "Municipal (Lei 14.485/07)" },
      { data: "09/07/2026", nome: "Data Magna de São Paulo", tipo: "Estadual" },
      { data: "11/08/2026", nome: "Dia do Magistrado/Advogado", tipo: "Judicial (Lei 5.010/66)" },
      { data: "07/09/2026", nome: "Independência do Brasil", tipo: "Nacional" },
      { data: "12/10/2026", nome: "Nsa. Sra. Aparecida", tipo: "Nacional" },
      { data: "02/11/2026", nome: "Finados", tipo: "Nacional" },
      { data: "20/11/2026", nome: "Consciência Negra", tipo: "Nacional" },
      { data: "08/12/2026", nome: "Dia da Justiça", tipo: "Judicial (Lei 5.010/66)" },
      { data: "25/12/2026", nome: "Natal", tipo: "Nacional" },
    ],
    pontosFacultativos: [
      { data: "16/02/2026", nome: "Carnaval", obs: "Municipal e Estadual" },
      { data: "17/02/2026", nome: "Carnaval", obs: "Municipal e Estadual" },
      { data: "18/02/2026", nome: "Quarta-Feira de Cinzas", obs: "Até às 14 horas" },
      { data: "20/04/2026", nome: "Ponto Facultativo", obs: "Véspera Tiradentes" },
      { data: "04/06/2026", nome: "Corpus Christi", obs: "Facultativo na JMU, Feriado em SP" },
      { data: "05/06/2026", nome: "Ponto Facultativo", obs: "Pós Corpus Christi" },
      { data: "10/08/2026", nome: "Ponto Facultativo", obs: "Véspera 11 Ago" },
      { data: "30/10/2026", nome: "Dia do Servidor Público", obs: "Transferido de 28/10" },
      { data: "07/12/2026", nome: "Ponto Facultativo", obs: "Véspera Dia da Justiça" },
    ],
    2027: [
      { data: "01/01/2027", nome: "Ano Novo", tipo: "Nacional" },
      { data: "08/02/2027", nome: "Feriado Judicial", tipo: "Judicial" },
      { data: "09/02/2027", nome: "Feriado Judicial", tipo: "Judicial" },
    ]
  };

  const exportToExcel = () => {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Data;Descricao;Magistrado;Servidor;Pontos\n";
    escalaTotal.forEach(p => {
      const dataFormatada = p.data.split('-').reverse().join('/');
      csvContent += `${dataFormatada};${p.desc};${p.juiz};${p.servidor};${p.pontos}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "Escala_Plantao_2026.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const TabEscala = () => (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <div className="flex items-center gap-2 text-slate-400 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0">
          <Filter size={16} />
          <button onClick={() => setServidorSelecionado("Todos")} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${servidorSelecionado === "Todos" ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>TODOS</button>
          {servidores.map(s => (
            <button key={s.nome} onClick={() => setServidorSelecionado(s.nome)} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${servidorSelecionado === s.nome ? 'bg-indigo-600 text-white shadow-md' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}>{s.nome.split(' ')[0]}</button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center px-2">
            <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
              <Briefcase size={16} /> {servidorSelecionado === "Todos" ? `Plantões de ${NOMES_MESES[mesAtivo]}` : `Escala Anual: ${servidorSelecionado}`}
            </h2>
            <div className={`flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ${servidorSelecionado !== 'Todos' ? 'opacity-30 pointer-events-none' : ''}`}>
              <button onClick={() => setMesAtivo(m => Math.max(0, m - 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16} /></button>
              <span className="px-3 font-bold text-slate-700 min-w-[140px] text-center text-xs uppercase">{NOMES_MESES[mesAtivo]}</span>
              <button onClick={() => setMesAtivo(m => Math.min(11, m + 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight size={16} /></button>
            </div>
          </div>

          <div className="space-y-4">
            {plantoesFiltrados.map((p, idx) => (
              <div key={idx} className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-6 group hover:border-indigo-300 transition-colors">
                <div className="text-center md:border-r border-slate-100 md:pr-6 min-w-[70px]">
                  <span className="block text-2xl font-black text-slate-800 leading-none">{p.data.split('-')[2]}</span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">{servidorSelecionado !== 'Todos' ? `${p.data.split('-')[1]}/${p.data.split('-')[0].slice(-2)}` : p.desc}</span>
                </div>
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-3">
                    <Shield size={16} className="text-indigo-400" />
                    <div>
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Juiz(a)</span>
                      <span className="font-semibold text-slate-700 text-xs">{p.juiz}</span>
                    </div>
                  </div>
                  <div className={`p-2.5 rounded-xl flex items-center gap-3 border ${p.servidor === "Nenhum Disponível" ? "bg-red-50 border-red-200" : (p.servidor === "Nenhum" ? "bg-red-50" : "bg-emerald-50 border-emerald-100")}`}>
                    <User size={16} className="text-emerald-500" />
                    <div className="flex-1">
                      <span className="text-[9px] text-slate-400 font-bold uppercase block">Servidor(a)</span>
                      <span className="font-semibold text-xs text-emerald-800">{p.servidor}</span>
                    </div>
                    <span className="text-xs font-bold text-slate-500">{p.pontos} pts</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest border-b pb-4"><Coins size={16} className="text-amber-500" /> Balanço Geral</h3>
            <div className="space-y-4">
              {servidores.map(s => {
                const data = statsGlobais[s.nome] || { dias: 0, pontos: 0 };
                const max = Math.max(...Object.values(statsGlobais).map(st => st.pontos), 1);
                return (
                  <div key={s.nome} className="cursor-pointer" onClick={() => setServidorSelecionado(s.nome)}>
                    <div className="flex justify-between text-[10px] mb-1.5 font-bold text-slate-600 px-1">
                      <span>{s.nome}</span>
                      <span className="text-indigo-600">
                        {data.pontos} pts
                        {s.nome === "JOHNSON TEIXEIRA" && "*"}
                      </span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full bg-indigo-500`} style={{ width: `${(data.pontos / max) * 100}%` }}></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <p className="text-[10px] text-slate-400 mt-4 italic leading-tight">
              * JOHNSON TEIXEIRA: Marco Aurélio solicitou troca do dia 07/02/2026 (Sábado) para compensação futura.
            </p>
          </div>
          <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[10px] space-y-3">
            <h3 className="font-bold text-white text-xs flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Regras Ativas</h3>
            <p>• Cláudia apenas Janeiro (Teletrabalho em Fev).</p>
            <p>• Equidade: Sábado=3, Dom/Fer=4.</p>
            <p>• Algoritmo de Equidade Automático Ativo.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const TabFerias = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {servidores.map(emp => (
        <div key={emp.nome} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><User size={20} /></div>
            <h2 className="text-sm font-bold text-slate-800 uppercase">{emp.nome}</h2>
          </div>
          <div className="space-y-2">
            {emp.ferias.length > 0 ? emp.ferias.map((f, i) => (
              <div key={i} className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
                <Palmtree size={14} className="text-orange-500" />
                {f[0].split('-').reverse().join('/')} a {f[1].split('-').reverse().join('/')}
              </div>
            )) : <p className="text-xs text-slate-400 italic">Sem registros de férias para 2026.</p>}
          </div>
        </div>
      ))}
    </div>
  );

  const TabFeriados = () => (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Info size={20} className="text-indigo-600" />
          <h3 className="font-bold text-indigo-900">Cronograma de Feriados e Pontos Facultativos - 2026</h3>
        </div>
        <p className="text-xs text-indigo-700 leading-relaxed italic">
          Baseado na Portaria STM nº 11682 (JMU) consolidado com feriados Municipais (São Paulo) e Estaduais (SP).
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <Flag size={16} className="text-rose-500" /> Feriados 2026
          </h3>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {feriadosPortaria.feriados.map((f, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="bg-slate-100 px-3 py-1.5 rounded-xl text-[10px] font-black text-slate-600 min-w-[80px] text-center">
                    {f.data.split('/')[0]}/{f.data.split('/')[1]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{f.nome}</div>
                    <div className="text-[9px] text-slate-400 uppercase font-medium">{f.tipo}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            <CheckCircle2 size={16} className="text-emerald-500" /> Pontos Facultativos 2026
          </h3>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm">
            <div className="divide-y divide-slate-100">
              {feriadosPortaria.pontosFacultativos.map((p, i) => (
                <div key={i} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  <div className="bg-indigo-50 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 min-w-[80px] text-center">
                    {p.data.split('/')[0]}/{p.data.split('/')[1]}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">{p.nome}</div>
                    <div className="text-[9px] text-slate-400 font-medium">{p.obs}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100"><LayoutDashboard size={32} /></div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Escala de Plantão 2026</h1>
              <p className="text-slate-500 font-medium">Gestão Integrada de Plantões e Férias</p>
            </div>
          </div>
          <div className="w-full md:w-auto">
            <button onClick={exportToExcel} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-emerald-100">
              <FileSpreadsheet size={20} /> Exportar para Excel
            </button>
          </div>
        </div>
        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <button onClick={() => setActiveTab('escala')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'escala' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Briefcase size={16} /> Escala</button>
          <button onClick={() => setActiveTab('ferias')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'ferias' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Palmtree size={16} /> Férias/Indisponibilidade</button>
          <button onClick={() => setActiveTab('feriados')} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === 'feriados' ? 'bg-indigo-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50'}`}><Flag size={16} /> Feriados/Portaria</button>
        </div>
        <div className="animate-in fade-in duration-500">
          {activeTab === 'escala' && <TabEscala />}
          {activeTab === 'ferias' && <TabFerias />}
          {activeTab === 'feriados' && <TabFeriados />}
        </div>
      </div>
    </div>
  );
};

export default App;
