/* 模块注册表 — 新功能只需 registerModule({...})，导航与"关于"页会自动出现
   Module registry — a new feature only needs registerModule({...}); nav & About page update automatically.

   registerModule({
     id: "events",                 // 唯一 id，也是路由第一段  #/events/...
     nav: { icon: "📅", labelKey: "nav.events", order: 30, mobile: true, when: () => true },  // 省略 nav 则不出现在导航；when() 控制可见性
     requiresAuth: true,           // 未登录访问时跳到登录页
     descriptionKey: "about.module.events",  // 用于"关于"页的模块列表
     render(root, ctx) {}          // ctx = { segments, sub, id, query, path }
   })
*/
window.YL = window.YL || {};
YL.registry = (function () {
  const modules = [];
  function register(m) {
    if (!m || !m.id || typeof m.render !== "function") throw new Error("registerModule: id and render() are required");
    if (modules.some((x) => x.id === m.id)) throw new Error("registerModule: duplicate id " + m.id);
    modules.push(m);
    return m;
  }
  function get(id) { return modules.find((m) => m.id === id); }
  function all() { return modules.slice(); }
  function navItems(opts) {
    const mobile = opts && opts.mobile;
    return modules
      .filter((m) => m.nav && (!mobile || m.nav.mobile) && (!m.nav.when || m.nav.when()))
      .sort((a, b) => (a.nav.order || 999) - (b.nav.order || 999));
  }
  return { register, get, all, navItems };
})();
window.registerModule = YL.registry.register;
