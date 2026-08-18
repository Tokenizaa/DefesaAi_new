# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth-onboarding.spec.ts >> Adeus Multa - Identidade, Cadastro e Autenticação >> should complete full onboarding and authentication flow
- Location: tests/auth-onboarding.spec.ts:4:3

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: locator.fill: Test timeout of 30000ms exceeded.
Call log:
  - waiting for getByPlaceholder(/digite seu nome/i)

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e5]:
    - generic [ref=e6]:
      - link "Ir para o conteúdo 1" [ref=e7] [cursor=pointer]:
        - /url: "#main-content"
        - generic [ref=e8]: Ir para o conteúdo
        - generic [ref=e9]: "1"
      - link "Ir para o menu 2" [ref=e10] [cursor=pointer]:
        - /url: "#main-menu"
        - generic [ref=e11]: Ir para o menu
        - generic [ref=e12]: "2"
      - link "Ir para a busca 3" [ref=e13] [cursor=pointer]:
        - /url: "#main-search"
        - generic [ref=e14]: Ir para a busca
        - generic [ref=e15]: "3"
      - link "Ir para o rodapé 4" [ref=e16] [cursor=pointer]:
        - /url: "#footer"
        - generic [ref=e17]: Ir para o rodapé
        - generic [ref=e18]: "4"
    - generic [ref=e19]:
      - generic [ref=e20]:
        - button "Diminuir tamanho da fonte" [ref=e21] [cursor=pointer]: A-
        - button "Redefinir tamanho da fonte" [ref=e22] [cursor=pointer]: A
        - button "Aumentar tamanho da fonte" [ref=e23] [cursor=pointer]: A+
      - button "Alternar modo de alto contraste" [ref=e24] [cursor=pointer]:
        - generic [ref=e31]: Alto Contraste
  - banner [ref=e32]:
    - generic [ref=e34]:
      - generic [ref=e35]:
        - generic [ref=e36]: DEFESAI
        - generic [ref=e38]: Sistema de Defesa Autônoma
      - generic [ref=e39]:
        - link "Página Inicial" [ref=e40] [cursor=pointer]:
          - /url: /
        - link "Análise Gratuita" [ref=e41] [cursor=pointer]:
          - /url: /novo-caso
        - link "Base Jurídica" [ref=e42] [cursor=pointer]:
          - /url: /knowledge
    - generic [ref=e44]:
      - generic [ref=e45]:
        - button "Abrir menu de navegação" [ref=e46] [cursor=pointer]
        - generic [ref=e48] [cursor=pointer]:
          - generic [ref=e49]:
            - generic [ref=e50]: Defe
            - generic [ref=e51]: s
            - generic [ref=e52]: Ai
          - generic [ref=e54]:
            - heading "Adeus Multa CTB • CONTRAN" [level=1] [ref=e55]:
              - generic [ref=e56]: Adeus
              - generic [ref=e57]: Multa
              - generic [ref=e58]: CTB • CONTRAN
            - paragraph [ref=e59]: Plataforma de Defesa Autônoma para Multas de Trânsito
      - generic [ref=e60]:
        - generic [ref=e61]:
          - textbox "Buscar serviços ou infrações..." [ref=e62]
          - button "Executar busca" [ref=e63] [cursor=pointer]
        - button "Análise Gratuita" [ref=e67] [cursor=pointer]
        - button "D Acessar Conta" [ref=e72] [cursor=pointer]:
          - generic [ref=e73]: D
          - generic [ref=e74]: Acessar Conta
  - main [ref=e75]:
    - generic [ref=e77]:
      - generic [ref=e78]:
        - generic [ref=e79]:
          - generic [ref=e80]: F1
          - generic [ref=e81]:
            - generic [ref=e82]:
              - generic [ref=e83]: Fase 1 • Diagnóstico Preliminar
              - generic [ref=e84]: •
              - generic [ref=e85]: 100% Gratuito
            - heading "1. Situação que deseja resolver" [level=2] [ref=e86]
        - generic [ref=e87]:
          - generic "Etapa 1" [ref=e88]
          - generic "Etapa 2" [ref=e89]
          - generic "Etapa 3" [ref=e90]
          - generic "Etapa 4" [ref=e91]
          - generic "Etapa 5" [ref=e92]
          - generic "Etapa 6" [ref=e93]
          - generic "Etapa 7" [ref=e94]
          - generic "Etapa 8" [ref=e95]
          - generic "Etapa 9" [ref=e96]
          - generic "Etapa 10" [ref=e97]
      - generic [ref=e98]:
        - generic [ref=e99]:
          - generic [ref=e100]: Passo 1 de 4 • Diagnóstico Preliminar Gratuito
          - heading "Qual situação você quer resolver?" [level=1] [ref=e104]
          - paragraph [ref=e105]: Selecione o objetivo da sua defesa para aplicarmos as teses exatas do Código de Trânsito Brasileiro.
        - generic [ref=e106]:
          - button "Multa de Trânsito Radar, celular ao volante, sinal vermelho, estacionamento, rodízio ou infrações gerais. Análise Gratuita Continuar" [ref=e107] [cursor=pointer]:
            - generic [ref=e114]:
              - heading "Multa de Trânsito" [level=3] [ref=e116]
              - paragraph [ref=e117]: Radar, celular ao volante, sinal vermelho, estacionamento, rodízio ou infrações gerais.
            - generic [ref=e118]:
              - generic [ref=e119]: Análise Gratuita
              - generic [ref=e120]: Continuar
          - button "Conversão em Advertência (0 Reais de Multa) Art. 267 do CTB (Lei 14.071/20). Isenção total de pagamento e 0 pontos na CNH para infrações leves ou médias. 100% Isenção Continuar" [ref=e123] [cursor=pointer]:
            - generic [ref=e130]:
              - heading "Conversão em Advertência (0 Reais de Multa)" [level=3] [ref=e132]
              - paragraph [ref=e133]: Art. 267 do CTB (Lei 14.071/20). Isenção total de pagamento e 0 pontos na CNH para infrações leves ou médias.
            - generic [ref=e134]:
              - generic [ref=e135]: 100% Isenção
              - generic [ref=e136]: Continuar
          - button "Indicação de Real Condutor Transferência legal da pontuação para o motorista que estava dirigindo o veículo no momento da infração. Art. 257 § 7º Continuar" [ref=e139] [cursor=pointer]:
            - generic [ref=e145]:
              - heading "Indicação de Real Condutor" [level=3] [ref=e147]
              - paragraph [ref=e148]: Transferência legal da pontuação para o motorista que estava dirigindo o veículo no momento da infração.
            - generic [ref=e149]:
              - generic [ref=e150]: Art. 257 § 7º
              - generic [ref=e151]: Continuar
          - button "Suspensão da CNH / Lei Seca Processo de suspensão por bafômetro (Art. 165/165-A), excesso de velocidade acima de 50% ou acúmulo de pontos. Proteção CNH Continuar" [ref=e154] [cursor=pointer]:
            - generic [ref=e159]:
              - heading "Suspensão da CNH / Lei Seca" [level=3] [ref=e161]
              - paragraph [ref=e162]: Processo de suspensão por bafômetro (Art. 165/165-A), excesso de velocidade acima de 50% ou acúmulo de pontos.
            - generic [ref=e163]:
              - generic [ref=e164]: Proteção CNH
              - generic [ref=e165]: Continuar
          - button "Cassação da CNH (PCDD) Defesa contra processo de cancelamento do direito de dirigir por conduzir com CNH suspensa ou reincidência. Instância Crítica Continuar" [ref=e168] [cursor=pointer]:
            - generic [ref=e174]:
              - heading "Cassação da CNH (PCDD)" [level=3] [ref=e176]
              - paragraph [ref=e177]: Defesa contra processo de cancelamento do direito de dirigir por conduzir com CNH suspensa ou reincidência.
            - generic [ref=e178]:
              - generic [ref=e179]: Instância Crítica
              - generic [ref=e180]: Continuar
        - generic [ref=e183]:
          - generic [ref=e184]: Sem necessidade de cadastro prévio
          - generic [ref=e188]: Cálculo determinístico de prazos
          - generic [ref=e192]: Base jurídica atualizada com a Lei 14.071/20
  - contentinfo [ref=e197]:
    - generic [ref=e198]:
      - generic [ref=e199]:
        - generic [ref=e200]:
          - generic [ref=e201]:
            - generic [ref=e202]:
              - generic [ref=e203]: Defe
              - generic [ref=e204]: s
              - generic [ref=e205]: Ai
            - generic [ref=e206]: "| Adeus Multa"
          - paragraph [ref=e207]: Plataforma de inteligência jurídica para geração determinística de defesas e recursos de trânsito em conformidade com o Código de Trânsito Brasileiro (CTB) e Resoluções do CONTRAN.
          - generic [ref=e208]: Sistema de Defesa Autônoma
        - generic [ref=e212]:
          - heading "Serviços ao Usuário" [level=3] [ref=e213]
          - list [ref=e214]:
            - listitem [ref=e215]:
              - button "Análise Preliminar Gratuita de Multa" [ref=e216] [cursor=pointer]
            - listitem [ref=e217]:
              - button "Defesa Prévia (Notificação de Autuação)" [ref=e218] [cursor=pointer]
            - listitem [ref=e219]:
              - button "Recurso à JARI (1ª Instância)" [ref=e220] [cursor=pointer]
            - listitem [ref=e221]:
              - button "Recurso ao CETRAN (2ª Instância)" [ref=e222] [cursor=pointer]
            - listitem [ref=e223]:
              - button "Conversão em Advertência (Art. 267 CTB)" [ref=e224] [cursor=pointer]
        - generic [ref=e225]:
          - heading "Legislação & Normas" [level=3] [ref=e226]
          - list [ref=e227]:
            - listitem [ref=e228]:
              - link "Lei nº 9.503/1997 (CTB)" [ref=e229] [cursor=pointer]:
                - /url: https://www.planalto.gov.br/ccivil_03/leis/l9503compilado.htm
            - listitem [ref=e235]: Resoluções CONTRAN (798, 909, 918)
            - listitem [ref=e236]: Súmula 312 do STJ (Notificação Dupla)
            - listitem [ref=e237]: Tema 1.097 do STJ
            - listitem [ref=e238]:
              - link "SENATRAN — Secretaria Nacional" [ref=e239] [cursor=pointer]:
                - /url: https://www.gov.br/transportes/pt-br/assuntos/transito/senatran
        - generic [ref=e245]:
          - heading "Acessibilidade & LGPD" [level=3] [ref=e246]
          - paragraph [ref=e247]: Tratamento de dados realizado estritamente segundo as diretrizes da Lei nº 13.709/2018 (LGPD), garantindo sigilo e minimização de coleta.
          - generic [ref=e248]:
            - generic [ref=e249]: Criptografia de Ponta a Ponta
            - paragraph [ref=e254]: Em conformidade com o eMAG e WCAG 2.1 / 2.2 AA.
      - generic [ref=e255]:
        - generic [ref=e256]:
          - generic [ref=e257]: BRASIL
          - paragraph [ref=e259]: © 2026 DefesAi • Tecnologia Jurídica Autônoma • Todos os direitos reservados.
        - generic [ref=e260]:
          - generic [ref=e261]: Padrão DefesAi
          - generic [ref=e262]: •
          - generic [ref=e263]: Versão 1.0.0
  - region "Aviso de Privacidade e Cookies" [ref=e264]:
    - generic [ref=e265]:
      - generic [ref=e271]:
        - heading "Privacidade e Proteção de Dados (LGPD — Lei nº 13.709/2018)" [level=4] [ref=e272]
        - paragraph [ref=e274]: Utilizamos cookies e tecnologias similares estritamente essenciais para garantir a segurança da sessão, acessibilidade e a correta geração das defesas de trânsito.
      - generic [ref=e275]:
        - button "Apenas Necessários" [ref=e276] [cursor=pointer]
        - button "Aceitar e Continuar" [ref=e277] [cursor=pointer]
