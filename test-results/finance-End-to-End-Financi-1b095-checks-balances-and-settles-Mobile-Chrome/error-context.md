# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: finance.spec.ts >> End-to-End Financial Flow >> User logs in, creates expense, checks balances, and settles
- Location: tests\e2e\finance.spec.ts:7:7

# Error details

```
Test timeout of 30000ms exceeded.
```

```
Error: page.click: Test timeout of 30000ms exceeded.
Call log:
  - waiting for locator('text=Next')
    - locator resolved to <button disabled class="w-full max-w-[200px] py-4 rounded-full font-bold transition-all bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed">Next</button>
  - attempting click action
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
    - waiting 20ms
    2 × waiting for element to be visible, enabled and stable
      - element is not enabled
    - retrying click action
      - waiting 100ms
    51 × waiting for element to be visible, enabled and stable
       - element is not enabled
     - retrying click action
       - waiting 500ms

```

# Page snapshot

```yaml
- generic [ref=f1e1]:
  - generic [ref=f1e2]:
    - main [ref=f1e3]:
      - generic [ref=f1e4]:
        - generic [ref=f1e5]:
          - generic [ref=f1e6]:
            - link [ref=f1e7] [cursor=pointer]:
              - /url: /groups
            - heading "Goa Trip" [level=1] [ref=f1e10]
          - paragraph [ref=f1e11]: You are settled up
          - link "GET TO ZERO" [ref=f1e12] [cursor=pointer]:
            - /url: /groups/33fdcabe-b662-4c22-a32b-fda2fbf19361/settle
          - generic [ref=f1e13]:
            - button "expenses" [ref=f1e14]
            - button "summary" [ref=f1e15]
            - button "activity" [ref=f1e16]
        - paragraph [ref=f1e19]: No expenses yet.
    - navigation [ref=f1e20]:
      - link "Home" [ref=f1e21] [cursor=pointer]:
        - /url: /
      - link "Groups" [ref=f1e26] [cursor=pointer]:
        - /url: /groups
      - button [ref=f1e34]
      - link "Activity" [ref=f1e36] [cursor=pointer]:
        - /url: /activity
      - link "Profile" [ref=f1e40] [cursor=pointer]:
        - /url: /profile
    - generic [ref=f1e47]:
      - generic [ref=f1e48]:
        - button [ref=f1e49]
        - generic [ref=f1e53]: Add Expense
      - generic [ref=f1e55]:
        - generic [ref=f1e56]:
          - paragraph [ref=f1e57]:
            - generic [ref=f1e58]: ✨
            - text: Just tell DuoPay
          - textbox "I paid 2400 for dinner for me, Hatim and Ali..." [ref=f1e59]
          - paragraph [ref=f1e60]: Press enter to preview. (Select group first below)
        - generic [ref=f1e61]:
          - generic [ref=f1e62]: Group
          - combobox [ref=f1e63]:
            - option "Select Group" [disabled] [selected]
            - option "Goa Trip"
        - generic [ref=f1e64]: OR ENTER MANUALLY
        - generic [ref=f1e68]:
          - generic [ref=f1e69]: ₹
          - spinbutton "0.00" [active] [ref=f1e70]: "2400"
        - button "Next" [disabled] [ref=f1e71]
  - alert [ref=f1e72]
```

# Test source

```ts
  1  | import { test, expect } from "@playwright/test";
  2  | 
  3  | test.describe("End-to-End Financial Flow", () => {
  4  |   // This test expects the database to be seeded (`npm run seed`)
  5  |   // and the Dev server to be running.
  6  |   
  7  |   test("User logs in, creates expense, checks balances, and settles", async ({ page }) => {
  8  |     // 1. Login
  9  |     await page.goto("/login");
  10 |     await page.fill('input[type="email"]', "moiz@example.com");
  11 |     await page.click("text=Continue");
  12 |     
  13 |     // Wait for redirect to home
  14 |     await expect(page).toHaveURL("/");
  15 |     await expect(page.locator("text=Good evening, Moiz")).toBeVisible();
  16 | 
  17 |     // 2. Navigate to Groups
  18 |     await page.click("nav a:has-text('Groups')");
  19 |     await expect(page.locator("text=Goa Trip")).toBeVisible();
  20 |     await page.click("text=Goa Trip");
  21 | 
  22 |     // 3. Create Expense (Wait for FAB trigger via JS or just click if DOM supports)
  23 |     // The FAB dispatches an event, let's trigger it directly.
  24 |     await page.evaluate(() => window.dispatchEvent(new CustomEvent("open-add-expense")));
  25 |     
  26 |     // 4. Fill Expense Flow
  27 |     await page.fill('input[type="number"]', "2400");
> 28 |     await page.click("text=Next");
     |                ^ Error: page.click: Test timeout of 30000ms exceeded.
  29 |     
  30 |     await page.fill('input[type="text"][placeholder="Dinner, Taxi, etc."]', "Dinner");
  31 |     
  32 |     // Select Group
  33 |     await page.selectOption('select', { label: 'Goa Trip' });
  34 |     
  35 |     // Select All Members
  36 |     await page.click("text=Select All");
  37 |     
  38 |     await page.click("text=Review Summary");
  39 |     
  40 |     // Submit
  41 |     await page.click("text=Confirm Expense");
  42 |     
  43 |     // 5. Check Balances Tab
  44 |     await page.click("text=balances");
  45 |     await expect(page.locator("text=Owed to you")).toBeVisible({ timeout: 5000 });
  46 |     
  47 |     // 6. Check Settlement Plan
  48 |     await page.click("text=View Settlement Plan");
  49 |     await expect(page.locator("text=Settle Up")).toBeVisible();
  50 |     
  51 |     // In a real flow, we would click 'Pay', which hits the POST /settlements endpoint.
  52 |   });
  53 | });
  54 | 
```