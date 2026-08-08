import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';
import { CartPage } from '../pages/CartPage';
import { CheckoutPage } from '../pages/CheckoutPage';

test.describe('Checkout', () => {
  let inventoryPage: InventoryPage;
  let cartPage: CartPage;
  let checkoutPage: CheckoutPage;

  test.beforeEach(async ({ page }) => {
    const loginPage = new LoginPage(page);
    inventoryPage = new InventoryPage(page);
    cartPage = new CartPage(page);
    checkoutPage = new CheckoutPage(page);

    await loginPage.goto();
    await loginPage.login('standard_user', 'secret_sauce');
    await inventoryPage.addFirstItemToCart();
    await inventoryPage.openCart();
    await cartPage.goToCheckout();
  });

  test('user can complete a purchase end to end with valid details', async ({ page }) => {
    await checkoutPage.fillInfo('Kanupriya', 'Sharma', 'RG1 1AA');
    await checkoutPage.continueToOverview();

    await expect(page).toHaveURL(/checkout-step-two.html/);
    await expect(checkoutPage.summaryTotalLabel).toBeVisible();

    await checkoutPage.finishOrder();

    await expect(page).toHaveURL(/checkout-complete.html/);
    await expect(checkoutPage.completeHeader).toHaveText('Thank you for your order!');
  });

  test('checkout blocks progress when required fields are missing', async () => {
    await checkoutPage.continueToOverview();

    await expect(checkoutPage.errorMessage).toBeVisible();
    await expect(checkoutPage.errorMessage).toContainText('First Name is required');
  });

  test('order total on the overview reflects item price plus tax', async ({ page }) => {
    await checkoutPage.fillInfo('Kanupriya', 'Sharma', 'RG1 1AA');
    await checkoutPage.continueToOverview();

    const itemPriceText = await page.locator('.inventory_item_price').first().innerText();
    const itemPrice = parseFloat(itemPriceText.replace('$', ''));

    const subtotalText = await page.locator('.summary_subtotal_label').innerText();
    const subtotal = parseFloat(subtotalText.replace('Item total: $', ''));

    const totalText = await checkoutPage.summaryTotalLabel.innerText();
    const total = parseFloat(totalText.replace('Total: $', ''));

    expect(subtotal).toBeCloseTo(itemPrice, 2);
    expect(total).toBeGreaterThan(subtotal); // tax should be applied
  });
});
