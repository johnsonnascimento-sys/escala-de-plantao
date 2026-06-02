import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  Briefcase,
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Coins,
  FileText,
  Filter,
  Flag,
  Info,
  LayoutDashboard,
  Palmtree,
  PencilLine,
  Lock,
  LogIn,
  LogOut,
  PlusCircle,
  Save,
  Users,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminDrawPanel from "./components/AdminDrawPanel";
import AdminServersPanel from "./components/AdminServersPanel";
import PlantaoCard from "./components/PlantaoCard";
import { NOMES_MESES, SERVIDOR_A_DEFINIR, defaultServidores, feriadosPortaria, plantoesBase } from "./data/scheduleData";
import {
  applyOverrides,
  buildBaseSchedule,
  formatDateBr,
  getDisponibilidadeMensagem,
  getStatsGlobais,
  isPlantaoPendente,
  validateOverride,
} from "./lib/schedule";
import { draftRangesToDateRanges, mergeServerLists, normalizeServerName, normalizeServerRecord, serverToFormState } from "./lib/servers";
import {
  getCurrentAdminUser,
  isRemotePersistenceConfigured,
  loadPersistedAppState,
  readStoredJson,
  savePersistedAppState,
  STORAGE_KEYS,
  signInAdmin,
  signOutAdmin,
  subscribeAuthState,
  writeLocalAppState,
} from "./lib/persistence";

