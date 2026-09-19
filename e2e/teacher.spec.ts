import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("o'qituvchi jadval sahifasida o'z darslar palitrasini ko'radi", async ({ page }) => {
  await login(page, "n.mahamatov@ttpu.uz");

  await page.goto("/schedule");
  await expect(page.getByRole("heading", { name: "Dars jadvali" })).toBeVisible();
  await expect(page.getByRole("heading", { name: /Mening darslarim/ })).toBeVisible();
});
