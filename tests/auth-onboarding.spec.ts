import { test, expect } from '@playwright/test';

test.describe('Adeus Multa - Identidade, Cadastro e Autenticação', () => {
  test('should complete full onboarding and authentication flow', async ({ page }) => {
    // 1. Iniciar onboarding sem login (na landing page)
    await page.goto('/');
    await expect(page).toHaveURL('/');
    
    // Verificar se estamos na landing page
    await expect(page.getByText(/descubra se o seu auto de infração de trânsito possui/i)).toBeVisible();
    
    // Clicar no botão para iniciar análise gratuita (isso leva ao onboarding)
    await page.getByRole('button', { name: /analisar minha multa gratuitamente/i }).click();
    await page.waitForURL('/novo-caso');
    
    // 2. Informar nome (primeiro passo do onboarding)
    await page.getByPlaceholder(/digite seu nome/i).fill('João Silva');
    await expect(page.getByPlaceholder(/digite seu nome/i)).toHaveValue('João Silva');
    
    // 3. Informar WhatsApp
    await page.getByPlaceholder(/digite seu whatsapp/i).fill('11999999999');
    await expect(page.getByPlaceholder(/digite seu whatsapp/i)).toHaveValue('11999999999');
    
    // 4. Validar telefone
    await page.getByRole('button', { name: /continuar/i }).click();
    
    // 5. Normalizar telefone para E.164
    // Aguardar a normalização acontecer (se houver indicação visual)
    await page.waitForTimeout(1000); // Aguardar processamento
    
    // 6. Enviar documentos
    await page.getByLabel(/tipo de documento/i).selectOption('cnh');
    await page.setInputFiles('input[type="file"]', [
      {
        name: 'cnh-frente.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content'),
      },
      {
        name: 'cnh-verso.jpg',
        mimeType: 'image/jpeg',
        buffer: Buffer.from('fake image content'),
      }
    ]);
    
    // 7. Concluir análise gratuita
    await page.getByRole('button', { name: /solicitar análise gratuita/i }).click();
    await page.waitForURL(/.*\/resultado-gratuito/);
    
    // Verificar que a análise gratuita foi concluída
    await expect(page.getByText(/análise concluída/i)).toBeVisible();
    
    // 8. Abrir autenticação
    await page.getByRole('button', { name: /criar conta/i }).click();
    
    // 9. Criar conta
    await page.getByLabel(/email/i).fill('joao.silva@email.com');
    await page.getByLabel(/senha/i).fill('SenhaSegura123!');
    await page.getByRole('button', { name: /registrar/i }).click();
    
    // 10. Preservar dados do onboarding
    // Verificar que os dados do onboarding foram preservados
    await expect(page.getByText(/joão silva/i)).toBeVisible();
    await expect(page.locator('text=+55 11 99999-9999')).toBeVisible(); // Telefone formatado
    
    // 11. Executar claim
    await page.getByRole('button', { name: /reivindicar caso/i }).click();
    
    // 12. Continuar para checkout
    await page.getByRole('button', { name: /prosseguir para pagamento/i }).click();
    await page.waitForURL(/.*\/checkout/);
    
    // 13. Logout
    await page.getByLabel(/menu do usuário/i).click();
    await page.getByRole('menuitem', { name: /sair/i }).click();
    await page.waitForURL('/');
    
    // 14. Login novamente
    await page.getByLabel(/entrar/i).click();
    await page.getByLabel(/email/i).fill('joao.silva@email.com');
    await page.getByLabel(/senha/i).fill('SenhaSegura123!');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // 15. Recuperar documentos
    await expect(page.getByText(/seus documentos/i)).toBeVisible();
    await expect(page.getByText(/cnh-frente.jpg/i)).toBeVisible();
    
    // 16. Acessar perfil
    await page.getByLabel(/menu do usuário/i).click();
    await page.getByRole('menuitem', { name: /perfil/i }).click();
    await page.waitForURL(/.*\/perfil/);
    
    // 17. Alterar telefone
    await page.getByLabel(/whatsapp/i).fill('11888888888');
    await page.getByRole('button', { name: /salvar alterações/i }).click();
    
    // Verificar que o telefone foi alterado e normalizado
    await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
    
    // 18. Reload durante onboarding
    // Vamos simular um reload durante o processo de onboarding
    await page.goto('/novo-caso');
    await page.reload();
    await expect(page.getByPlaceholder(/digite seu nome/i)).toHaveValue('João Silva');
    await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
    
    // 19. Reload após cadastro
    await page.goto('/perfil');
    await page.reload();
    await expect(page.getByText(/joão silva/i)).toBeVisible();
    await expect(page.getByText(/joao.silva@email.com/i)).toBeVisible();
    await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
    
    // 20. Impedir duplicação de conta/case
    // Tentar criar outra conta com o mesmo email
    await page.getByLabel(/menu do usuário/i).click();
    await page.getByRole('menuitem', { name: /sair/i }).click();
    await page.waitForURL('/');
    
    await page.getByLabel(/entrar/i).click();
    await page.getByLabel(/email/i).fill('joao.silva@email.com');
    await page.getByLabel(/senha/i).fill('SenhaErrada456!');
    await page.getByRole('button', { name: /entrar/i }).click();
    
    // Verificar que mostra erro de credenciais inválidas (não revela se o email existe)
    await expect(page.getByText(/credenciais inválidas/i)).toBeVisible();
    
    // Tentar criar conta com mesmo email (deve impedir ou mostrar que email já existe)
    await page.getByRole('link', { name: /criar conta/i }).click();
    await page.getByLabel(/email/i).fill('joao.silva@email.com');
    await page.getByLabel(/senha/i).fill('OutraSenha123!');
    await page.getByRole('button', { name: /registrar/i }).click();
    
    // Verificar que mostra mensagem de email já em uso (sem revelar muita informação por segurança)
    await expect(page.getByText(/email já está em uso|este email já está cadastrado/i)).toBeVisible();
  });
});