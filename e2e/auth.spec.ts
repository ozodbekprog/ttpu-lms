import { expect, test } from "@playwright/test";

test("login sahifasi, xato parol, muvaffaqiyatli kirish va chiqish", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Tizimga kirish" })).toBeVisible();

  await page.getByPlaceholder("email@ttpu.uz").fill("ozodbek@ttpu.uz");
  await page.getByPlaceholder("••••••••").fill("notogri-parol");
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page.getByText("Email yoki parol xato")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);

  await page.getByPlaceholder("••••••••").fill("ttpu1234");
  await page.getByRole("button", { name: "Kirish" }).click();
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("link", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("button", { name: "Chiqish" }).click();
  await expect(page).toHaveURL(/\/login/);
});
