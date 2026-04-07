import { PencilLine, PlusCircle, Save, ShieldCheck, Trash2, Users } from "lucide-react";

const AdminUsersPanel = ({
  adminUsers,
  loadingAdminUsers,
  userForm,
  setUserForm,
  userMessage,
  saveAdminUser,
  savingAdminUser,
  resetUserForm,
  deleteAdminUser,
}) => (
  <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <ShieldCheck size={18} className="text-slate-900" />
            <h3 className="text-lg font-black text-slate-800">Usuarios administradores</h3>
          </div>
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">{loadingAdminUsers ? "Carregando" : `${adminUsers.length} usuario(s)`}</span>
        </div>
        <div className="space-y-3">
          {adminUsers.map((adminUser) => (
            <div key={adminUser.id} className="rounded-2xl border border-slate-200 p-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="text-sm font-bold text-slate-800">{adminUser.display_name}</p>
                <p className="text-xs text-slate-500">{adminUser.email}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-2 ${adminUser.active ? "text-emerald-600" : "text-rose-600"}`}>{adminUser.active ? "Ativo" : "Inativo"}</p>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setUserForm({ id: adminUser.id, email: adminUser.email, display_name: adminUser.display_name || "", password: "", active: adminUser.active }); }} className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                  Editar
                </button>
                <button onClick={() => deleteAdminUser(adminUser.id)} className="rounded-xl border border-rose-200 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
          {!loadingAdminUsers && adminUsers.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">Nenhum usuario administrador encontrado.</div>}
        </div>
      </div>
    </div>

    <div className="space-y-6">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          {userForm.id ? <PencilLine size={18} className="text-indigo-500" /> : <PlusCircle size={18} className="text-emerald-500" />}
          <h3 className="text-lg font-black text-slate-800">{userForm.id ? "Editar usuario" : "Novo usuario admin"}</h3>
        </div>
        <div className="grid gap-4">
          <label className="text-sm font-semibold text-slate-600">
            Nome
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" value={userForm.display_name} onChange={(event) => setUserForm((current) => ({ ...current, display_name: event.target.value }))} />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            E-mail
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" type="email" value={userForm.email} onChange={(event) => setUserForm((current) => ({ ...current, email: event.target.value }))} />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            {userForm.id ? "Nova senha (opcional)" : "Senha inicial"}
            <input className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500" type="password" value={userForm.password} onChange={(event) => setUserForm((current) => ({ ...current, password: event.target.value }))} />
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
            <input type="checkbox" checked={userForm.active} onChange={(event) => setUserForm((current) => ({ ...current, active: event.target.checked }))} />
            Usuario ativo
          </label>
        </div>
        {userMessage && <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">{userMessage}</div>}
        <div className="flex flex-col sm:flex-row gap-3">
          <button onClick={saveAdminUser} disabled={savingAdminUser} className="flex-1 rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60 flex items-center justify-center gap-2">
            <Save size={16} /> {savingAdminUser ? "Salvando..." : userForm.id ? "Salvar usuario" : "Criar usuario"}
          </button>
          <button onClick={resetUserForm} className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50">
            Limpar formulario
          </button>
        </div>
      </div>

      <div className="bg-slate-900 rounded-3xl p-5 text-slate-300 text-[13px] space-y-3">
        <h3 className="font-bold text-white text-sm flex items-center gap-2"><Users size={16} className="text-emerald-400" /> Operacoes de usuarios</h3>
        <p>Cria usuario novo com senha inicial e permissao administrativa.</p>
        <p>Edita nome, e-mail, status e permite redefinir senha diretamente pelo painel.</p>
        <p>Exclusao remove o usuario do painel e do Auth. O proprio admin nao pode se excluir.</p>
      </div>
    </div>
  </div>
);

export default AdminUsersPanel;
