/* Hash 路由：#/careers/jobs?industry=tech  → module "careers", sub "jobs", query {industry:"tech"}
   Hash router — no server rewrite rules needed, works on GitHub Pages / OSS / COS / file:// */
window.YL = window.YL || {};
YL.router = (function () {
  let current = null;
  function parse(hash) {
    let raw = (hash || location.hash || "").replace(/^#\/?/, "");
    let query = {};
    const qi = raw.indexOf("?");
    if (qi >= 0) {
      new URLSearchParams(raw.slice(qi + 1)).forEach((v, k) => (query[k] = v));
      raw = raw.slice(0, qi);
    }
    const segments = raw.split("/").filter(Boolean).map(decodeURIComponent);
    return { path: raw, segments, module: segments[0] || "home", sub: segments[1] || "", id: segments[2] || "", query };
  }
  function navigate(path) {
    const target = "#/" + String(path).replace(/^#?\/?/, "");
    if (location.hash === target) render(); else location.hash = target;
  }
  function render() {
    const ctx = parse();
    const root = document.getElementById("main");
    let mod = YL.registry.get(ctx.module);
    if (!mod) { root.innerHTML = YL.ui.emptyState("🧭", YL.i18n.t("router.notFound"), `<a class="btn btn--primary" href="#/home">${YL.i18n.t("router.goHome")}</a>`); return; }
    if (mod.requiresAuth && !YL.auth.isLoggedIn()) {
      navigate("login?next=" + encodeURIComponent(ctx.path || "home"));
      return;
    }
    if (YL.auth.isLoggedIn() && YL.auth.needsProfile() && ctx.module !== "login") {
      navigate("login/profile?next=" + encodeURIComponent(ctx.path || "home"));
      return;
    }
    current = ctx;
    root.innerHTML = "";
    root.scrollTop = 0;
    window.scrollTo({ top: 0 });
    document.querySelectorAll("[data-nav-id]").forEach((a) => a.classList.toggle("is-active", a.dataset.navId === ctx.module));
    try { mod.render(root, ctx); }
    catch (e) { console.error(e); root.innerHTML = YL.ui.emptyState("⚠️", "Module error: " + e.message); }
  }
  function start() { window.addEventListener("hashchange", render); render(); }
  function currentCtx() { return current; }
  return { parse, navigate, render, start, currentCtx };
})();
