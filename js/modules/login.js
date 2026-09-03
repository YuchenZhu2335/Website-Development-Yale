/* 登录模块：邮箱域名校验 → 验证码 → 首次完善资料 */
registerModule({
  id: "login",
  descriptionKey: "about.module.login",
  render(root, ctx) {
    const { t, esc, $ } = YL.ui;
    const step = ctx.sub || "email";
    const next = ctx.query.next || "home";
    const email = ctx.query.email || "";
    const steps = (n) => `<div class="steps">${[1, 2, 3].map((i) => `<span class="${i <= n ? "is-done" : ""}"></span>`).join("")}</div>`;
    const head = `<img class="auth__logo" src="assets/logo.svg" alt=""><h1>${t("login.title")}</h1><p>${t("login.subtitle")}</p>`;

    if (YL.auth.isLoggedIn() && !YL.auth.needsProfile() && step !== "profile") { YL.router.navigate(next); return; }

    if (step === "email") {
      root.innerHTML = `<div class="auth">${head}<div class="card">${steps(1)}
        <form id="f-email" novalidate>
          <div class="field"><label for="email">${t("login.emailLabel")}</label>
            <input class="input" id="email" name="email" type="email" inputmode="email" autocomplete="email" placeholder="netid@yale.edu" value="${esc(email)}" required>
            <span class="field__error" id="email-err"></span>
            <span class="field__hint">${t("login.emailHint", { domains: YL_CONFIG.allowedEmailDomains.map((d) => "@" + d).join(" / ") })}</span></div>
          <button class="btn btn--primary btn--block" type="submit">${t("login.sendCode")}</button>
        </form>
        <div class="trust">🔒 <span>${t("login.trust")}</span></div></div>
        <p class="notice">${t("login.demoNotice")}</p></div>`;
      $("#f-email").onsubmit = async (e) => {
        e.preventDefault();
        const v = $("#email").value.trim();
        const err = $("#email-err");
        if (!YL.auth.isValidEmail(v)) { err.textContent = t("login.errInvalid"); return; }
        if (!YL.auth.isAllowedEmail(v)) { err.textContent = t("login.errDomain"); return; }
        const r = await YL.auth.requestCode(v);
        if (r.ok) { YL.ui.toast(t("login.codeSent"), "success"); YL.router.navigate(`login/code?email=${encodeURIComponent(v)}&next=${encodeURIComponent(next)}`); }
      };
      return;
    }

    if (step === "code") {
      root.innerHTML = `<div class="auth">${head}<div class="card">${steps(2)}
        <p class="muted">${t("login.codeSentTo", { email: `<strong>${esc(email)}</strong>` })}</p>
        <form id="f-code" novalidate>
          <div class="field"><label for="code">${t("login.codeLabel")}</label>
            <input class="input code-input" id="code" name="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" placeholder="••••••" required>
            <span class="field__error" id="code-err"></span></div>
          <div class="callout">${t("login.demoCode", { code: YL_CONFIG.demoVerificationCode })}</div>
          <div style="height:12px"></div>
          <button class="btn btn--primary btn--block" type="submit">${t("login.verify")}</button>
          <div style="height:8px"></div>
          <a class="btn btn--ghost btn--block" href="#/login?email=${encodeURIComponent(email)}&next=${encodeURIComponent(next)}">${t("login.changeEmail")}</a>
        </form></div></div>`;
      $("#code").focus();
      $("#f-code").onsubmit = async (e) => {
        e.preventDefault();
        const r = await YL.auth.verify(email, $("#code").value);
        if (!r.ok) { $("#code-err").textContent = r.reason === "code" ? t("login.errCode") : t("login.errDomain"); return; }
        YL.ui.toast(t("login.verified"), "success");
        YL.router.navigate(`login/profile?next=${encodeURIComponent(next)}`);
      };
      return;
    }

    if (step === "profile") {
      if (!YL.auth.isLoggedIn()) { YL.router.navigate("login"); return; }
      const u = YL.auth.user();
      const p = u.profile || {};
      const opt = (list, cur) => list.map((x) => `<option value="${esc(x.id)}" ${x.id === cur ? "selected" : ""}>${esc(YL.i18n.L(x.label || x.name))}</option>`).join("");
      const years = []; for (let y = new Date().getFullYear() + 5; y >= 1980; y--) years.push({ id: String(y), label: String(y) });
      root.innerHTML = `<div class="auth">${head}<div class="card">${steps(3)}
        <h3 style="margin-bottom:12px">${t("login.profileTitle")}</h3>
        <p class="muted small">${t("login.profileSub")}</p>
        <form id="f-profile">
          <div class="field"><label>${t("profile.name")}</label><input class="input" name="name" required value="${esc(p.name || "")}" placeholder="${t("profile.namePh")}"></div>
          <div class="form-row">
            <div class="field"><label>${t("profile.school")}</label><select class="select" name="school">${opt(YL.store.terms("schools"), p.school)}</select></div>
            <div class="field"><label>${t("profile.classYear")}</label><select class="select" name="classYear">${opt(years, p.classYear || "2026")}</select></div>
          </div>
          <div class="form-row">
            <div class="field"><label>${t("profile.region")}</label><select class="select" name="region">${opt(YL.store.get("regions"), p.region)}</select></div>
            <div class="field"><label>${t("profile.industry")}</label><select class="select" name="industry">${opt(YL.store.terms("industries"), p.industry)}</select></div>
          </div>
          <div class="field"><label>${t("profile.offers")}</label>
            <div class="checks">${YL.store.terms("offers").map((o) => `<label class="check"><input type="checkbox" name="offers" value="${o.id}" ${(p.offers || []).includes(o.id) ? "checked" : ""}>${o.emoji} ${esc(YL.i18n.L(o.label))}</label>`).join("")}</div>
            <span class="field__hint">${t("profile.offersHint")}</span></div>
          <div class="divider"></div>
          <div class="form-row">
            <div class="field"><label>${t("profile.acssyRole")}</label><select class="select" name="acssyRole"><option value="">${t("profile.acssy.none")}</option><option value="member" ${p.acssyRole === "member" ? "selected" : ""}>${t("profile.acssy.member")}</option><option value="lead" ${p.acssyRole === "lead" ? "selected" : ""}>${t("profile.acssy.lead")}</option></select></div>
            <div class="field"><label>${t("profile.department")}</label><select class="select" name="department">${YL_CONFIG.acssyDepartments.map((d) => `<option value="${d}" ${p.department === d ? "selected" : ""}>${t("dept." + d)}</option>`).join("")}</select></div>
          </div>
          <span class="field__hint" style="display:block;margin:-8px 0 16px">${t("profile.acssyHint")}</span>
          <button class="btn btn--primary btn--block" type="submit">${t("login.finish")}</button>
        </form></div></div>`;
      $("#f-profile").onsubmit = (e) => {
        e.preventDefault();
        const v = YL.ui.formValues(e.target);
        v.offers = [].concat(v.offers || []);
        YL.auth.completeProfile(v);
        YL.ui.toast(t("login.welcome", { name: v.name }), "success");
        YL.router.navigate(next);
      };
      return;
    }
    YL.router.navigate("login");
  }
});
