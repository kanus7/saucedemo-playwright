import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Product sorting', () => {
  let inventoryPage: InventoryPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory.html/);
  });

  test('sorting price low to high orders items correctly', async () => {
    await inventoryPage.sortBy('lohi');

    const prices = await inventoryPage.getItemPrices().allInnerTexts();
    const numericPrices = prices.map((p) => parseFloat(p.replace('$', '')));
    const sorted = [...numericPrices].sort((a, b) => a - b);

    expect(numericPrices).toEqual(sorted);
  });

  test('sorting price high to low orders items correctly', async () => {
    await inventoryPage.sortBy('hilo');

    const prices = await inventoryPage.getItemPrices().allInnerTexts();
    const numericPrices = prices.map((p) => parseFloat(p.replace('$', '')));
    const sorted = [...numericPrices].sort((a, b) => b - a);

    expect(numericPrices).toEqual(sorted);
  });

  test('sorting name A to Z orders items alphabetically', async ({ page }) => {
    await inventoryPage.sortBy('az');

    const names = await page.locator('.inventory_item_name').allInnerTexts();
    const sorted = [...names].sort((a, b) => a.localeCompare(b));

    expect(names).toEqual(sorted);
  });
});
