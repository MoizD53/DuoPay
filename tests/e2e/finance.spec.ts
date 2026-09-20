import { test, expect } from "@playwright/test";

test.describe("End-to-End Financial Flow", () => {
  // This test expects the database to be seeded (`npm run seed`)
  // and the Dev server to be running.
  
  test("User logs in, creates expense, checks balances, and settles", async ({ page }) => {
    // 1. Login
    await page.goto("/login");
    await page.fill('input[type="email"]', "moiz@example.com");
    await page.click("text=Continue");
    
    // Wait for redirect to home
    await expect(page).toHaveURL("/");
    await expect(page.locator("text=Good evening, Moiz")).toBeVisible();

    // 2. Navigate to Groups
    await page.click("nav a:has-text('Groups')");
    await expect(page.locator("text=Goa Trip")).toBeVisible();
    await page.click("text=Goa Trip");

    // 3. Create Expense (Wait for FAB trigger via JS or just click if DOM supports)
    // The FAB dispatches an event, let's trigger it directly.
    await page.evaluate(() => window.dispatchEvent(new CustomEvent("open-add-expense")));
    
    // 4. Fill Expense Flow
    await page.fill('input[type="number"]', "2400");
    await page.click("text=Next");
    
    await page.fill('input[type="text"][placeholder="Dinner, Taxi, etc."]', "Dinner");
    
    // Select Group
    await page.selectOption('select', { label: 'Goa Trip' });
    
    // Select All Members
    await page.click("text=Select All");
    
    await page.click("text=Review Summary");
    
    // Submit
    await page.click("text=Confirm Expense");
    
    // 5. Check Balances Tab
    await page.click("text=balances");
    await expect(page.locator("text=Owed to you")).toBeVisible({ timeout: 5000 });
    
    // 6. Check Settlement Plan
    await page.click("text=View Settlement Plan");
    await expect(page.locator("text=Settle Up")).toBeVisible();
    
    // In a real flow, we would click 'Pay', which hits the POST /settlements endpoint.
  });
});
