import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("admin panel va modul sozlamalari ochiladi", async ({ page }) => {
  await login(page, "admin@ttpu.uz");

  await page.goto("/admin");
  await expect(page.getByRole("heading", { name: "Admin panel" })).toBeVisible();

  await page.goto("/admin/settings");
  await expect(page.getByRole("heading", { name: "Sozlamalar" })).toBeVisible();
  await expect(page.getByRole("switch")).toHaveCount(6);
  await expect(page.getByRole("switch").first()).toBeVisible();
});
