# 架构 / Architecture

## 原型架构（v0.1）

```
浏览器
 ├─ index.html          单页壳（顶栏 / 侧栏 / 主区 / 底栏）
 ├─ config.js           部署配置（邮箱白名单、演示码、数据清单、学联部门）
 ├─ js/core
 │   ├─ i18n.js         词典加载、t()、L()、语言切换事件
 │   ├─ registry.js     模块注册表 → 导航自动生成
 │   ├─ router.js       hash 路由、鉴权守卫、首次资料守卫
 │   ├─ store.js        seed JSON + localStorage overlay（add / patch / 用户状态）
 │   ├─ auth.js         邮箱域名白名单、验证码、会话、学联身份
 │   └─ ui.js           转义、组件片段、toast、modal、日期
 ├─ js/modules/*.js     每个功能一个文件
 ├─ data/*.json         内容（双语字段 {zh, en}）
 └─ i18n/{zh,en}.json   界面词典
```

### 关键机制

- **模块注册表**：模块自描述（路由、导航、是否需登录、可见性谓词、说明 key），壳层不需要知道任何模块。
- **数据层**：`YL.store.get(collection)` 返回 seed + 本地新增（`add`）+ 本地修改（`patch`）合并后的数组；用户状态（报名、加入、点赞、认领志愿者等）用 `getState / toggleState(ns, id)`。演示中所有写入只在本机浏览器。
- **鉴权**：`auth.js` 是唯一信任边界。会话存 localStorage：`{ email, kind: student|alumni, profile }`。`profile.acssyRole` 决定学联后台可见性。
- **双语**：界面文案 `t(key, vars)`；数据字段 `L({zh, en})`；缺失回退到另一种语言；校验脚本保证两份词典 key 一致。
- **路由守卫**：`requiresAuth` → 跳登录并携带 `next`；已登录但未填资料 → 跳资料页。
- **国内可达**：无境外 CDN、无 Web 字体、无第三方脚本，纯静态。

## 演进路径（v0.2+）

```
前端（本仓库 web/，可原样保留）
   │  fetch /api/*
后端 API（建议 FastAPI 或 Node/Hono，单体即可）
   ├─ /auth/request-code  发邮件验证码（域名白名单在服务端再校验一次）
   ├─ /auth/verify        签发 session / JWT
   ├─ /users, /posts, /jobs, /events, /circles, /campaigns, /playbooks, /contacts, /templates
   ├─ 权限：登录用户 / 学联成员 / 学联负责人 / 管理员
   └─ 通知：站内 + 邮件（+ 微信模板消息，见 deploy-china.md）
数据库：Postgres（国内可用阿里云 RDS / 腾讯云 TencentDB）
对象存储：图片、SOP 材料（OSS / COS）
```

**替换点只有两个文件**：

1. `auth.js`：`requestCode / verify / completeProfile / logout` 改为调 API；
2. `store.js`：`load` 改为按需请求；`add / patch / setState` 改为 POST / PATCH。

模块层不需要改动——这是把"演示写入"抽象成 `store` 的原因。

### 数据模型即 API 契约

`docs/data-model.md` 列出的实体与字段就是未来 API 的资源与 JSON 形状。`web/data/*.json` 是它们的示例实例，`scripts/validate-data.mjs` 是最简的 schema 校验。

### 权限矩阵（真实版）

| 资源 | 游客 | 已验证用户 | 学联成员 | 学联负责人 | 管理员 |
|---|---|---|---|---|---|
| 首页公开内容、关于 | 读 | 读 | 读 | 读 | 读 |
| 帖子 / 岗位 / 活动 / 社群 / 指南 | — | 读写自己的 | 同左 | 同左 | 全部 |
| 校友目录 | — | 读 | 读 | 读 | 全部 |
| 学联后台（看板 / SOP / 联系人 / 模板） | — | — | 读；认领与反馈任务 | 分配任务、发通知、编辑 SOP | 全部 |
| 学联身份审核 | — | 申请 | — | 审核本部门 | 全部 |

### 安全要点

- 服务端再次校验邮箱域名；验证码限频、5 分钟有效、一次性。
- 所有用户输入服务端转义 / 富文本白名单；前端已 `esc()`。
- 联系人库不入公开仓库；生产数据库加密备份；导出需负责人权限并留痕。
- 隐私：目录可见性、联系方式交换需双方同意；提供注销与数据删除。
