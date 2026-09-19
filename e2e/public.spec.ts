import { expect, test } from "@playwright/test";

test("landing sarlavhasi va login havolasi ko'rinadi", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /yagona platformada/ })).toBeVisible();

  const loginLink = page.getByRole("link", { name: "Kirish" }).first();
  await expect(loginLink).toBeVisible();
  await loginLink.click();
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole("heading", { name: "Tizimga kirish" })).toBeVisible();
});
