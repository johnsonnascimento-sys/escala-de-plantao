import { AlertCircle, CheckCircle2, Clock3, Database, RefreshCw } from "lucide-react";

const STATUS_STYLES = {
  ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
  fail: "bg-rose-50 text-rose-700 border-rose-200",
};

const SOURCE_LABELS = {
  manual: "Manual",
  scheduled: "Agendado",
  workflow: "Workflow",
};

const formatDateTimeBr = (value) => {
  if (!value) return "-";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return String(value);
  return parsed.toLocaleString("pt-BR");
};

const formatDuration = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return "-";
  return `${Number(value)} ms`;
};

const AdminDatabasePanel = ({
  healthcheckLogs,
  loadingHealthcheckLogs,
  healthcheckMessage,
  runningHealthcheck,
  runHealthcheck,
  refreshHealthcheckLogs,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <Database size={18} className="text-indigo-500" />
          <h3 className="text-lg font-black text-slate-800">Teste do banco</h3>
        </div>
        <p className="text-sm text-slate-500 leading-relaxed">
          Executa uma leitura da linha <code>current</code> em <code>public.escala_app_state</code> e grava o resultado no log de testes.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={runHealthcheck}
            disabled={runningHealthcheck}
            className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2"
          >
            <RefreshCw size={16} className={runningHealthcheck ? "animate-spin" : ""} />
            {runningHealthcheck ? "Executando..." : "Testar banco"}
          </button>
          <button
            onClick={refreshHealthcheckLogs}
            disabled={loadingHealthcheckLogs}
            className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 disabled:opacity-60"
          >
            Atualizar
          </button>
        </div>
        {healthcheckMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{healthcheckMessage}</div>}
        <div className="rounded-2xl border border-indigo-100 bg-indigo-50 p-4 text-xs text-indigo-900 flex gap-3">
          <AlertCircle size={16} className="shrink-0 mt-0.5 text-indigo-600" />
          <span>Os registros abaixo mostram apenas os 10 testes mais recentes.</span>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[13px] space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <CheckCircle2 size={16} className="text-emerald-400" /> O que e validado
        </h3>
        <p>Leitura da tabela `escala_app_state` com a linha `current`.</p>
        <p>Gravacao do log em `escala_db_healthchecks` quando o admin dispara o teste manual.</p>
        <p>Quando o workflow semanal estiver com a mesma chave de serviço, ele tambem pode alimentar este log.</p>
      </div>
    </div>

    <div className="space-y-4">
      <div className="flex items-center justify-between px-1">
        <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
          <Clock3 size={16} /> Ultimos 10 testes
        </h3>
        <span className="text-xs font-bold text-slate-500">{loadingHealthcheckLogs ? "Carregando..." : `${healthcheckLogs.length} registro(s)`}</span>
      </div>

      <div className="space-y-3">
        {healthcheckLogs.map((log) => (
          <div key={log.id} className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex flex-wrap items-center gap-2 justify-between">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${STATUS_STYLES[log.status] || STATUS_STYLES.ok}`}>
                  {log.status === "fail" ? "Falha" : "OK"}
                </span>
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-slate-600">
                  {SOURCE_LABELS[log.test_source] || log.test_source}
                </span>
              </div>
              <span className="text-[11px] font-semibold text-slate-400">{formatDateTimeBr(log.tested_at)}</span>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">{log.message || "Teste executado sem mensagem."}</p>
              {log.details && <p className="mt-2 text-xs leading-relaxed text-slate-500 whitespace-pre-wrap">{log.details}</p>}
            </div>

            <div className="grid grid-cols-2 gap-3 text-[11px] text-slate-500">
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                <span className="block font-black uppercase tracking-widest text-slate-400">Duracao</span>
                <span className="font-semibold text-slate-700">{formatDuration(log.duration_ms)}</span>
              </div>
              <div className="rounded-2xl bg-slate-50 border border-slate-100 px-3 py-2">
                <span className="block font-black uppercase tracking-widest text-slate-400">Executado por</span>
                <span className="font-semibold text-slate-700">{log.tested_by_email || "Sistema"}</span>
              </div>
            </div>
          </div>
        ))}

        {!loadingHealthcheckLogs && healthcheckLogs.length === 0 && (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">
            Nenhum teste de banco registrado ainda.
          </div>
        )}
      </div>
    </div>
  </div>
);

export default AdminDatabasePanel;
