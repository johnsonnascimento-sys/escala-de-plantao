import { CalendarClock, PencilLine, Save, Trash2, X } from "lucide-react";
import { REGIME_BANCO_HORAS, REGIME_PONTOS } from "../lib/compensation.js";

const AdminCompensationRulesPanel = ({
  rules,
  form,
  setForm,
  message,
  saveRule,
  editRule,
  deleteRule,
  resetForm,
}) => (
  <div className="grid gap-6 xl:grid-cols-[1fr_0.9fr]">
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3">
        <CalendarClock size={20} className="text-indigo-500" />
        <div>
          <h3 className="text-lg font-black text-slate-800">Regimes cadastrados</h3>
          <p className="text-xs text-slate-500">A regra define o padrao do periodo; cada plantao pode escolher outra modalidade.</p>
        </div>
      </div>
      <div className="space-y-3">
        {rules.map((rule) => (
          <div key={rule.id} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-bold text-slate-800">{rule.label}</p>
              <p className="mt-1 text-xs text-slate-500">{rule.start_date.split("-").reverse().join("/")} a {rule.end_date.split("-").reverse().join("/")}</p>
              <span className={`mt-2 inline-block rounded-full px-2.5 py-1 text-[10px] font-black uppercase tracking-wide ${rule.regime === REGIME_BANCO_HORAS ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-700"}`}>
                {rule.regime === REGIME_BANCO_HORAS ? "Banco de horas" : "Pontos e remuneracao"}
              </span>
            </div>
            <div className="flex gap-2">
              <button onClick={() => editRule(rule)} className="rounded-xl border border-slate-200 p-2.5 text-slate-600 hover:bg-slate-50" title="Editar regra"><PencilLine size={16} /></button>
              <button onClick={() => deleteRule(rule)} className="rounded-xl border border-rose-200 p-2.5 text-rose-600 hover:bg-rose-50" title="Excluir regra"><Trash2 size={16} /></button>
            </div>
          </div>
        ))}
        {rules.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhum regime especial cadastrado.</div>}
      </div>
    </div>

    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-lg font-black text-slate-800">{form.id ? "Editar regime" : "Novo regime"}</h3>
      <div className="mt-5 space-y-4">
        <label className="block text-sm font-semibold text-slate-600">
          Nome
          <input value={form.label} onChange={(event) => setForm((current) => ({ ...current, label: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" placeholder="Ex.: Banco de horas - agosto" />
        </label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">
            Data inicial
            <input type="date" value={form.start_date} onChange={(event) => setForm((current) => ({ ...current, start_date: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Data final
            <input type="date" value={form.end_date} onChange={(event) => setForm((current) => ({ ...current, end_date: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" />
          </label>
        </div>
        <label className="block text-sm font-semibold text-slate-600">
          Regime
          <select value={form.regime} onChange={(event) => setForm((current) => ({ ...current, regime: event.target.value }))} className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500">
            <option value={REGIME_BANCO_HORAS}>Banco de horas</option>
            <option value={REGIME_PONTOS}>Pontos e remuneracao</option>
          </select>
        </label>
        {message && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{message}</div>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={saveRule} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700"><Save size={16} /> Salvar regime</button>
          <button onClick={resetForm} className="flex items-center justify-center gap-2 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50"><X size={16} /> Limpar</button>
        </div>
      </div>
    </div>
  </div>
);

export default AdminCompensationRulesPanel;
