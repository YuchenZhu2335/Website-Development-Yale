// Playwright 冒烟测试：起本地静态服务，验证登录门槛、语言切换、全部路由、学联后台工作流
// Run: npx playwright test   (CI installs @playwright/test; locally: npm i)
const { test, expect } = require("@playwright/test");
const { spawn } = require("node:child_process");
const path = require("node:path");

const PORT = 8123;
const BASE = `http://127.0.0.1:${PORT}/`;
let server;
test.beforeAll(async () => {
  server = spawn("python3", ["-m", "http.server", String(PORT), "--directory", path.join(__dirname, "..", "web")], { stdio: "ignore" });
  for (let i = 0; i < 50; i++) { try { const r = await fetch(BASE); if (r.ok) return; } catch (e) {} await new Promise((r) => setTimeout(r, 100)); }
  throw new Error("server did not start");
});
test.afterAll(() => server && server.kill());

async function login(page, opts = {}) {
  await page.goto(BASE + "#/login");
  await page.fill("#email", opts.email || "demo@yale.edu");
  await page.click("#f-email button[type=submit]");
  await page.fill("#code", "000000");
  await page.click("#f-code button[type=submit]");
  await page.waitForSelector("#f-profile");
  await page.fill('input[name="name"]', opts.name || "测试同学");
  if (opts.acssyRole) await page.selectOption('select[name="acssyRole"]', opts.acssyRole);
  await page.click("#f-profile button[type=submit]");
  await page.waitForSelector(".hero");
}

test("loads without console errors and switches language", async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  await page.goto(BASE);
  await expect(page.locator(".hero h1")).toContainText("属于耶鲁人自己的社群");
  await page.click("#lang-toggle");
  await expect(page.locator(".hero h1")).toContainText("A community of our own");
  await page.reload();
  await expect(page.locator(".hero h1")).toContainText("A community of our own");
  await page.click("#lang-toggle");
  expect(errors).toEqual([]);
});

test("login rejects non-Yale email and accepts yale.edu with demo code", async ({ page }) => {
  await page.goto(BASE + "#/login");
  await page.fill("#email", "someone@gmail.com");
  await page.click("#f-email button[type=submit]");
  await expect(page.locator("#email-err")).toContainText("耶鲁邮箱");
  await login(page);
  await expect(page.locator(".topbar__user")).toBeVisible();
});

test("every public route renders content", async ({ page }) => {
  await login(page);
  for (const r of ["home", "careers/jobs", "careers/timeline", "careers/resume", "careers/groups", "careers/research", "careers/post/s01", "events", "events/e/e01", "circles", "circles/c/ci-nyc", "startup", "startup/projects", "startup/match", "life", "directory", "directory/u/u01", "profile", "about"]) {
    await page.goto(BASE + "#/" + r);
    await page.waitForFunction(() => document.querySelector("#main").children.length > 0);
    const text = await page.locator("#main").innerText();
    expect(text.trim().length, r).toBeGreaterThan(40);
  }
});

test("directory requires login", async ({ page }) => {
  await page.goto(BASE + "#/directory");
  await page.waitForSelector("#f-email");
  expect(page.url()).toContain("#/login");
});

test("ACSSY console: gate, board, claim task, wizard creates project", async ({ page }) => {
  await login(page, { acssyRole: "member" });
  await page.goto(BASE + "#/acssy");
  await expect(page.locator("h1")).toContainText("学联后台");
  await page.goto(BASE + "#/acssy/board/c01");
  await page.locator("[data-claim]").first().click();
  await expect(page.locator(".toast")).toContainText("已认领");
  await page.goto(BASE + "#/acssy/board");
  await expect(page.locator("#main")).toContainText("我的待办");
  await page.click("#btn-wizard");
  await page.click('[data-scope="acssy"]');
  await page.click("#w-next");
  await page.click('[data-pb="pb-panel"]');
  await page.click("#w-next");
  await page.fill('input[name="title"]', "测试分享会");
  await page.fill('input[name="date"]', "2026-12-01");
  await page.fill('input[name="time"]', "19:00");
  await page.fill('input[name="venue"]', "Evans Hall");
  await page.fill('textarea[name="description"]', "冒烟测试");
  await page.click("#w-form button.btn--primary");
  await page.waitForURL(/#\/acssy\/board\//);
  await expect(page.locator("#main")).toContainText("测试分享会");
  await expect(page.locator("[data-status]").first()).toBeVisible();
});

test("screenshots at mobile and desktop widths", async ({ browser }) => {
  for (const [name, vp] of [["mobile", { width: 390, height: 844 }], ["desktop", { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport: vp });
    const page = await ctx.newPage();
    await login(page, { acssyRole: "lead" });
    for (const r of ["home", "careers/jobs", "events", "acssy/board/c01"]) {
      await page.goto(BASE + "#/" + r);
      await page.waitForFunction(() => document.querySelector("#main").children.length > 0);
      await page.screenshot({ path: `tests/screenshots/${name}-${r.replace(/\//g, "_")}.png`, fullPage: true });
    }
    await ctx.close();
  }
});
