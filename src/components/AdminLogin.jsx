import { Lock } from "lucide-react";

const AdminLogin = ({ email, password, onChange, onSubmit, authBusy, authMessage, hasConfig }) => (
  <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">
    <div className="flex items-center gap-3 mb-5">
      <div className="w-12 h-12 rounded-2xl bg-slate-900 text-white flex items-center justify-center">
        <Lock size={18} />
      </div>
      <div>
        <h3 className="text-lg font-black text-slate-800">Acesso administrativo</h3>
        <p className="text-xs text-slate-500">Autentique-se para editar a escala e salvar overrides no Supabase.</p>
      </div>
    </div>

    {!hasConfig ? (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 space-y-2">
        <p className="font-bold">Configuracao do Supabase ausente.</p>
        <p>Preencha as variaveis do arquivo `.env` usando `.env.example`.</p>
        <p>Depois execute o SQL de `supabase/shift_overrides.sql` no projeto Supabase.</p>
      </div>
    ) : (
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <label className="text-sm font-semibold text-slate-600">
            E-mail
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              type="email"
              value={email}
              onChange={(event) => onChange("email", event.target.value)}
              placeholder="admin@dominio.com"
              required
            />
          </label>
          <label className="text-sm font-semibold text-slate-600">
            Senha
            <input
              className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 outline-none focus:border-indigo-500"
              type="password"
              value={password}
              onChange={(event) => onChange("password", event.target.value)}
              placeholder="Sua senha"
              required
            />
          </label>
        </div>
        <button
          type="submit"
          disabled={authBusy}
          className="w-full rounded-2xl bg-slate-900 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800 disabled:opacity-60"
        >
          {authBusy ? "Entrando..." : "Entrar como administrador"}
        </button>
        {authMessage && <p className="text-sm text-slate-500">{authMessage}</p>}
      </form>
    )}
  </div>
);

export default AdminLogin;
