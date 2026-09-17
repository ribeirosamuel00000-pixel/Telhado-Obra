import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, HardHat, Lock, AlertCircle, ArrowRight, UserCheck, Key } from 'lucide-react';

interface LoginPageProps {
  onBackToPublic?: () => void;
}

export const LoginPage: React.FC<LoginPageProps> = ({ onBackToPublic }) => {
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState('souzas@sanygroup.com');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    try {
      await login(email, password);
      // Immediately wipe password from state - do not save or persist
      setPassword('');
    } catch (err: any) {
      setError(err.message || 'Falha ao autenticar. Verifique suas credenciais de desenvolvedor.');
      setPassword('');
    }
  };

  const handleQuickLogin = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPassword(userPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Brand Header */}
        <div className="flex flex-col items-center">
          <div className="h-14 px-4 py-2 bg-white rounded-2xl shadow-md border border-slate-200/80 flex items-center justify-center gap-3">
            <span className="font-extrabold text-2xl tracking-tighter text-[#d71920]">SANY</span>
            <span className="w-1 h-6 bg-slate-300 rounded-full" />
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-widest">
              Engenharia Turnkey
            </span>
          </div>
          <h2 className="mt-5 text-center text-2xl font-bold tracking-tight text-[#191c20]">
            Portal de Gestão de Obras & IA
          </h2>
          <p className="mt-1 text-center text-xs font-medium text-slate-500">
            Contrato Turnkey Savoy Campinas • Autenticação Criptográfica JWT
          </p>
        </div>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <div className="mb-5 rounded-xl bg-red-50 border border-red-200 p-3.5 flex items-start gap-3 text-red-700">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <div className="text-xs font-medium leading-relaxed">{error}</div>
            </div>
          )}

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                E-mail ou Usuário Corporativo
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <input
                  id="email"
                  name="email"
                  type="text"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="usuario@sany.eng.br"
                  className="block w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/20 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wider text-slate-700">
                Senha de Acesso
              </label>
              <div className="mt-1 relative rounded-xl shadow-sm">
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full rounded-xl border border-slate-300 py-2.5 px-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-[#d71920] focus:ring-2 focus:ring-[#d71920]/20 transition-colors"
                />
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  defaultChecked
                  className="h-4 w-4 rounded border-slate-300 text-[#d71920] focus:ring-[#d71920]"
                />
                <label htmlFor="remember-me" className="ml-2 block text-slate-600">
                  Lembrar token seguro
                </label>
              </div>
              <span className="font-mono text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                JWT RSA-256
              </span>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 border border-transparent rounded-xl shadow-md text-sm font-semibold text-white bg-[#d71920] hover:bg-[#b9141b] active:scale-[0.98] transition-all disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Validando Token JWT...</span>
                </>
              ) : (
                <>
                  <span>Entrar no Dashboard do Desenvolvedor</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>

            {onBackToPublic && (
              <button
                type="button"
                onClick={onBackToPublic}
                className="w-full text-center py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
              >
                ← Voltar para o Controle Público de Telhas
              </button>
            )}
          </form>

          {/* Quick Demo Profile Selector */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
              Acesso do Desenvolvedor (Credencial de Gestão):
            </p>
            <div className="space-y-2">
              <button
                type="button"
                onClick={() => handleQuickLogin('souzas@sanygroup.com', '72npR#Sn')}
                className={`w-full text-left p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                  email === 'souzas@sanygroup.com'
                    ? 'border-[#d71920] bg-red-50/50 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-[#d71920] text-white flex items-center justify-center font-bold text-[11px] shrink-0">
                    SR
                  </div>
                  <div className="truncate">
                    <p className="font-semibold text-slate-900 truncate">Samuel Ribeiro de Souza</p>
                    <p className="text-[10px] text-slate-500 font-mono">souzas@sanygroup.com • Desenvolvedor</p>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-[#d71920] bg-red-100/80 px-2 py-0.5 rounded-full shrink-0">
                  Desenvolvedor
                </span>
              </button>
            </div>
          </div>
        </div>

        {/* Security badge footer */}
        <div className="mt-6 text-center flex items-center justify-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Conexão criptografada ponta-a-ponta com validação de assinatura JWT</span>
        </div>
      </div>
    </div>
  );
};