```

# Test source

```ts
  1   | import { test, expect } from '@playwright/test';
  2   | 
  3   | test.describe('Adeus Multa - Identidade, Cadastro e Autenticação', () => {
  4   |   test('should complete full onboarding and authentication flow', async ({ page }) => {
  5   |     // 1. Iniciar onboarding sem login (na landing page)
  6   |     await page.goto('/');
  7   |     await expect(page).toHaveURL('/');
  8   |     
  9   |     // Verificar se estamos na landing page
  10  |     await expect(page.getByText(/descubra se o seu auto de infração de trânsito possui/i)).toBeVisible();
  11  |     
  12  |     // Clicar no botão para iniciar análise gratuita (isso leva ao onboarding)
  13  |     await page.getByRole('button', { name: /analisar minha multa gratuitamente/i }).click();
  14  |     await page.waitForURL('/novo-caso');
  15  |     
  16  |     // 2. Informar nome (primeiro passo do onboarding)
> 17  |     await page.getByPlaceholder(/digite seu nome/i).fill('João Silva');
      |                                                     ^ Error: locator.fill: Test timeout of 30000ms exceeded.
  18  |     await expect(page.getByPlaceholder(/digite seu nome/i)).toHaveValue('João Silva');
  19  |     
  20  |     // 3. Informar WhatsApp
  21  |     await page.getByPlaceholder(/digite seu whatsapp/i).fill('11999999999');
  22  |     await expect(page.getByPlaceholder(/digite seu whatsapp/i)).toHaveValue('11999999999');
  23  |     
  24  |     // 4. Validar telefone
  25  |     await page.getByRole('button', { name: /continuar/i }).click();
  26  |     
  27  |     // 5. Normalizar telefone para E.164
  28  |     // Aguardar a normalização acontecer (se houver indicação visual)
  29  |     await page.waitForTimeout(1000); // Aguardar processamento
  30  |     
  31  |     // 6. Enviar documentos
  32  |     await page.getByLabel(/tipo de documento/i).selectOption('cnh');
  33  |     await page.setInputFiles('input[type="file"]', [
  34  |       {
  35  |         name: 'cnh-frente.jpg',
  36  |         mimeType: 'image/jpeg',
  37  |         buffer: Buffer.from('fake image content'),
  38  |       },
  39  |       {
  40  |         name: 'cnh-verso.jpg',
  41  |         mimeType: 'image/jpeg',
  42  |         buffer: Buffer.from('fake image content'),
  43  |       }
  44  |     ]);
  45  |     
  46  |     // 7. Concluir análise gratuita
  47  |     await page.getByRole('button', { name: /solicitar análise gratuita/i }).click();
  48  |     await page.waitForURL(/.*\/resultado-gratuito/);
  49  |     
  50  |     // Verificar que a análise gratuita foi concluída
  51  |     await expect(page.getByText(/análise concluída/i)).toBeVisible();
  52  |     
  53  |     // 8. Abrir autenticação
  54  |     await page.getByRole('button', { name: /criar conta/i }).click();
  55  |     
  56  |     // 9. Criar conta
  57  |     await page.getByLabel(/email/i).fill('joao.silva@email.com');
  58  |     await page.getByLabel(/senha/i).fill('SenhaSegura123!');
  59  |     await page.getByRole('button', { name: /registrar/i }).click();
  60  |     
  61  |     // 10. Preservar dados do onboarding
  62  |     // Verificar que os dados do onboarding foram preservados
  63  |     await expect(page.getByText(/joão silva/i)).toBeVisible();
  64  |     await expect(page.locator('text=+55 11 99999-9999')).toBeVisible(); // Telefone formatado
  65  |     
  66  |     // 11. Executar claim
  67  |     await page.getByRole('button', { name: /reivindicar caso/i }).click();
  68  |     
  69  |     // 12. Continuar para checkout
  70  |     await page.getByRole('button', { name: /prosseguir para pagamento/i }).click();
  71  |     await page.waitForURL(/.*\/checkout/);
  72  |     
  73  |     // 13. Logout
  74  |     await page.getByLabel(/menu do usuário/i).click();
  75  |     await page.getByRole('menuitem', { name: /sair/i }).click();
  76  |     await page.waitForURL('/');
  77  |     
  78  |     // 14. Login novamente
  79  |     await page.getByLabel(/entrar/i).click();
  80  |     await page.getByLabel(/email/i).fill('joao.silva@email.com');
  81  |     await page.getByLabel(/senha/i).fill('SenhaSegura123!');
  82  |     await page.getByRole('button', { name: /entrar/i }).click();
  83  |     
  84  |     // 15. Recuperar documentos
  85  |     await expect(page.getByText(/seus documentos/i)).toBeVisible();
  86  |     await expect(page.getByText(/cnh-frente.jpg/i)).toBeVisible();
  87  |     
  88  |     // 16. Acessar perfil
  89  |     await page.getByLabel(/menu do usuário/i).click();
  90  |     await page.getByRole('menuitem', { name: /perfil/i }).click();
  91  |     await page.waitForURL(/.*\/perfil/);
  92  |     
  93  |     // 17. Alterar telefone
  94  |     await page.getByLabel(/whatsapp/i).fill('11888888888');
  95  |     await page.getByRole('button', { name: /salvar alterações/i }).click();
  96  |     
  97  |     // Verificar que o telefone foi alterado e normalizado
  98  |     await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
  99  |     
  100 |     // 18. Reload durante onboarding
  101 |     // Vamos simular um reload durante o processo de onboarding
  102 |     await page.goto('/novo-caso');
  103 |     await page.reload();
  104 |     await expect(page.getByPlaceholder(/digite seu nome/i)).toHaveValue('João Silva');
  105 |     await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
  106 |     
  107 |     // 19. Reload após cadastro
  108 |     await page.goto('/perfil');
  109 |     await page.reload();
  110 |     await expect(page.getByText(/joão silva/i)).toBeVisible();
  111 |     await expect(page.getByText(/joao.silva@email.com/i)).toBeVisible();
  112 |     await expect(page.locator('text=+55 11 88888-8888')).toBeVisible();
  113 |     
  114 |     // 20. Impedir duplicação de conta/case
  115 |     // Tentar criar outra conta com o mesmo email
  116 |     await page.getByLabel(/menu do usuário/i).click();
  117 |     await page.getByRole('menuitem', { name: /sair/i }).click();
```