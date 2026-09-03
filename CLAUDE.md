# YaleLink — 给 AI 辅助贡献者的项目约定

## 项目是什么
耶鲁校友社群开源平台的**静态原型**：纯 HTML/CSS/原生 JS，零依赖、零构建，`web/` 即部署根目录。
对外是校友社群平台（职业 / 活动 / 社群 / 创业 / 生活 / 目录），对内是 ACSSY 学联后台（看板 / SOP / 联系人 / 模板 / 志愿者）。

## 硬性约束
- 不引入 npm 运行时依赖、打包器、框架；不引用境外 CDN（要在中国大陆可访问）。
- 所有可见文案走 `YL.ui.t(key)`，数据中的文案字段是 `{zh, en}` 并用 `YL.ui.L()` 取值；两份词典 key 必须一致。
- 所有插入 HTML 的动态内容必须 `esc()`。
- 数据文件在 `web/data/*.json`，每条有唯一 `id`；新增集合要在 `web/config.js` 的 `dataFiles` 登记。
- 一个功能 = 一个 `web/js/modules/<id>.js`，通过 `registerModule()` 注册；在 `index.html` 加一行 `<script>`。

## 目录速查
- `web/js/core/`：i18n、router（hash）、store（seed JSON + localStorage overlay，支持 add/patch）、auth（邮箱白名单、学联身份）、registry、ui。
- `web/js/modules/`：login、home、careers、events、circles、acssy、startup、life、directory、profile、about。
- `web/data/`：regions、taxonomy、users、posts、jobs、timelines、groups、events、resources、projects、circles、playbooks、campaigns、contacts、templates。
- `docs/`：vision、modules、architecture、data-model、roadmap、deploy-china。

## 验证
```bash
node scripts/validate-data.mjs          # JSON 结构、id 唯一、双语齐全、词典一致
cd web && python3 -m http.server 8000   # 本地预览
npx playwright test                     # tests/smoke.spec.js（需要 @playwright/test）
```

## 演示约定
- 登录：任意 `@yale.edu` / `@aya.yale.edu`，验证码见 `config.js`（默认 000000）。
- 用户在演示中创建的内容作者 id 为 `"me"`，`YL.store.user("me")` 会从会话合成。
- 示例数据全部虚构，不要加入真实联系人。
