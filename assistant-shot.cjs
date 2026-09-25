const { chromium } = require("@playwright/test");

const BASE = "https://ozodbeks-macbook-pro.tail91a187.ts.net:8443";

async function login(page) {
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"]', "student2@ttpu.uz");
  await page.fill('input[type="password"]', "ttpu1234");
  await page.locator('form button[type="submit"]').click();
  await page.waitForURL("**/dashboard", { timeout: 40000 });
  await page.waitForTimeout(1500);
}

async function openAssistant(page) {
  const button = page.locator("button", { hasText: "Yordam" }).first();
  await button.click({ timeout: 30000 });
  await page.waitForTimeout(900);
}

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });

  const mobile = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  await login(mobile);
  await openAssistant(mobile);
  await mobile.screenshot({
    path: "/Users/ozodbekxoshimov/Documents/Default Project/ferma/lms-assistant-mobile.png",
  });

  const desktop = await browser.newPage({ viewport: { width: 1280, height: 800 } });
  await login(desktop);
  await openAssistant(desktop);
  await desktop.screenshot({
    path: "/Users/ozodbekxoshimov/Documents/Default Project/ferma/lms-assistant-desktop.png",
  });

  await browser.close();
  console.log("OK");
})().catch((error) => {
  console.error("XATO:", error.message);
  process.exit(1);
});
