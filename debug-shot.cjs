const { chromium } = require("@playwright/test");

const BASE = "https://ozodbeks-macbook-pro.tail91a187.ts.net:8443";

(async () => {
  const browser = await chromium.launch({ channel: "chrome", headless: true });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  page.on("pageerror", (err) => errors.push(String(err)));

  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.fill('input[type="email"]', "student2@ttpu.uz");
  await page.fill('input[type="password"]', "ttpu1234");
  await page.locator('form button[type="submit"]').click();
  await page.waitForTimeout(5000);
  console.log("URL:", page.url());
  const buttons = await page.locator("button").allInnerTexts();
  console.log("BUTTONS:", JSON.stringify(buttons.slice(0, 20)));
  console.log("ERRORS:", JSON.stringify(errors.slice(0, 8)));
  await page.screenshot({ path: "debug-mobile.png" });
  await browser.close();
})().catch((error) => {
  console.error("XATO:", error.message);
  process.exit(1);
});
