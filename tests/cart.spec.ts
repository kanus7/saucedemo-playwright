import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';

test.describe('Cart', () => {
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await expect(page).toHaveURL(/inventory.html/);
  });

  test('adding an item updates the cart badge count', async () => {
    await expect(inventoryPage.cartBadge).toHaveCount(0);

    await inventoryPage.addFirstItemToCart();

    await expect(inventoryPage.cartBadge).toHaveText('1');
  });

  test('adding multiple items keeps the badge count accurate', async ({ page }) => {
    const addButtons = page.locator('button', { hasText: 'Add to cart' });
    await addButtons.nth(0).click();
    await addButtons.nth(0).click(); // list re-renders after each add, so re-query index 0
    await addButtons.nth(0).click();

    await expect(inventoryPage.cartBadge).toHaveText('3');

    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(3);
  });

  test('removing an item from the cart updates the count and list', async () => {
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await expect(cartPage.cartItems).toHaveCount(1);

    await cartPage.removeFirstItem();

    await expect(cartPage.cartItems).toHaveCount(0);
    await expect(inventoryPage.cartBadge).toHaveCount(0);
  });
});
