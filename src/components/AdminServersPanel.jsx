import { PencilLine, PlusCircle, Save, ShieldCheck, Trash2, Users } from "lucide-react";
import { normalizeServerName } from "../lib/servers";

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
  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
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
              <div key={servidor.id || servidor.nome} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-bold text-slate-800">{servidor.nome}</p>
                    <span className={`text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-1 ${servidor.active ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                      {servidor.active ? "Ativo" : "Inativo"}
                    </span>
                    {servidor.janOnly && <span className="text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-1 bg-amber-50 text-amber-700">Jan only</span>}
                    {!isPersistent && <span className="text-[10px] font-black uppercase tracking-widest rounded-full px-2 py-1 bg-indigo-50 text-indigo-700">Base</span>}
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {servidor.ferias.length} férias, {servidor.impedimentos.length} impedimento(s), {servidor.indisponibilidadesPlantao.length} indisponibilidade(s)
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setServerForm({
                      id: servidor.id || null,
                      nome: servidor.nome,
                      janOnly: servidor.janOnly,
                      active: servidor.active !== false,
                      feriasText: servidor.ferias.map(([inicio, fim]) => `${inicio} a ${fim}`).join("\n"),
                      impedimentosText: servidor.impedimentos.map(([inicio, fim]) => `${inicio} a ${fim}`).join("\n"),
                      indisponibilidadesPlantaoText: servidor.indisponibilidadesPlantao.map(([inicio, fim]) => `${inicio} a ${fim}`).join("\n"),
                    })}
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
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          {serverForm.id ? <PencilLine size={18} className="text-indigo-500" /> : <PlusCircle size={18} className="text-emerald-500" />}
          <h3 className="text-lg font-black text-slate-800">{serverForm.id ? "Editar servidor" : "Novo servidor"}</h3>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-600">
            Nome do servidor
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500 uppercase"
              value={serverForm.nome}
              onChange={(event) => setServerForm((current) => ({ ...current, nome: normalizeServerName(event.target.value) }))}
              placeholder="Ex.: NOVO SERVIDOR"
              disabled={Boolean(serverForm.id)}
            />
          </label>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={serverForm.janOnly} onChange={(event) => setServerForm((current) => ({ ...current, janOnly: event.target.checked }))} />
              Restrito a Janeiro
            </label>
            <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
              <input type="checkbox" checked={serverForm.active} onChange={(event) => setServerForm((current) => ({ ...current, active: event.target.checked }))} />
              Participa da escala
            </label>
          </div>
          <label className="text-sm font-semibold text-slate-600">
            Ferias
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              value={serverForm.feriasText}
              onChange={(event) => setServerForm((current) => ({ ...current, feriasText: event.target.value }))}
              placeholder="Uma linha por período: 2026-01-07 a 2026-01-09"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Impedimentos / recusas
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              value={serverForm.impedimentosText}
              onChange={(event) => setServerForm((current) => ({ ...current, impedimentosText: event.target.value }))}
              placeholder="Uma linha por período: 2026-02-16 a 2026-02-17"
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Indisponibilidades de plantão
            <textarea
              className="mt-2 min-h-[110px] w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              value={serverForm.indisponibilidadesPlantaoText}
              onChange={(event) => setServerForm((current) => ({ ...current, indisponibilidadesPlantaoText: event.target.value }))}
              placeholder="Uma linha por período: 2026-04-13 a 2026-08-14"
            />
          </label>
        </div>
        {serverMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{serverMessage}</div>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={saveServer} disabled={savingServer} className="flex-1 rounded-2xl bg-indigo-600 px-4 py-3 text-sm font-bold text-white hover:bg-indigo-700 disabled:opacity-60 flex items-center justify-center gap-2">
            <Save size={16} /> {savingServer ? "Salvando..." : serverForm.id ? "Salvar servidor" : "Criar servidor"}
          </button>
          <button onClick={resetServerForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Limpar formulario
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[13px] space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Cadastro de servidores</h3>
        <p>Os servidores cadastrados aqui alimentam o combo de <code>Servidor</code> na edição do plantão e a seleção automática da escala.</p>
        <p>O nome fica em caixa alta e serve como chave da escala, então o registro é salvo/reaproveitado pelo mesmo nome.</p>
        <p>Para períodos, use uma linha por intervalo no formato <code>AAAA-MM-DD a AAAA-MM-DD</code>.</p>
      </div>
    </div>
  </div>
);

export default AdminServersPanel;
