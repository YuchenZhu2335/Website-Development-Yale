/* 启动：加载词典与数据 → 渲染外壳 → 启动路由 */
(async function () {
  const { t, esc, avatar } = YL.ui;

  function renderShell() {
    const logged = YL.auth.isLoggedIn();
    const lang = YL.i18n.getLang();
    const items = YL.registry.navItems();
    const mobile = YL.registry.navItems({ mobile: true });

    YL.ui.$("#topbar").innerHTML = `
      <a class="brand" href="#/home">
        <img src="assets/logo.svg" alt="" class="brand__logo" width="34" height="34">
        <span class="brand__name">${esc(YL_CONFIG.siteName)}<small>${t("brand.tagline")}</small></span>
      </a>
      <div class="topbar__actions">
        <button class="btn btn--ghost btn--sm lang-toggle" id="lang-toggle" aria-label="switch language" title="${lang === "zh" ? "Switch to English" : "切换到中文"}">
          <span class="${lang === "zh" ? "is-on" : ""}">中</span><span class="sep">/</span><span class="${lang === "en" ? "is-on" : ""}">EN</span>
        </button>
        ${logged
          ? `<a class="topbar__user" href="#/profile" title="${esc(YL.auth.user().email)}">${avatar(YL.auth.displayName(), "sm")}<span class="topbar__name">${esc(YL.auth.displayName())}</span></a>`
          : `<a class="btn btn--primary btn--sm" href="#/login">${t("nav.login")}</a>`}
      </div>`;
    YL.ui.$("#lang-toggle").onclick = () => YL.i18n.toggle();

    YL.ui.$("#sidenav").innerHTML = `
      <nav class="sidenav__list">
        ${items.map((m) => `<a class="sidenav__item" data-nav-id="${m.id}" href="#/${m.id}"><span class="ico">${m.nav.icon}</span><span>${t(m.nav.labelKey)}</span></a>`).join("")}
      </nav>
      <div class="sidenav__foot">
        <a href="${YL_CONFIG.github}" target="_blank" rel="noopener">⭐ ${t("nav.github")}</a>
        <span class="sidenav__ver">v${YL_CONFIG.version} · ${t("brand.prototype")}</span>
      </div>`;

    YL.ui.$("#bottomnav").innerHTML = mobile.map((m) =>
      `<a data-nav-id="${m.id}" href="#/${m.id}"><span class="ico">${m.nav.icon}</span>${t(m.nav.labelKey)}</a>`).join("");

    const ctx = YL.router.currentCtx();
    if (ctx) YL.ui.$$("[data-nav-id]").forEach((a) => a.classList.toggle("is-active", a.dataset.navId === ctx.module));
  }

  try {
    await YL.i18n.load();
    await YL.store.load();
  } catch (e) {
    console.error(e);
    document.getElementById("main").innerHTML = `<div class="empty"><div class="empty__icon">⚠️</div><p>Failed to load data. Please serve this folder over HTTP, e.g. <code>python3 -m http.server 8000</code></p></div>`;
    return;
  }
  renderShell();
  YL.router.start();
  window.addEventListener("yl:langchange", () => { renderShell(); YL.router.render(); });
  window.addEventListener("yl:authchange", () => { renderShell(); });
  document.getElementById("app").classList.add("is-ready");
})();
