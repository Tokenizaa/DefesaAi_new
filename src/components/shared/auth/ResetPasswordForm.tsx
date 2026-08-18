import React from 'react';
import { AuthForm } from './AuthForm';
import { useRouter } from '../../../core/router/RouterContext';
import { useAuth } from '../../../core/auth/AuthContext';

interface ResetPasswordFormProps {
  token: string; // Reset token from URL
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ token, onSuccess }) => {
  const { navigate } = useRouter();
  // Note: In a real implementation, we would have a resetPasswordWithToken function
  // For now, we'll simulate it or adapt based on actual Supabase implementation
  const { isLoading } = useAuth();

  const handleResetPassword = async (formData: Record<string, any>) => {
    // This would typically call a Supabase function to reset password with token
    // For now, we'll simulate success
    // const result = await resetPasswordWithToken(token, formData.password);
    // if (result.success) {
    //   onSuccess?.();
    // } else {
    //   throw new Error(result.error || 'Erro ao redefinir senha.');
    // }
    
    // Simulate success for now
    onSuccess?.();
  };

  return (
    <AuthForm
      onSubmit={handleResetPassword}
      loading={isLoading}
      title="Redefinir Senha"
      subtitle="Crie uma nova senha para acessar sua conta."
    >
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Nova Senha
          </label>
          <div className="relative">
            <input
              type="password"
              id="reset-password"
              placeholder="••••••••"
              required
              minLength={6}
              className={`
                w-full pl-3 pr-3 py-2 text-sm font-normal
                bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                transition-all text-slate-900
              `}
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Confirmar Nova Senha
          </label>
          <div className="relative">
            <input
              type="password"
              id="reset-confirm-password"
              placeholder="••••••••"
              required
              minLength={6}
              className={`
                w-full pl-3 pr-3 py-2 text-sm font-normal
                bg-[#F8F8F8] border border-[#CCCCCC] rounded-lg
                focus:ring-2 focus:ring-[#155BCB] focus:bg-white
                transition-all text-slate-900
              `}
            />
          </div>
        </div>
      </div>
    </AuthForm>
  );
};
