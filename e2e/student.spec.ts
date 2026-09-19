import { expect, test } from "@playwright/test";
import { login } from "./helpers";

test("talaba kurslar ro'yxati, kurs sahifasi va davomat jurnalini ko'radi", async ({ page }) => {
  await login(page, "ozodbek@ttpu.uz");

  await page.goto("/courses");
  await expect(page.getByRole("heading", { name: "Kurslar" })).toBeVisible();
  const course = page.getByRole("link", { name: /Programming Fundamentals \(PROG\)/ });
  await expect(course).toBeVisible();
  await course.click();

  await expect(page).toHaveURL(/\/courses\/prog/);
  await expect(
    page.getByRole("heading", { name: "Programming Fundamentals (PROG)" }),
  ).toBeVisible();

  await page.goto("/courses/prog/attendance/journal");
  await expect(page.getByRole("heading", { name: "Guruh jurnali" }).first()).toBeVisible();
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Talaba" })).toBeVisible();
});
