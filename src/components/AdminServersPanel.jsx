import { PencilLine, PlusCircle, Plus, Save, ShieldCheck, Trash2, Users, X } from "lucide-react";
import { createDateRangeDraft, serverToFormState } from "../lib/servers";

const createEmptyRangeRow = () => createDateRangeDraft();

const getRangeLabel = (title, index) => `${title} ${index + 1}`;

const ensureAtLeastOneRow = (rows) => (rows.length > 0 ? rows : [createEmptyRangeRow()]);

const DateRangeEditor = ({ title, description, rows, onChange, placeholderStart, placeholderEnd }) => {
  const safeRows = ensureAtLeastOneRow(rows);

  const updateRow = (rowId, field, value) => {
    onChange(safeRows.map((row) => (row.id === rowId ? { ...row, [field]: value } : row)));
  };

  const addRow = () => {
    onChange([...safeRows, createEmptyRangeRow()]);
  };

  const removeRow = (rowId) => {
    const nextRows = safeRows.filter((row) => row.id !== rowId);
    onChange(ensureAtLeastOneRow(nextRows));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-800">{title}</h4>
          <p className="mt-1 text-xs text-slate-500">{description}</p>
        </div>
        <button
          type="button"
          onClick={addRow}
          className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
        >
          <Plus size={14} /> Adicionar periodo
        </button>
      </div>

      <div className="space-y-3">
        {safeRows.map((row, index) => {
          const hasStart = Boolean((row.start || "").trim());
          const hasEnd = Boolean((row.end || "").trim());
          const isInvalid = !hasStart || !hasEnd;

          return (
            <div
              key={row.id}
              className={`space-y-3 rounded-2xl border p-4 ${isInvalid ? "border-rose-200 bg-rose-50/40" : "border-slate-200 bg-white"}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{getRangeLabel(title, index)}</span>
                <button
                  type="button"
                  onClick={() => removeRow(row.id)}
                  className="flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  <X size={13} /> Excluir
                </button>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="text-xs font-semibold text-slate-600">
                  Inicio
                  <input
                    type="date"
                    value={row.start}
                    onChange={(event) => updateRow(row.id, "start", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                    placeholder={placeholderStart}
                  />
                </label>
                <label className="text-xs font-semibold text-slate-600">
                  Fim
                  <input
                    type="date"
                    value={row.end}
                    onChange={(event) => updateRow(row.id, "end", event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2 outline-none focus:border-indigo-500"
                    placeholder={placeholderEnd}
                  />
                </label>
              </div>
              {isInvalid && <p className="text-[11px] font-medium text-rose-700">Preencha inicio e fim para este periodo.</p>}
            </div>
          );
        })}
      </div>
    </div>
  );
};

const AdminServersPanel = ({
  serverForm,
  setServerForm,
  serverMessage,
  saveServer,
  savingServer,
  resetServerForm,
  deleteServer,
  servidores,
  loadingServers,
}) => (
  <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.1fr_0.9fr]">
    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-slate-900" />
            <h3 className="text-lg font-black text-slate-800">Servidores cadastrados</h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{loadingServers ? "Carregando" : `${servidores.length} servidor(es)`}</span>
        </div>
        <div className="space-y-3">
          {servidores.map((servidor) => {
            const isPersistent = Boolean(servidor.id);
            return (
              <div key={servidor.id || servidor.nome} className="flex flex-col gap-3 rounded-2xl border border-slate-200 p-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{servidor.nome}</p>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${servidor.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {servidor.active ? "Ativo" : "Inativo"}
                    </span>
                    <span className={`rounded-full px-2 py-1 text-[10px] font-black uppercase tracking-widest ${servidor.active ? "bg-indigo-50 text-indigo-700" : "bg-slate-100 text-slate-500"}`}>
                      {servidor.active ? "Participa da escala" : "Nao participa"}
                    </span>
                    {!isPersistent && <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-700">Base</span>}
                  </div>
                  <p className="text-xs text-slate-500">
                    Ferias: {servidor.ferias.length} | Impedimentos/recusas: {servidor.impedimentos.length} | Indisponibilidade de plantao: {servidor.indisponibilidadesPlantao.length}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setServerForm(serverToFormState(servidor))}
                    className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50"
                  >
                    Editar
                  </button>
                  {isPersistent && (
                    <button onClick={() => deleteServer(servidor)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                      <Trash2 size={14} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center gap-3">
          {serverForm.id ? <PencilLine size={18} className="text-indigo-500" /> : <PlusCircle size={18} className="text-emerald-500" />}
          <h3 className="text-lg font-black text-slate-800">{serverForm.id ? "Editar servidor" : "Novo servidor"}</h3>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-600">
            Nome do servidor
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 uppercase outline-none focus:border-indigo-500"
              value={serverForm.nome}
              onChange={(event) => setServerForm((current) => ({ ...current, nome: event.target.value }))}
              onBlur={(event) => setServerForm((current) => ({ ...current, nome: event.target.value.replace(/\s+/g, " ").trim() }))}
              placeholder="Ex.: NOVO SERVIDOR"
              disabled={Boolean(serverForm.id)}
            />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={serverForm.active} onChange={(event) => setServerForm((current) => ({ ...current, active: event.target.checked }))} />
            Participa da escala
          </label>

          <DateRangeEditor
            title="Ferias"
            description="Adicione varios periodos de ferias. Cada linha e um intervalo de inicio e fim."
            rows={serverForm.feriasRows}
            onChange={(rows) => setServerForm((current) => ({ ...current, feriasRows: rows }))}
            placeholderStart="2026-01-07"
            placeholderEnd="2026-01-09"
          />
          <DateRangeEditor
            title="Impedimentos / recusas"
            description="Use para periodos em que o servidor nao pode atuar por impedimento, recusa ou indisponibilidade temporaria."
            rows={serverForm.impedimentosRows}
            onChange={(rows) => setServerForm((current) => ({ ...current, impedimentosRows: rows }))}
            placeholderStart="2026-02-16"
            placeholderEnd="2026-02-17"
          />
          <DateRangeEditor
            title="Indisponibilidades de plantao"
            description="Use para afastamentos mais longos que tiram o servidor da escala de plantao."
            rows={serverForm.indisponibilidadesPlantaoRows}
            onChange={(rows) => setServerForm((current) => ({ ...current, indisponibilidadesPlantaoRows: rows }))}
            placeholderStart="2026-04-13"
            placeholderEnd="2026-08-14"
          />
        </div>
        {serverMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{serverMessage}</div>}
        <div className="flex flex-col gap-3 sm:flex-row">
          <button onClick={saveServer} disabled={savingServer} className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60">
            <Save size={16} /> {savingServer ? "Salvando..." : serverForm.id ? "Salvar servidor" : "Criar servidor"}
          </button>
          <button onClick={resetServerForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Limpar formulario
          </button>
        </div>
      </div>

      <div className="space-y-3 rounded-3xl bg-slate-900 p-5 text-[13px] text-slate-300">
        <h3 className="flex items-center gap-2 text-sm font-bold text-white">
          <Users size={16} className="text-emerald-400" /> Cadastro de servidores
        </h3>
        <p>Os servidores cadastrados aqui alimentam o combo de <code>Servidor</code> na edicao do plantao e a selecao automatica da escala.</p>
        <p>O nome e salvo com espacos normais e convertido para a forma padrao apenas no momento de salvar.</p>
        <p>Para periodos, use os botoes de adicionar e excluir e preencha um intervalo por linha no formato <code>AAAA-MM-DD</code>.</p>
      </div>
    </div>
  </div>
);

export default AdminServersPanel;
