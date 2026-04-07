import { useEffect, useMemo, useState } from "react";
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
  LogOut,
  Palmtree,
  PencilLine,
  PlusCircle,
  Save,
  UserCog,
  Users,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import AdminLogin from "./components/AdminLogin";
import AdminUsersPanel from "./components/AdminUsersPanel";
import PlantaoCard from "./components/PlantaoCard";
import { NOMES_MESES, SERVIDOR_A_DEFINIR, feriadosPortaria, plantoesBase, servidores } from "./data/scheduleData";
import {
  applyOverrides,
  buildBaseSchedule,
  formatDateBr,
  getDisponibilidadeMensagem,
  isPlantaoPendente,
  getStatsGlobais,
  validateOverride,
} from "./lib/schedule";
import { hasSupabaseConfig, supabase } from "./lib/supabase";

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

const createUserForm = () => ({
  id: null,
  email: "",
  display_name: "",
  password: "",
  active: true,
});

const TabEscala = ({ servidorSelecionado, setServidorSelecionado, mesAtivo, setMesAtivo, plantoesFiltrados, statsGlobais }) => (
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
          <p>Claudia apenas Janeiro.</p>
          <p>Equidade: Sabado = 3, Domingo/Feriado = 4.</p>
          <p>Andre Luis fica fora do plantao entre 13/04 e 14/08/2026; nesses casos a escala fica a definir por sorteio.</p>
          <p>Overrides manuais substituem a escala base quando cadastrados.</p>
        </div>
      </div>
    </div>
  </div>
);

