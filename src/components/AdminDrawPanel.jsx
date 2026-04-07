import { CheckCircle2, Users } from "lucide-react";
import PlantaoCard from "./PlantaoCard";

const AdminDrawPanel = ({
  pendingShifts,
  selectedPendingShift,
  selectedDrawDate,
  selectPendingShift,
  eligibleServers,
  toggleEligibleServer,
  defaultEligibleServers,
  drawMessage,
  runDraw,
  drawing,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_0.95fr] gap-6">
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Users size={18} className="text-amber-600" />
            <h3 className="text-lg font-black text-slate-800">Plantoes pendentes de sorteio</h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{pendingShifts.length} pendente(s)</span>
        </div>
        <div className="space-y-3">
          {pendingShifts.map((plantao) => (
            <div key={`draw-${plantao.data}`} className={`rounded-3xl ${selectedDrawDate === plantao.data ? "ring-2 ring-amber-400" : ""}`}>
              <PlantaoCard plantao={plantao} />
              <div className="px-5 pb-5">
                <button onClick={() => selectPendingShift(plantao)} className={`rounded-xl px-4 py-2 text-xs font-bold ${selectedDrawDate === plantao.data ? "bg-amber-500 text-white" : "border border-slate-200 text-slate-600 hover:bg-slate-50"}`}>
                  {selectedDrawDate === plantao.data ? "Plantao selecionado" : "Selecionar para sorteio"}
                </button>
              </div>
            </div>
          ))}
          {pendingShifts.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nao ha plantoes pendentes de sorteio.</div>}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 size={18} className="text-indigo-500" />
          <h3 className="text-lg font-black text-slate-800">Ferramenta de sorteio</h3>
        </div>
        {selectedPendingShift ? (
          <>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
              <p className="font-bold">{selectedPendingShift.desc} em {selectedPendingShift.data.split("-").reverse().join("/")}</p>
              <p className="mt-1">{selectedPendingShift.notes}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={defaultEligibleServers} className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                Restaurar elegiveis padrao
              </button>
            </div>
            <div className="space-y-3">
              {eligibleServers.map((item) => (
                <label key={item.nome} className="flex items-start gap-3 rounded-2xl border border-slate-200 px-4 py-3">
                  <input type="checkbox" checked={item.selected} onChange={() => toggleEligibleServer(item.nome)} className="mt-1" />
                  <div className="flex-1">
                    <p className="text-sm font-bold text-slate-800">{item.nome}</p>
                    <p className={`text-xs mt-1 ${item.warning ? "text-amber-700" : "text-slate-500"}`}>{item.warning || "Disponivel para o sorteio."}</p>
                  </div>
                </label>
              ))}
            </div>
            <button onClick={runDraw} disabled={drawing || eligibleServers.filter((item) => item.selected).length === 0} className="w-full rounded-2xl bg-amber-500 px-4 py-3 text-sm font-bold text-white hover:bg-amber-600 disabled:opacity-60">
              {drawing ? "Sorteando..." : "Realizar sorteio e gravar resultado"}
            </button>
          </>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
            Selecione um plantao pendente para definir os participantes do sorteio.
          </div>
        )}
        {drawMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{drawMessage}</div>}
      </div>
    </div>
  </div>
);

export default AdminDrawPanel;
