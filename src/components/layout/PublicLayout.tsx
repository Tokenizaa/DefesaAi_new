import React from 'react';
import { PrivateAccessibilityBar } from '../ui/PrivateAccessibilityBar';
import { PrivateHeader } from '../ui/PrivateHeader';
import { PrivateFooter } from '../ui/PrivateFooter';
import { PrivateCookieBanner } from '../ui/PrivateCookieBanner';

interface PublicLayoutProps {
  children: React.ReactNode;
}

export const PublicLayout: React.FC<PublicLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F8F8F8] flex flex-col font-sans text-[#1B1B1B]">
      {/* 1. Barra Superior de Acessibilidade DefesAi (eMAG / Alt + 1-4) */}
      <PrivateAccessibilityBar />

      {/* 2. Cabeçalho Oficial DefesAi */}
      <PrivateHeader />

      {/* 3. Conteúdo Principal Acessível */}
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>

      {/* 4. Rodapé Padrão DefesAi */}
      <PrivateFooter />

      {/* 5. Banner de Cookies e Privacidade LGPD */}
      <PrivateCookieBanner />
    </div>
  );
};