const TabFerias = () => (
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
  const [activeTab, setActiveTab] = useState("escala");
  const [mesAtivo, setMesAtivo] = useState(new Date().getMonth());
  const [servidorSelecionado, setServidorSelecionado] = useState("Todos");
  const [session, setSession] = useState(null);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState("");
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [overrides, setOverrides] = useState([]);
  const [loadingOverrides, setLoadingOverrides] = useState(false);
  const [savingOverride, setSavingOverride] = useState(false);
  const [formState, setFormState] = useState(createEmptyForm());
  const [formMessage, setFormMessage] = useState("");
  const [adminFilterMonth, setAdminFilterMonth] = useState(new Date().getMonth());
  const [adminDateFilter, setAdminDateFilter] = useState("");
  const [adminSection, setAdminSection] = useState("schedule");
  const [adminUsers, setAdminUsers] = useState([]);
  const [loadingAdminUsers, setLoadingAdminUsers] = useState(false);
  const [savingAdminUser, setSavingAdminUser] = useState(false);
  const [userForm, setUserForm] = useState(createUserForm());
  const [userMessage, setUserMessage] = useState("");

  useEffect(() => {
    if (!hasSupabaseConfig) return undefined;
    supabase.auth.getSession().then(({ data }) => setSession(data.session ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!hasSupabaseConfig) return;
    const loadOverrides = async () => {
      setLoadingOverrides(true);
      const { data, error } = await supabase.from("shift_overrides").select("*").order("date", { ascending: true }).order("updated_at", { ascending: true });
      setLoadingOverrides(false);
      if (error) {
        setAuthMessage(`Nao foi possivel carregar overrides: ${error.message}`);
        return;
      }
      setOverrides(data || []);
    };
    loadOverrides();
  }, [session]);

  useEffect(() => {
    if (!hasSupabaseConfig || !session) return;
    const loadAdminUsers = async () => {
      setLoadingAdminUsers(true);
      const { data, error } = await supabase.from("admin_users").select("*").order("display_name", { ascending: true });
      setLoadingAdminUsers(false);
      if (error) {
        setUserMessage(error.message);
        return;
      }
      setAdminUsers(data || []);
    };
    loadAdminUsers();
  }, [session]);

  const escalaBase = useMemo(() => buildBaseSchedule(plantoesBase, servidores), []);
  const escalaTotal = useMemo(() => applyOverrides(escalaBase, overrides), [escalaBase, overrides]);
  const statsGlobais = useMemo(() => getStatsGlobais(escalaTotal), [escalaTotal]);
  const warningMessage = useMemo(() => getDisponibilidadeMensagem(servidores, formState.server_name, formState.date), [formState.server_name, formState.date]);

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

  const saveOverride = async () => {
    if (!session) return setFormMessage("Faca login para salvar overrides.");
    const validationError = validateOverride(formState, escalaBase);
    if (validationError) return setFormMessage(validationError);
    setSavingOverride(true);
    setFormMessage("");
    const payload = {
      date: formState.date,
      mode: formState.mode,
      judge_name: formState.judge_name.trim(),
      server_name: formState.server_name,
      desc: formState.desc.trim(),
      tipo: formState.tipo,
      notes: formState.notes.trim(),
      created_by: session.user.id,
    };
    const query = formState.id
      ? supabase.from("shift_overrides").update(payload).eq("id", formState.id).select().single()
      : supabase.from("shift_overrides").insert(payload).select().single();
    const { data, error } = await query;
    setSavingOverride(false);
    if (error) return setFormMessage(error.message);
    setOverrides((current) => [...current.filter((item) => item.id !== data.id), data].sort((a, b) => a.date.localeCompare(b.date)));
    setFormState(createEmptyForm());
    setFormMessage("Override salvo com sucesso.");
  };

  const saveAdminUser = async () => {
    if (!session) return setUserMessage("Faca login para administrar usuarios.");
    if (!userForm.email || !userForm.display_name) return setUserMessage("Preencha e-mail e nome.");
    if (!userForm.id && !userForm.password) return setUserMessage("Defina uma senha para o novo usuario.");

    setSavingAdminUser(true);
    setUserMessage("");

    if (userForm.id) {
      const { data, error } = await supabase.rpc("admin_update_user", {
        p_user_id: userForm.id,
        p_email: userForm.email.trim().toLowerCase(),
        p_display_name: userForm.display_name.trim(),
        p_active: userForm.active,
      });
      if (error) {
        setSavingAdminUser(false);
        return setUserMessage(error.message);
      }

      if (userForm.password) {
        const { error: passwordError } = await supabase.rpc("admin_update_password", {
          p_user_id: userForm.id,
          p_password: userForm.password,
        });
        if (passwordError) {
          setSavingAdminUser(false);
          return setUserMessage(passwordError.message);
        }
      }

      setAdminUsers((current) => current.map((item) => (item.id === data.id ? data : item)).sort((a, b) => a.display_name.localeCompare(b.display_name)));
      setSavingAdminUser(false);
      setUserForm(createUserForm());
      setUserMessage("Usuario atualizado com sucesso.");
      return;
    }

    const { data, error } = await supabase.rpc("admin_create_user", {
      p_email: userForm.email.trim().toLowerCase(),
      p_password: userForm.password,
      p_display_name: userForm.display_name.trim(),
    });
    setSavingAdminUser(false);
    if (error) return setUserMessage(error.message);

    setAdminUsers((current) => [...current, data].sort((a, b) => a.display_name.localeCompare(b.display_name)));
    setUserForm(createUserForm());
    setUserMessage("Usuario criado com sucesso.");
  };

  const deleteAdminUser = async (userId) => {
    const { error } = await supabase.rpc("admin_delete_user", { p_user_id: userId });
    if (error) return setUserMessage(error.message);
    setAdminUsers((current) => current.filter((item) => item.id !== userId));
    if (userForm.id === userId) setUserForm(createUserForm());
    setUserMessage("Usuario excluido com sucesso.");
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    if (!hasSupabaseConfig) return;
    setAuthBusy(true);
    setAuthMessage("");
    const { error } = await supabase.auth.signInWithPassword(loginForm);
    setAuthBusy(false);
    if (error) return setAuthMessage(error.message);
    setAuthMessage("Login realizado com sucesso.");
    setActiveTab("admin");
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
              <p className="text-slate-500 font-medium">Gestao integrada de plantoes, ferias, usuarios e overrides manuais</p>
              <p className="text-slate-400 text-xs font-medium mt-1">{loadingOverrides ? "Carregando overrides..." : `Escala consolidada com ${overrides.length} override(s)`}</p>
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
          {session && <button onClick={() => setActiveTab("admin")} className={`flex-1 md:flex-none px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${activeTab === "admin" ? "bg-slate-900 text-white shadow-sm" : "text-slate-500 hover:bg-slate-50"}`}><PencilLine size={16} /> Painel admin</button>}
        </div>

        <div className="space-y-6">
          {!session && activeTab === "escala" && (
            <AdminLogin
              email={loginForm.email}
              password={loginForm.password}
              onChange={(field, value) => setLoginForm((current) => ({ ...current, [field]: value }))}
              onSubmit={handleLogin}
              authBusy={authBusy}
              authMessage={authMessage}
              hasConfig={hasSupabaseConfig}
            />
          )}
          {activeTab === "escala" && <TabEscala servidorSelecionado={servidorSelecionado} setServidorSelecionado={setServidorSelecionado} mesAtivo={mesAtivo} setMesAtivo={setMesAtivo} plantoesFiltrados={plantoesFiltrados} statsGlobais={statsGlobais} />}
          {activeTab === "ferias" && <TabFerias />}
          {activeTab === "feriados" && <TabFeriados />}
          {activeTab === "admin" && session && (
            <>
            <div className={`${adminSection === "schedule" ? "grid grid-cols-1 xl:grid-cols-[1.15fr_0.85fr] gap-6" : "hidden"}`}>
              <div className="space-y-6">
                <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.2em] text-indigo-600">Painel administrativo</p>
                    <h2 className="text-2xl font-black text-slate-800">{adminSection === "schedule" ? "Edicao da escala" : "CRUD de usuarios e senha"}</h2>
                    <p className="text-sm text-slate-500">Usuario autenticado: {session.user.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => setAdminSection("schedule")} className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${adminSection === "schedule" ? "bg-indigo-600 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <Calendar size={16} /> Escala
                    </button>
                    <button onClick={() => setAdminSection("users")} className={`rounded-2xl px-4 py-3 text-sm font-bold flex items-center gap-2 ${adminSection === "users" ? "bg-slate-900 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                      <UserCog size={16} /> Usuarios
                    </button>
                    <button onClick={() => supabase.auth.signOut().then(() => { setFormState(createEmptyForm()); setUserForm(createUserForm()); setActiveTab("escala"); })} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 flex items-center gap-2">
                      <LogOut size={16} /> Sair
                    </button>
                  </div>
                </div>

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
                        {servidores.map((servidor) => <option key={servidor.nome} value={servidor.nome}>{servidor.nome}</option>)}
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
                    <button onClick={saveOverride} disabled={savingOverride} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
                      <Save size={16} /> {savingOverride ? "Salvando..." : "Salvar override"}
                    </button>
                    <button onClick={() => { setFormState(createEmptyForm()); setFormMessage(""); }} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
                      Limpar formulario
                    </button>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[13px] space-y-3">
                  <h3 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Regras desta versao</h3>
                  <p>• O sistema permite substituir um plantao existente ou criar um novo plantao avulso.</p>
                  <p>• O alerta de ferias/impedimento nao bloqueia automaticamente o salvamento.</p>
                  <p>• O PDF e o balanco usam a escala consolidada com os overrides mais recentes.</p>
                  {authMessage && <p className="text-slate-400">{authMessage}</p>}
                </div>
              </div>
            </div>
            {adminSection === "users" && (
              <AdminUsersPanel
                adminUsers={adminUsers}
                loadingAdminUsers={loadingAdminUsers}
                userForm={userForm}
                setUserForm={setUserForm}
                userMessage={userMessage}
                saveAdminUser={saveAdminUser}
                savingAdminUser={savingAdminUser}
                resetUserForm={() => { setUserForm(createUserForm()); setUserMessage(""); }}
                deleteAdminUser={deleteAdminUser}
              />
            )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default App;
