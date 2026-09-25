import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("o'qituvchi QR davomat sessiyasini boshlab 6 belgili kodni ko'radi", async ({ page }) => {
  await login(page, "n.mahamatov@ttpu.uz");

  await page.goto("/courses/prog/attendance");
  await expect(page.getByRole("heading", { name: "Davomat", exact: true })).toBeVisible();

  const startButton = page.getByRole("button", { name: /Sessiya boshlash|Yangi sessiya/ });
  await expect(startButton).toBeVisible();
  await startButton.click();

  await expect(page.getByText("Sessiya kodi", { exact: true })).toBeVisible();
  await expect(page.locator("p.font-mono").first()).toHaveText(/^[A-HJ-NP-Z2-9]{6}$/);
});

test("talaba QR davomat sahifasida kod kiritish formasini ko'radi", async ({ page }) => {
  await login(page, "ozodbek@ttpu.uz");

  await page.goto("/attendance/check-in");
  await expect(page.getByRole("heading", { name: "QR orqali davomat", exact: true })).toBeVisible();
  await expect(page.getByText("Kodni kiriting", { exact: true })).toBeVisible();

  const codeInput = page.getByLabel("Davomat kodi", { exact: true });
  await expect(codeInput).toBeVisible();
  await expect(codeInput).toBeEnabled();

  const submitButton = page.getByRole("button", { name: "Belgilash" });
  await expect(submitButton).toBeVisible();
  await expect(submitButton).toBeDisabled();
});
