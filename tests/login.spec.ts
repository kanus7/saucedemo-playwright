import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { InventoryPage } from '../pages/InventoryPage';

test.describe('Login', () => {
  let loginPage: LoginPage;

  test.beforeEach(async ({ page }) => {
    loginPage = new LoginPage(page);
    await loginPage.goto();
  });

  test('standard user can log in with valid credentials', async ({ page }) => {
    const inventoryPage = new InventoryPage(page);

    await loginPage.login('standard_user', 'secret_sauce');

    await expect(page).toHaveURL(/inventory.html/);
    await expect(inventoryPage.pageTitle).toHaveText('Products');
    await expect(inventoryPage.inventoryItems).toHaveCount(6);
  });

  test('locked out user is blocked with a clear error message', async () => {
    await loginPage.login('locked_out_user', 'secret_sauce');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Sorry, this user has been locked out');
  });

  test('invalid password shows an error and does not log in', async ({ page }) => {
    await loginPage.login('standard_user', 'wrong_password');

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username and password do not match');
    await expect(page).toHaveURL('https://www.saucedemo.com/');
  });

  test('submitting empty credentials shows a required-field error', async () => {
    await loginPage.loginButton.click();

    await expect(loginPage.errorMessage).toBeVisible();
    await expect(loginPage.errorMessage).toContainText('Username is required');
  });
});