const createId = () => globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(16).slice(2)}`;

const normalizeOverrideRecord = (override, index = 0) => ({
  id: override.id ?? `${override.date || "override"}-${index}-${createId()}`,
  date: override.date ?? "",
  mode: override.mode ?? "create",
  judge_name: override.judge_name ?? "",
  server_name: override.server_name ?? "",
  desc: override.desc ?? "",
  tipo: override.tipo ?? "DOM",
  notes: override.notes ?? "",
  created_at: override.created_at ?? override.updated_at ?? new Date().toISOString(),
  updated_at: override.updated_at ?? override.created_at ?? new Date().toISOString(),
});

const createEmptyForm = () => ({
  id: null,
  mode: "create",
  date: "",
  judge_name: "Dr. Vitor",
  server_name: "",
  desc: "",
  tipo: "DOM",
  notes: "",
});

const createServerForm = () => serverToFormState();

const TabEscala = ({ servidores, servidorSelecionado, setServidorSelecionado, mesAtivo, setMesAtivo, plantoesFiltrados, statsGlobais }) => (
  <div className="space-y-6">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
      <div className="flex items-center gap-2 text-slate-400 overflow-x-auto w-full no-scrollbar pb-2 md:pb-0">
        <Filter size={16} />
        <button onClick={() => setServidorSelecionado("Todos")} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${servidorSelecionado === "Todos" ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>TODOS</button>
        <button onClick={() => setServidorSelecionado(SERVIDOR_A_DEFINIR)} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${servidorSelecionado === SERVIDOR_A_DEFINIR ? "bg-amber-500 text-white shadow-md" : "bg-amber-50 text-amber-700 hover:bg-amber-100"}`}>A DEFINIR</button>
        {servidores.map((servidor) => (
          <button key={servidor.nome} onClick={() => setServidorSelecionado(servidor.nome)} className={`px-4 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap ${servidorSelecionado === servidor.nome ? "bg-indigo-600 text-white shadow-md" : "bg-slate-50 text-slate-500 hover:bg-slate-100"}`}>
            {servidor.nome.split(" ")[0]}
          </button>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-4">
        <div className="flex justify-between items-center px-2">
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Briefcase size={16} /> {servidorSelecionado === "Todos" ? `Plantoes de ${NOMES_MESES[mesAtivo]}` : `Escala anual: ${servidorSelecionado}`}
          </h2>
          <div className={`flex items-center bg-slate-100 p-1 rounded-xl border border-slate-200 ${servidorSelecionado !== "Todos" ? "opacity-30 pointer-events-none" : ""}`}>
            <button onClick={() => setMesAtivo((mes) => Math.max(0, mes - 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronLeft size={16} /></button>
            <span className="px-3 font-bold text-slate-700 min-w-[140px] text-center text-xs uppercase">{NOMES_MESES[mesAtivo]}</span>
            <button onClick={() => setMesAtivo((mes) => Math.min(11, mes + 1))} className="p-1.5 hover:bg-white rounded-lg transition-all"><ChevronRight size={16} /></button>
          </div>
        </div>

        <div className="space-y-4">
          {plantoesFiltrados.map((plantao) => (
            <PlantaoCard key={`${plantao.data}-${plantao.servidor}-${plantao.overrideId || "base"}`} plantao={plantao} servidorSelecionado={servidorSelecionado} />
          ))}
          {plantoesFiltrados.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">Nenhum plantao encontrado para o filtro atual.</div>}
        </div>
      </div>

      <div className="space-y-6">
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2 text-xs uppercase tracking-widest border-b pb-4"><Coins size={16} className="text-amber-500" /> Balanco geral</h3>
          <div className="space-y-4">
            {servidores.map((servidor) => {
              const data = statsGlobais[servidor.nome] || { dias: 0, pontos: 0 };
              const max = Math.max(...Object.values(statsGlobais).map((stat) => stat.pontos), 1);
              return (
                <div key={servidor.nome} className="cursor-pointer" onClick={() => setServidorSelecionado(servidor.nome)}>
                  <div className="flex justify-between text-[10px] mb-1.5 font-bold text-slate-600 px-1">
                    <span>{servidor.nome}</span>
                    <span className="text-indigo-600">{data.pontos} pts</span>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${(data.pontos / max) * 100}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[10px] space-y-3">
          <h3 className="font-bold text-white text-xs flex items-center gap-2"><CheckCircle2 size={14} className="text-emerald-400" /> Regras ativas</h3>
          <p>Claudia esta bloqueada por impedimento ate 31/12/2026.</p>
          <p>Equidade: Sabado = 3, Domingo/Feriado = 4.</p>
          <p>Andre Luis fica fora do plantao entre 13/04 e 14/08/2026; nesses casos a escala fica a definir por sorteio.</p>
          <p>Overrides locais substituem a escala base quando cadastrados neste navegador.</p>
        </div>
      </div>
    </div>
  </div>
);

const TabFerias = ({ servidores }) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {servidores.map((servidor) => (
      <div key={servidor.nome} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500"><Users size={18} /></div>
          <h2 className="text-sm font-bold text-slate-800 uppercase">{servidor.nome}</h2>
        </div>
        <div className="space-y-2">
          {servidor.ferias.map((ferias, index) => (
            <div key={`f-${index}`} className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-orange-50 p-2 rounded-lg border border-orange-100">
              <Palmtree size={14} className="text-orange-500" />
              {formatDateBr(ferias[0])} a {formatDateBr(ferias[1])}
            </div>
          ))}
          {(servidor.impedimentos || []).map((impedimento, index) => (
            <div key={`i-${index}`} className="flex items-center gap-2 text-xs font-medium text-slate-600 bg-red-50 p-2 rounded-lg border border-red-100">
              <X size={14} className="text-red-500" />
              {formatDateBr(impedimento[0])} a {formatDateBr(impedimento[1])}
            </div>
          ))}
        </div>
      </div>
    ))}
  </div>
);

const TabFeriados = () => (
  <div className="space-y-8">
    <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Info size={20} className="text-indigo-600" />
        <h3 className="font-bold text-indigo-900">Cronograma de feriados e pontos facultativos - 2026</h3>
      </div>
      <p className="text-xs text-indigo-700 leading-relaxed italic">Baseado na Portaria do Foro da 2a CJM no 1115 consolidada com a Portaria STM no 11682.</p>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {[{ title: "Feriados 2026", icon: Flag, items: feriadosPortaria.feriados, accent: "rose", sub: "tipo" }, { title: "Pontos facultativos 2026", icon: CheckCircle2, items: feriadosPortaria.pontosFacultativos, accent: "emerald", sub: "obs" }].map((section) => (
        <div key={section.title} className="space-y-4">
          <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 px-2">
            {section.icon === Flag ? <Flag size={16} className="text-rose-500" /> : <CheckCircle2 size={16} className="text-emerald-500" />} {section.title}
          </h3>
          <div className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-sm divide-y divide-slate-100">
            {section.items.map((item, index) => (
              <div key={index} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                <div className={`px-3 py-1.5 rounded-xl text-[10px] font-black min-w-[80px] text-center ${section.accent === "rose" ? "bg-slate-100 text-slate-600" : "bg-indigo-50 text-indigo-600"}`}>
                  {item.data.split("/")[0]}/{item.data.split("/")[1]}
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-800">{item.nome}</div>
                  <div className="text-[9px] text-slate-400 font-medium">{item[section.sub]}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  </div>
);

const App = () => {
  const hasRemotePersistence = isRemotePersistenceConfigured();
  const [activeTab, setActiveTab] = useState("escala");
  const [mesAtivo, setMesAtivo] = useState(new Date().getMonth());
  const [servidorSelecionado, setServidorSelecionado] = useState("Todos");
  const [overrides, setOverrides] = useState(() => (hasRemotePersistence ? [] : readStoredJson(STORAGE_KEYS.overrides, []).map(normalizeOverrideRecord)));
  const [formState, setFormState] = useState(createEmptyForm());
  const [formMessage, setFormMessage] = useState("");
  const [adminFilterMonth, setAdminFilterMonth] = useState(new Date().getMonth());
  const [adminDateFilter, setAdminDateFilter] = useState("");
  const [adminSection, setAdminSection] = useState("schedule");
  const [serverRows, setServerRows] = useState(() => (hasRemotePersistence ? [] : readStoredJson(STORAGE_KEYS.servers, []).map(normalizeServerRecord)));
  const [serverForm, setServerForm] = useState(createServerForm());
  const [serverMessage, setServerMessage] = useState("");
  const [selectedDrawDate, setSelectedDrawDate] = useState("");
  const [eligibleServers, setEligibleServers] = useState([]);
  const [drawMessage, setDrawMessage] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [persistenceMessage, setPersistenceMessage] = useState(hasRemotePersistence ? "Carregando persistencia remota..." : "Persistindo somente neste navegador.");
  const [adminUser, setAdminUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authMessage, setAuthMessage] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const overridesRef = useRef(overrides);
  const serverRowsRef = useRef(serverRows);

  useEffect(() => {
    overridesRef.current = overrides;
  }, [overrides]);

  useEffect(() => {
    serverRowsRef.current = serverRows;
  }, [serverRows]);

  useEffect(() => {
    let active = true;

    (async () => {
      if (!hasRemotePersistence) {
        if (active) setAuthLoading(false);
        return;
      }

      const user = await getCurrentAdminUser();
      if (!active) return;

      setAdminUser(user);
      setAuthLoading(false);
    })();

    const unsubscribe = subscribeAuthState((_, session) => {
      if (!active) return;
      setAdminUser(session?.user ?? null);
      setAuthLoading(false);
    });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [hasRemotePersistence]);

  useEffect(() => {
    let active = true;

    (async () => {
      const persisted = await loadPersistedAppState();
      if (!active) return;

      const nextOverrides = (persisted.overrides || []).map(normalizeOverrideRecord);
      const nextServers = (persisted.servers || []).map(normalizeServerRecord);

      if (persisted.source === "remote") {
        setOverrides(nextOverrides);
        setServerRows(nextServers);
        overridesRef.current = nextOverrides;
        serverRowsRef.current = nextServers;
        writeLocalAppState({ overrides: nextOverrides, servers: nextServers });
        setPersistenceMessage(
          persisted.remoteUpdatedAt
            ? `Persistencia remota ativa. Ultima sincronizacao em ${new Date(persisted.remoteUpdatedAt).toLocaleString("pt-BR")}.`
            : "Persistencia remota ativa e sincronizada.",
        );
      } else if (persisted.remoteConfigured && !persisted.remoteError) {
        setPersistenceMessage("Banco remoto configurado, mas sem dados. O cache local sera sincronizado.");
        if (nextOverrides.length > 0 || nextServers.length > 0) {
          void savePersistedAppState({ overrides: nextOverrides, servers: nextServers }).then((result) => {
            if (!active) return;
            setPersistenceMessage(result.remoteSaved ? "Cache local sincronizado com o banco remoto." : "Cache local salvo, mas a sincronizacao remota falhou.");
          });
        }
      } else if (persisted.remoteError) {
        setPersistenceMessage(`Persistencia remota indisponivel. Usando cache local. ${persisted.remoteError}`);
      } else {
        setPersistenceMessage("Persistindo somente neste navegador.");
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  const servidores = useMemo(() => mergeServerLists(defaultServidores, serverRows), [serverRows]);
  const escalaBase = useMemo(() => buildBaseSchedule(plantoesBase, servidores), [servidores]);
  const escalaTotal = useMemo(() => applyOverrides(escalaBase, overrides), [escalaBase, overrides]);
  const statsGlobais = useMemo(() => getStatsGlobais(escalaTotal), [escalaTotal]);
  const warningMessage = useMemo(() => getDisponibilidadeMensagem(servidores, formState.server_name, formState.date), [servidores, formState.server_name, formState.date]);

  const plantoesFiltrados = useMemo(() => {
    if (servidorSelecionado === "Todos") return escalaTotal.filter((item) => Number(item.data.split("-")[1]) === mesAtivo + 1);
    if (servidorSelecionado === SERVIDOR_A_DEFINIR) return escalaTotal.filter((item) => item.servidor === SERVIDOR_A_DEFINIR);
    return escalaTotal.filter((item) => item.servidor === servidorSelecionado);
  }, [escalaTotal, mesAtivo, servidorSelecionado]);

  const plantoesPendentes = useMemo(() => escalaTotal.filter((item) => isPlantaoPendente(item)), [escalaTotal]);
  const adminItems = useMemo(
    () => escalaTotal.filter((item) => Number(item.data.split("-")[1]) === adminFilterMonth + 1 && (!adminDateFilter || item.data === adminDateFilter)),
    [adminDateFilter, adminFilterMonth, escalaTotal],
  );
  const selectedPendingShift = useMemo(() => plantoesPendentes.find((item) => item.data === selectedDrawDate) || null, [plantoesPendentes, selectedDrawDate]);
  const canEdit = Boolean(adminUser);

  const buildEligibleServers = (date, preservedSelection = []) =>
    servidores
      .filter((servidor) => servidor.active !== false)
      .map((servidor) => ({
        nome: servidor.nome,
        warning: getDisponibilidadeMensagem(servidores, servidor.nome, date),
        selected: preservedSelection.length > 0 ? preservedSelection.includes(servidor.nome) : !getDisponibilidadeMensagem(servidores, servidor.nome, date),
      }));

  const exportToPDF = () => {
    const doc = new jsPDF("p", "mm", "a4");
    const margin = 14;
    doc.setFontSize(18);
    doc.text("Escala de Plantao 2026", margin, 18);
    doc.setFontSize(10);
    doc.text(`Gerado em ${new Date().toLocaleString("pt-BR")}`, margin, 25);
    autoTable(doc, {
      startY: 32,
      margin: { left: margin, right: margin },
      head: [["Data", "Descricao", "Magistrado", "Servidor", "Tipo", "Pts", "Origem"]],
      body: escalaTotal.map((plantao) => [formatDateBr(plantao.data), plantao.desc, plantao.juiz, plantao.servidor, plantao.tipo, String(plantao.pontos), plantao.origem === "base" ? "Base" : plantao.origem === "manual" ? "Manual" : "Editado"]),
      theme: "grid",
      headStyles: { fillColor: [79, 70, 229], textColor: 255, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
    });
    if (plantoesPendentes.length > 0) {
      doc.addPage();
      doc.setFontSize(18);
      doc.text("Plantoes pendentes de sorteio", margin, 18);
      autoTable(doc, {
        startY: 26,
        margin: { left: margin, right: margin },
        head: [["Data", "Descricao", "Magistrado", "Observacao"]],
        body: plantoesPendentes.map((plantao) => [formatDateBr(plantao.data), plantao.desc, plantao.juiz, plantao.notes || SERVIDOR_A_DEFINIR]),
        theme: "grid",
        headStyles: { fillColor: [217, 119, 6], textColor: 255, fontStyle: "bold" },
        bodyStyles: { fontSize: 8 },
      });
    }
    doc.addPage();
    doc.setFontSize(18);
    doc.text("Balanco geral consolidado", margin, 18);
    autoTable(doc, {
      startY: 26,
      margin: { left: margin, right: margin },
      head: [["Servidor", "Dias", "Pontos", "Valor"]],
      body: servidores.map((servidor) => {
        const stat = statsGlobais[servidor.nome] || { dias: 0, pontos: 0, valor: 0 };
        return [servidor.nome, String(stat.dias), String(stat.pontos), stat.valor.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })];
      }),
      theme: "grid",
      headStyles: { fillColor: [15, 23, 42], textColor: 255, fontStyle: "bold" },
    });
    doc.save("Escala_Plantao_2026_Consolidada.pdf");
  };

  const resetOverrideForm = () => {
    setFormState(createEmptyForm());
    setFormMessage("");
  };

  const resetServerForm = () => {
    setServerForm(createServerForm());
    setServerMessage("");
  };

  const persistSnapshot = async (nextOverrides, nextServers) => {
    const result = await savePersistedAppState({ overrides: nextOverrides, servers: nextServers });
    if (result.remoteConfigured) {
      setPersistenceMessage(
        result.remoteSaved ? "Salvo localmente e sincronizado com o banco remoto." : `Salvo localmente, mas a sincronizacao remota falhou. ${result.remoteError || ""}`.trim(),
      );
    } else {
      setPersistenceMessage("Persistido somente neste navegador.");
    }
    return result;
  };

  const validateRangeDrafts = (rows = [], label = "") => {
    const invalidIndexes = rows
      .map((row, index) => ({
        index,
        start: String(row?.start ?? "").trim(),
        end: String(row?.end ?? "").trim(),
      }))
      .filter((row) => !row.start || !row.end)
      .map((row) => row.index + 1);

    if (invalidIndexes.length > 0) {
      return `${label} com períodos incompletos: ${invalidIndexes.join(", ")}. Preencha início e fim ou remova a linha.`;
    }

    return null;
  };

  const handleAdminLogin = async (event) => {
    event.preventDefault();
    setAuthMessage("");

    if (!authEmail.trim() || !authPassword.trim()) {
      setAuthMessage("Informe e-mail e senha para entrar.");
      return;
    }

    const { error } = await signInAdmin({ email: authEmail.trim(), password: authPassword });
    if (error) {
      setAuthMessage(error.message || "Nao foi possivel entrar.");
      return;
    }

    setAuthPassword("");
  };

  const handleAdminLogout = async () => {
    const { error } = await signOutAdmin();
    if (error) {
      setAuthMessage(error.message || "Nao foi possivel sair.");
      return;
    }

    setAdminUser(null);
    setAuthPassword("");
    setAuthMessage("");
  };

  const saveServer = async () => {
    if (!canEdit) {
      return setServerMessage("Faça login de administrador para alterar servidores.");
    }

    const nome = normalizeServerName(serverForm.nome);
    if (!nome) return setServerMessage("Informe o nome do servidor.");

    const feriasRows = serverForm.feriasRows || [];
    const impedimentosRows = serverForm.impedimentosRows || [];
    const indisponibilidadesPlantaoRows = serverForm.indisponibilidadesPlantaoRows || [];

    const feriasError = validateRangeDrafts(feriasRows, "Férias");
    if (feriasError) return setServerMessage(feriasError);

    const impedimentosError = validateRangeDrafts(impedimentosRows, "Impedimentos / recusas");
    if (impedimentosError) return setServerMessage(impedimentosError);

    const indisponibilidadesError = validateRangeDrafts(indisponibilidadesPlantaoRows, "Indisponibilidades de plantão");
    if (indisponibilidadesError) {
      return setServerMessage(indisponibilidadesError);
    }

    const now = new Date().toISOString();
    const existing = serverForm.id ? serverRowsRef.current.find((item) => item.id === serverForm.id) : serverRowsRef.current.find((item) => normalizeServerName(item.nome) === nome);
    const payload = normalizeServerRecord({
      id: existing?.id ?? serverForm.id ?? createId(),
      nome,
      ferias: draftRangesToDateRanges(feriasRows),
      impedimentos: draftRangesToDateRanges(impedimentosRows),
      indisponibilidades_plantao: draftRangesToDateRanges(indisponibilidadesPlantaoRows),
      active: serverForm.active,
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });

    const nextServers = (() => {
      const current = serverRowsRef.current;
      const next = current.filter((item) => item.id !== payload.id && normalizeServerName(item.nome) !== nome);
      return [...next, payload].sort((a, b) => a.nome.localeCompare(b.nome));
    })();
    setServerRows(nextServers);
    await persistSnapshot(overridesRef.current, nextServers);
    setServerForm(createServerForm());
    setServerMessage("Servidor salvo com sucesso.");
  };

  const deleteServer = async (server) => {
    if (!canEdit) {
      return setServerMessage("Faça login de administrador para remover servidores.");
    }

    if (!server.id) {
      return setServerMessage("Este servidor faz parte da base padrao. Edite-o para criar uma sobreposicao ou adicione um servidor novo.");
    }

    const nextServers = serverRowsRef.current.filter((item) => item.id !== server.id);
    setServerRows(nextServers);
    await persistSnapshot(overridesRef.current, nextServers);
    if (serverForm.id === server.id) resetServerForm();
    setServerMessage("Servidor removido com sucesso.");
  };

  const saveOverride = async () => {
    if (!canEdit) {
      return setFormMessage("Faça login de administrador para salvar alteracoes.");
    }

    const validationError = validateOverride(formState, escalaBase);
    if (validationError) return setFormMessage(validationError);

    const now = new Date().toISOString();
    const existing = formState.id ? overridesRef.current.find((item) => item.id === formState.id) : null;
    const payload = normalizeOverrideRecord({
      id: existing?.id ?? formState.id ?? createId(),
      date: formState.date,
      mode: formState.mode,
      judge_name: formState.judge_name.trim(),
      server_name: formState.server_name,
      desc: formState.desc.trim(),
      tipo: formState.tipo,
      notes: formState.notes.trim(),
      created_at: existing?.created_at ?? now,
      updated_at: now,
    });

    const nextOverrides = (() => {
      const current = overridesRef.current;
      const next = current.filter((item) => item.id !== payload.id);
      return [...next, payload].sort((a, b) => {
        if (a.date === b.date) return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
        return a.date.localeCompare(b.date);
      });
    })();
    setOverrides(nextOverrides);
    await persistSnapshot(nextOverrides, serverRowsRef.current);
    setFormState(createEmptyForm());
    setFormMessage("Override salvo com sucesso.");
  };

  const toggleEligibleServer = (nome) => {
    setEligibleServers((current) => current.map((item) => (item.nome === nome ? { ...item, selected: !item.selected } : item)));
  };

  const resetDefaultEligibleServers = () => {
    if (!selectedPendingShift) return;
    setEligibleServers(buildEligibleServers(selectedPendingShift.data));
  };

  const selectPendingShift = (plantao) => {
    setSelectedDrawDate(plantao.data);
    setEligibleServers(buildEligibleServers(plantao.data));
    setDrawMessage("");
  };

  const runDraw = async () => {
    if (!canEdit) {
      return setDrawMessage("Faça login de administrador para executar o sorteio.");
    }

    if (!selectedPendingShift) return setDrawMessage("Selecione um plantao pendente para sortear.");
    const participantes = eligibleServers.filter((item) => item.selected);
    if (participantes.length === 0) return setDrawMessage("Selecione ao menos um servidor para participar do sorteio.");

    setDrawing(true);
    setDrawMessage("");
    const sorteado = participantes[Math.floor(Math.random() * participantes.length)];
    const payload = normalizeOverrideRecord({
      id: createId(),
      date: selectedPendingShift.data,
      mode: "replace",
      judge_name: selectedPendingShift.juiz,
      server_name: sorteado.nome,
      desc: selectedPendingShift.desc,
      tipo: selectedPendingShift.tipo,
      notes: `Sorteio realizado entre: ${participantes.map((item) => item.nome).join(", ")}. Sorteado: ${sorteado.nome}.`,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    const nextOverrides = (() => {
      const current = overridesRef.current;
      const next = current.filter((item) => item.id !== payload.id);
      return [...next, payload].sort((a, b) => {
        if (a.date === b.date) return new Date(a.updated_at || a.created_at || 0) - new Date(b.updated_at || b.created_at || 0);
        return a.date.localeCompare(b.date);
      });
    })();
    setOverrides(nextOverrides);
    await persistSnapshot(nextOverrides, serverRowsRef.current);
    setDrawing(false);
    setDrawMessage(`Sorteio concluido. Servidor sorteado: ${sorteado.nome}.`);
    setSelectedDrawDate("");
    setEligibleServers([]);
  };

  const handleEditPlantao = (plantao) => {
    setFormState({
      id: plantao.overrideId || null,
      mode: plantao.origem === "manual" ? "create" : "replace",
      date: plantao.data,
      judge_name: plantao.juiz,
      server_name: plantao.servidor,
      desc: plantao.desc,
      tipo: plantao.tipo,
      notes: plantao.notes || "",
    });
    setFormMessage("");
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 md:p-8 font-sans text-slate-900">
      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; }`}</style>
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
          <div className="flex items-center gap-4">
            <div className="p-4 bg-indigo-600 rounded-3xl text-white shadow-xl shadow-indigo-100"><LayoutDashboard size={32} /></div>
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight">Escala de Plantao 2026</h1>
              <p className="text-slate-500 font-medium">Gestao integrada de plantoes, ferias e ajustes manuais locais</p>
              <p className="text-slate-400 text-xs font-medium mt-1">{persistenceMessage} {`Escala consolidada com ${overrides.length} override(s)`}</p>
            </div>
          </div>
          <button onClick={exportToPDF} className="w-full md:w-auto flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl text-sm font-bold transition-all shadow-lg shadow-indigo-100">
            <FileText size={20} /> Exportar PDF consolidado
          </button>
        </div>

        <div className="flex flex-wrap bg-white p-1.5 rounded-2xl shadow-sm border border-slate-200 mb-8 gap-1">
          <button onClick={() => setActiveTab("escala")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "escala" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Briefcase size={16} /> Escala</button>
          <button onClick={() => setActiveTab("ferias")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "ferias" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Palmtree size={16} /> Ferias</button>
          <button onClick={() => setActiveTab("feriados")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "feriados" ? "bg-indigo-600 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><Flag size={16} /> Feriados</button>
          <button onClick={() => setActiveTab("admin")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "admin" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><PencilLine size={16} /> Painel admin</button>
        </div>

        <div className="space-y-6">
          {activeTab === "escala" && <TabEscala servidores={servidores} servidorSelecionado={servidorSelecionado} setServidorSelecionado={setServidorSelecionado} mesAtivo={mesAtivo} setMesAtivo={setMesAtivo} plantoesFiltrados={plantoesFiltrados} statsGlobais={statsGlobais} />}
          {activeTab === "ferias" && <TabFerias servidores={servidores} />}
          {activeTab === "feriados" && <TabFeriados />}
          {activeTab === "admin" && (
            <>
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Painel administrativo local</p>
                  <h2 className="text-2xl font-black text-slate-800">{adminSection === "schedule" ? "Edicao da escala" : adminSection === "servers" ? "Cadastro de servidores" : "Ferramenta de sorteio"}</h2>
                  <p className="text-sm text-slate-500">{canEdit ? `Autenticado como ${adminUser?.email || "administrador"}.` : "Acesso restrito. Faça login para editar."}</p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  {canEdit && (
                    <button onClick={handleAdminLogout} className="rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 border border-slate-200 text-slate-600 hover:bg-slate-50">
                      <LogOut size={16} /> Sair
                    </button>
                  )}
                  <button disabled={!canEdit} onClick={() => setAdminSection("schedule")} className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${adminSection === "schedule" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"} ${!canEdit ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}>
                    <Calendar size={16} /> Escala
                  </button>
                  <button disabled={!canEdit} onClick={() => setAdminSection("servers")} className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${adminSection === "servers" ? "bg-emerald-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"} ${!canEdit ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}>
                    <Users size={16} /> Servidores
                  </button>
                  <button disabled={!canEdit} onClick={() => setAdminSection("draw")} className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${adminSection === "draw" ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"} ${!canEdit ? "opacity-50 cursor-not-allowed hover:bg-transparent" : ""}`}>
                    <Users size={16} /> Sorteio
                  </button>
                </div>
              </div>

              {authLoading ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="flex items-center gap-3 text-slate-600">
                    <Lock size={18} className="text-indigo-500" />
                    <span className="text-sm font-semibold">Carregando acesso administrativo...</span>
                  </div>
                </div>
              ) : !canEdit ? (
                <div className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm">
                  <div className="max-w-lg mx-auto space-y-5">
                    <div className="flex items-start gap-3">
                      <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                        <Lock size={20} />
                      </div>
                      <div>
                        <h3 className="text-xl font-black text-slate-800">Acesso restrito</h3>
                        <p className="text-sm text-slate-500">O painel de edição exige login de administrador. A leitura da escala continua pública.</p>
                      </div>
                    </div>

                    <form className="space-y-4" onSubmit={handleAdminLogin}>
                      <label className="block text-sm font-semibold text-slate-600">
                        E-mail
                        <input
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                          type="email"
                          value={authEmail}
                          onChange={(event) => setAuthEmail(event.target.value)}
                          placeholder="admin@exemplo.com"
                          autoComplete="email"
                        />
                      </label>
                      <label className="block text-sm font-semibold text-slate-600">
                        Senha
                        <input
                          className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
                          type="password"
                          value={authPassword}
                          onChange={(event) => setAuthPassword(event.target.value)}
                          placeholder="Senha do administrador"
                          autoComplete="current-password"
                        />
                      </label>
                      {authMessage && <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900">{authMessage}</div>}
                      <button type="submit" className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 flex items-center justify-center gap-2">
                        <LogIn size={16} /> Entrar
                      </button>
                    </form>
                  </div>
                </div>
              ) : (
                <>

              {canEdit && adminSection === "schedule" && (
                <div className="grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6">
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        <Calendar size={18} className="text-indigo-500" />
                        <h3 className="text-lg font-black text-slate-800">Plantoes cadastrados</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-[220px_1fr]">
                        <label className="text-sm font-semibold text-slate-600">
                          Mes
                          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={adminFilterMonth} onChange={(event) => setAdminFilterMonth(Number(event.target.value))}>
                            {NOMES_MESES.map((mes, index) => <option key={mes} value={index}>{mes}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Filtrar por data
                          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" type="date" value={adminDateFilter} onChange={(event) => setAdminDateFilter(event.target.value)} />
                        </label>
                      </div>
                      <div className="space-y-3">
                        {adminItems.map((plantao) => <PlantaoCard key={`${plantao.data}-${plantao.servidor}-${plantao.overrideId || "base"}-admin`} plantao={plantao} onEdit={handleEditPlantao} />)}
                        {adminItems.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhum plantao encontrado para os filtros administrativos.</div>}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
                      <div className="flex items-center gap-3">
                        {formState.mode === "create" ? <PlusCircle size={18} className="text-emerald-500" /> : <PencilLine size={18} className="text-indigo-500" />}
                        <h3 className="text-lg font-black text-slate-800">{formState.mode === "create" ? "Novo plantao manual" : "Editar plantao"}</h3>
                      </div>
                      <div className="grid gap-4 md:grid-cols-2">
                        <label className="text-sm font-semibold text-slate-600">
                          Tipo de registro
                          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.mode} onChange={(event) => setFormState((current) => ({ ...current, mode: event.target.value }))}>
                            <option value="create">Criar novo plantao</option>
                            <option value="replace">Substituir plantao existente</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Data
                          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" type="date" value={formState.date} onChange={(event) => setFormState((current) => ({ ...current, date: event.target.value }))} />
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Magistrado
                          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.judge_name} onChange={(event) => setFormState((current) => ({ ...current, judge_name: event.target.value }))} />
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Servidor
                          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.server_name} onChange={(event) => setFormState((current) => ({ ...current, server_name: event.target.value }))}>
                            <option value="">Selecione</option>
                            <option value={SERVIDOR_A_DEFINIR}>{SERVIDOR_A_DEFINIR}</option>
                            {servidores.map((servidor) => <option key={servidor.nome} value={servidor.nome}>{servidor.nome}{servidor.active === false ? " (Inativo)" : ""}</option>)}
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Tipo
                          <select className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.tipo} onChange={(event) => setFormState((current) => ({ ...current, tipo: event.target.value }))}>
                            <option value="SAB">Sabado</option>
                            <option value="DOM">Domingo/Feriado</option>
                          </select>
                        </label>
                        <label className="text-sm font-semibold text-slate-600">
                          Descricao
                          <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.desc} onChange={(event) => setFormState((current) => ({ ...current, desc: event.target.value }))} placeholder="Ex.: Domingo, Tiradentes, Sabado" />
                        </label>
                      </div>
                      <label className="text-sm font-semibold text-slate-600 block">
                        Observacao
                        <textarea className="mt-2 min-h-[120px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={formState.notes} onChange={(event) => setFormState((current) => ({ ...current, notes: event.target.value }))} placeholder="Descreva o motivo da alteracao manual." />
                      </label>
                      {warningMessage && <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 flex gap-3"><AlertCircle size={18} className="shrink-0 mt-0.5" /><span>{warningMessage}</span></div>}
                      {formMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{formMessage}</div>}
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button onClick={saveOverride} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 flex items-center justify-center gap-2">
                          <Save size={16} /> Salvar override
                        </button>
                        <button onClick={resetOverrideForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                          Limpar formulario
                        </button>
                      </div>
                    </div>

                    <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[13px] space-y-3">
                      <h3 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Regras desta versao</h3>
                      <p>O sistema permite substituir um plantao existente ou criar um novo plantao avulso.</p>
                      <p>O alerta de ferias/impedimento nao bloqueia automaticamente o salvamento.</p>
                      <p>O PDF e o balanco usam a escala consolidada com os overrides locais mais recentes.</p>
                    </div>
                  </div>
                </div>
              )}

              {canEdit && adminSection === "servers" && (
                <AdminServersPanel
                  servidores={servidores}
                  loadingServers={false}
                  serverForm={serverForm}
                  setServerForm={setServerForm}
                  serverMessage={serverMessage}
                  saveServer={saveServer}
                  savingServer={false}
                  resetServerForm={resetServerForm}
                  deleteServer={deleteServer}
                />
              )}

              {canEdit && adminSection === "draw" && (
                <AdminDrawPanel
                  pendingShifts={plantoesPendentes}
                  selectedPendingShift={selectedPendingShift}
                  selectedDrawDate={selectedDrawDate}
                  selectPendingShift={selectPendingShift}
                  eligibleServers={eligibleServers}
                  toggleEligibleServer={toggleEligibleServer}
                  defaultEligibleServers={resetDefaultEligibleServers}
                  drawMessage={drawMessage}
                  runDraw={runDraw}
                  drawing={drawing}
                />
              )}
                </>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
