import { Shield, User } from "lucide-react";

const PlantaoCard = ({ plantao, servidorSelecionado = "Todos", onEdit }) => (
  <div className="bg-white rounded-2xl p-5 border border-slate-200 flex items-center gap-6 group hover:border-indigo-300 transition-colors">
    <div className="text-center md:border-r border-slate-100 md:pr-6 min-w-[78px]">
      <span className="block text-2xl font-black text-slate-800 leading-none">{plantao.data.split("-")[2]}</span>
      <span className="text-[10px] font-bold text-slate-400 uppercase">
        {servidorSelecionado !== "Todos" ? `${plantao.data.split("-")[1]}/${plantao.data.split("-")[0].slice(-2)}` : plantao.desc}
      </span>
    </div>
    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="bg-slate-50 p-2.5 rounded-xl flex items-center gap-3">
        <Shield size={16} className="text-indigo-400" />
        <div>
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Juiz(a)</span>
          <span className="font-semibold text-slate-700 text-xs">{plantao.juiz}</span>
        </div>
      </div>
      <div className="p-2.5 rounded-xl flex items-center gap-3 border bg-emerald-50 border-emerald-100">
        <User size={16} className="text-emerald-500" />
        <div className="flex-1">
          <span className="text-[9px] text-slate-400 font-bold uppercase block">Servidor(a)</span>
          <span className="font-semibold text-xs text-emerald-800">{plantao.servidor}</span>
          {plantao.notes && <p className="text-[10px] text-emerald-700 mt-1">{plantao.notes}</p>}
        </div>
        <div className="text-right">
          <span className="block text-xs font-bold text-slate-500">{plantao.pontos} pts</span>
          {plantao.origem !== "base" && (
            <span className="text-[10px] uppercase font-bold text-indigo-600">{plantao.origem === "manual" ? "Novo" : "Editado"}</span>
          )}
        </div>
      </div>
    </div>
    {onEdit && (
      <button onClick={() => onEdit(plantao)} className="self-start rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
        Editar
      </button>
    )}
  </div>
);

export default PlantaoCard;
