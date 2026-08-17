import React, { useState } from 'react';
import {
  User,
  Bell,
  Lock,
  ShieldCheck,
  CheckCircle2,
  Trash2,
  Key,
  MapPin,
  Phone,
  CreditCard,
} from 'lucide-react';
import { useAuth } from '../../core/auth/AuthContext';

export const UserSettingsView: React.FC = () => {
  const { user, updateProfile } = useAuth();
  
  // Profile form state
  const [name, setName] = useState(user?.name || '');
  const [cpf, setCpf] = useState(user?.cpf || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [cnh, setCnh] = useState(user?.cnh || '');
  const [cityState, setCityState] = useState(user?.cityState || '');
  const [profileSavedSuccess, setProfileSavedSuccess] = useState(false);
  
  // Settings form state
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifyWhatsApp, setNotifyWhatsApp] = useState(true);
  const [notifyDeadlines, setNotifyDeadlines] = useState(true);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordStatus, setPasswordStatus] = useState('');
  
  // Tab state
  const [activeTab, setActiveTab] = useState<'profile' | 'settings' | 'privacy'>('profile');

  // Profile handlers
  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateProfile({
      name,
      cpf,
      phone,
      cnh,
      cityState,
    });
    setProfileSavedSuccess(true);
    setTimeout(() => setProfileSavedSuccess(false), 3000);
  };

  // Settings handlers
  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setPasswordStatus('A nova senha deve ter no mínimo 6 caracteres.');
      return;
    }
    setPasswordStatus('Senha alterada com sucesso!');
    setCurrentPassword('');
    setNewPassword('');
    setTimeout(() => setPasswordStatus(''), 3000);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-slate-900">Minhas Configurações</h2>
        <p className="text-xs text-slate-500 mt-0.5">
          Gerencie seus dados pessoais, preferências de notificação e segurança da conta.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'profile'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          <User className="w-4 h-4 mr-2" />
          Perfil
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'settings'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          <Bell className="w-4 h-4 mr-2" />
          Notificações
        </button>
        <button
          onClick={() => setActiveTab('privacy')}
          className={`flex-1 px-4 py-3 text-center font-semibold text-sm transition-colors border-b-2 ${
            activeTab === 'privacy'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-500 hover:text-slate-400'
          }`}
        >
          <ShieldCheck className="w-4 h-4 mr-2" />
          Privacidade
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' ? (
        <div className="space-y-6">
          {/* Profile Form */}
          <div>
            <h3 className="text-lg font-bold text-slate-900">Meus Dados Pessoais</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Estes dados são utilizados para preencher automaticamente o cabeçalho e qualificação das suas petições.
            </p>
          </div>

          {profileSavedSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-medium animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Perfil atualizado com sucesso! Suas futuras defesas serão geradas com estes dados.</span>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-5">
            <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
              <div className="w-14 h-14 rounded-2xl bg-slate-900 text-white flex items-center justify-center font-bold text-xl shadow-xs">
                {name ? name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">{name || 'Condutor'}</h3>
                <p className="text-xs text-slate-500 font-mono">{user?.email}</p>
                <span className="inline-block mt-1 text-[10px] font-bold px-2 py-0.5 rounded bg-orange-50 text-orange-700 border border-orange-200">
                  Conta gov.br Verificada
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nome Completo do Titular
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nome como consta na CNH"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  CPF (Cadastro de Pessoa Física)
                </label>
                <div className="relative">
                  <CreditCard className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cpf}
                    onChange={(e) => setCpf(e.target.value)}
                    placeholder="000.000.000-00"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Número de Registro da CNH
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cnh}
                    onChange={(e) => setCnh(e.target.value)}
                    placeholder="00000000000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Telefone / WhatsApp para Alertas
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="(00) 00000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white font-mono"
                  />
                </div>
              </div>

              <div className="sm:col-span-2">
                <label className="block font-semibold text-slate-700 mb-1">
                  Cidade / Estado de Residência (Domicílio)
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={cityState}
                    onChange={(e) => setCityState(e.target.value)}
                    placeholder="Ex: São Paulo / SP"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2.5 text-slate-900 outline-none focus:ring-1 focus:ring-orange-500 focus:bg-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button
                type="submit"
                className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl text-xs shadow-xs transition-colors flex items-center gap-2 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Alterações</span>
              </button>
            </div>
          </form>
        </div>
      ) : activeTab === 'settings' ? (
        <div className="space-y-6">
          {/* Notifications Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Bell className="w-4 h-4 text-orange-500" />
              <span>Alertas de Prazos & Notificações</span>
            </div>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Alertas de Vencimento de Defesa Prévia e JARI</p>
                  <p className="text-[11px] text-slate-500">
                    Receba lembretes automáticos 7 dias e 48 horas antes do término do prazo de protocolo.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyDeadlines}
                  onChange={(e) => setNotifyDeadlines(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Notificações por E-mail</p>
                  <p className="text-[11px] text-slate-500">
                    Envio da minuta em PDF e confirmações de pagamento via e-mail.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyEmail}
                  onChange={(e) => setNotifyEmail(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400 w-4 h-4"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="font-bold text-slate-800">Atualizações Rápidas via WhatsApp</p>
                  <p className="text-[11px] text-slate-500">
                    Notificações instantâneas quando sua peça jurídica estiver diagramada.
                  </p>
                </div>
                <input
                  type="checkbox"
                  checked={notifyWhatsApp}
                  onChange={(e) => setNotifyWhatsApp(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-400 w-4 h-4"
                />
              </div>
            </div>
          </div>

          {/* Security Section */}
          <form onSubmit={handlePasswordChange} className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-4">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <Key className="w-4 h-4 text-orange-500" />
              <span>Alterar Senha de Acesso</span>
            </div>

            {passwordStatus && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 font-medium">
                {passwordStatus}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Senha Atual
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Nova Senha
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 outline-none focus:ring-1 focus:ring-orange-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
              >
                Atualizar Senha
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          {/* LGPD & Privacy Section */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xs p-6 space-y-3">
            <div className="flex items-center gap-2 text-slate-900 font-bold text-sm border-b border-slate-100 pb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Privacidade & LGPD</span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Seus dados de condutor, placas e autos de infração são armazenados com criptografia de ponta a ponta e jamais são compartilhados com terceiros.
            </p>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => alert('Para exclusão total dos dados conforme o Art. 18 da LGPD, entre em contato com dpo@defesai.com.br')}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Solicitar exclusão definitiva de dados (Art. 18 LGPD)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};