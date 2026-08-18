import { test, expect } from '@playwright/test';

test('debug landing page content', async ({ page }) => {
  await page.goto('/');
  await expect(page).toHaveURL('/');
  
  // Get the full page content
  const content = await page.content();
  console.log('Page content:');
  console.log(content);
  
  // Check if we can find specific text
  const hasText = await page.getByText(/descubra se o seu auto de infração de trânsito possui/i).isVisible();
  console.log(`Text visible: ${hasText}`);
  
  // Try to find the button
  const button = await page.getByRole('button', { name: /analisar minha multa gratuitamente/i });
  const buttonVisible = await button.isVisible();
  console.log(`Button visible: ${buttonVisible}`);
  
  if (!buttonVisible) {
    // Let's see what buttons are available
    const buttons = await page.getByRole('button');
    const count = await buttons.count();
    console.log(`Number of buttons: ${count}`);
    
    for (let i = 0; i < Math.min(count, 5); i++) {
      const buttonText = await buttons.nth(i).textContent();
      console.log(`Button ${i} text: "${buttonText}"`);
    }
  }
});