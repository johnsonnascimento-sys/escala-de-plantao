import { AlertCircle, Calendar, PencilLine, PlusCircle, Save } from "lucide-react";
import { NOMES_MESES, SERVIDOR_A_DEFINIR } from "../data/scheduleData";
import PlantaoCard from "./PlantaoCard";

const AdminSchedulePanel = ({
  adminFilterMonth,
  adminDateFilter,
  setAdminFilterMonth,
  setAdminDateFilter,
  adminItems,
  handleEditPlantao,
  formState,
  setFormState,
  warningMessage,
  formMessage,
  saveOverride,
  savingOverride,
  resetOverrideForm,
  servidores,
}) => (
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
          <button onClick={resetOverrideForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Limpar formulario
          </button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminSchedulePanel;
