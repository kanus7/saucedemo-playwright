import { Page, Locator } from '@playwright/test';

export class CartPage {
  readonly page: Page;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;
  readonly removeButtons: Locator;
  readonly continueShoppingButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.locator('#checkout');
    this.removeButtons = page.locator('button', { hasText: 'Remove' });
    this.continueShoppingButton = page.locator('#continue-shopping');
  }

  async removeFirstItem() {
    await this.removeButtons.first().click();
  }

  async goToCheckout() {
    await this.checkoutButton.click();
  }
}
