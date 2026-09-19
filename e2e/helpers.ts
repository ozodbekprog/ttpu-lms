import { expect, type Page } from "@playwright/test";

export const DEMO_PASSWORD = "ttpu1234";

export async function login(page: Page, email: string) {
  await page.goto("/login");
  await page.getByPlaceholder("email@ttpu.uz").fill(email);
  await page.getByPlaceholder("••••••••").fill(DEMO_PASSWORD);
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
}
