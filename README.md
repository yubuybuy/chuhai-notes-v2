# 出海手记 v2 — Astro 前端 + Sanity CMS + Vercel（精简版重建）

旧站（Astro 静态 + Markdown 在 GitHub + Cloudflare Pages）构建已卡住，
新站保持 Astro 前端与原设计不变，内容搬进 Sanity，托管改 Vercel。
**旧站不动、未推送、未上线**：本目录只是本地工程，切换上线需用户按下面
步骤操作。

## 目录结构

| 位置 | 说明 |
| --- | --- |
| `src/pages/`、`src/layouts/`、`src/components/`、`src/styles/` | 旧站主题原样复用（astro-paper），路由不变：`/blog/<slug>/`、`/blog/deals/<slug>/`、`/deals/`、首页、RSS、sitemap、搜索、标签、归档 |
| `src/sanity/schemaTypes/` | Sanity 文档模型：`deal`、`guide`，另有 `tableBlock`、`codeBlock`（正文里的表格/代码块） |
| `sanity.config.ts` | Sanity Studio 配置（Sanity 托管，不嵌进站内 `/studio`） |
| `src/lib/sanity.ts` | GROQ 查询（构建时拉取已发布内容，`useCdn: false`） |
| `src/lib/content.ts` | 唯一数据层：有 Sanity 凭据走 Sanity，无凭据走 `src/data/*.json` 兜底；可见性规则沿用旧站（deal 须 `ready` + `dealValidUntil` 未过期） |
| `src/lib/portable-text.ts` | Portable Text 渲染组件（表格、代码块、图片） |
| `src/data/deals.json`、`guides.json`、`about.json` | 本地兜底数据（迁移脚本生成，无凭据也能构建） |
| `scripts/migrate-to-sanity.mjs` | Markdown → Sanity 文档 JSON 迁移脚本 |
| `migration/` | 迁移产物：每篇文章一个 JSON + `validation-report.json` |
| `_source/` | 旧站源码只读快照（来自 `yubuybuy/chuhai-notes` main `a593bbab`），仅供对照，不参与构建 |

## 本地构建（无凭据也能跑）

```bash
npm install
npm run build        # 输出 dist/；无 PUBLIC_SANITY_PROJECT_ID 时走本地兜底并打印警告
npm run preview      # 本地预览 dist
npm run dev          # 开发模式
```

构建后自动跑 Pagefind 索引（`postbuild`），搜索页可用。

## 上线步骤（用户操作，共 4 步）

### 1. 建 Sanity 项目并导入内容

1. 打开 https://www.sanity.io/ 注册/登录，建项目（Free 档即可），记下
   **Project ID**，dataset 用 `production`。
2. 在本目录执行导入（需先 `npm install`；导入命令不写 token 进文件，
   用环境变量传）：
   ```bash
   export SANITY_PROJECT_ID=<你的 Project ID>
   export SANITY_DATASET=production
   export SANITY_AUTH_TOKEN=<在 manage.sanity.io → API → Tokens 新建的写入 token>
   npm run migrate        # 先生成/校验 migration/*.json（已生成好，可直接用）
   npx sanity dataset import migration/deal-*.json production --replace
   npx sanity dataset import migration/guide-*.json production --replace
   ```
   也可以在 Studio 里手动建文档；JSON 里的 `_id`（如 `deal-epic-knightica-free`）
   与 `slug` 保持旧站 URL 对应，不要改。
3. 部署 Studio（写文章的后台）：
   ```bash
   export SANITY_STUDIO_PROJECT_ID=<Project ID>
   export SANITY_STUDIO_DATASET=production
   npx sanity deploy
   ```
   得到 `https://<项目名>.sanity.studio`，以后在那里写/改/发布文章。
   草稿不发布就不会上线；发布后需触发 Vercel 重新构建才生效（见第 3 步末尾）。

### 2. 建 Vercel 项目

1. 把本目录推到一个**新 GitHub 仓库**（建议新建 `chuhai-notes-v2`，
   不要直接覆盖旧仓库，等切换完成、验证通过后再决定旧仓库去留）。
2. 在 https://vercel.com/ 用该仓库新建项目，Framework 选 Astro
   （`vercel.json` 已写好构建命令 `npm run build`、输出 `dist`）。
3. 在 Vercel 项目 Settings → Environment Variables 里填（Production + Preview 都填）：
   - `PUBLIC_SANITY_PROJECT_ID` = 第 1 步的 Project ID
   - `PUBLIC_SANITY_DATASET` = `production`
   - `SANITY_API_VERSION` = `2026-03-01`
   - `SITE_URL` = `https://chuhai.openoio.com`
   - `SANITY_API_TOKEN`：**不需要**。本站只读已发布内容，无 token 也能构建；
     只有需要读草稿/预览时才填，且绝不能加 `PUBLIC_` 前缀。
4. 部署一次，确认构建成功。

### 3. 绑定域名 + 发布自动触发

1. 域名：在 Vercel 项目 Settings → Domains 加 `chuhai.openoio.com`；
   到 Cloudflare DNS 把 `chuhai` 这条记录改指 Vercel 给的地址
   （DNS 仍在 Cloudflare，只改这一条记录；`openoio.com` 其他记录不动）。
   **先不要动旧站**：等 Vercel 上的新站验证通过后，再改这条 DNS；
   改之前旧站照常在线。
2. 发布自动触发（否则在 Sanity 点了发布，线上站不会变）：
   - Vercel 项目 Settings → Git → Deploy Hooks，新建一个 Hook（名字如
     `sanity-publish`，分支 main），复制它的 URL（**当密码看待，别提交进仓库**）。
   - 打开 https://www.sanity.io/manage → 你的项目 → API → Webhooks，
     新建 Webhook：POST 到上面那个 Deploy Hook URL；触发事件选
     Create + Update + Delete；数据集 `production`；GROQ 过滤填：
     `!(_id in path("drafts.**")) && _type in ["deal", "guide"]`
     （避免每次自动保存都触发一次构建）。
   - 之后在 Studio 发布/修改/删除文章，约 1–2 分钟后线上自动更新。

### 4. 验证旧链接

逐个打开确认（与旧站 URL 一致，无需重定向）：
- 首页 https://chuhai.openoio.com/
- 优惠列表 https://chuhai.openoio.com/deals/
- 指南：`/blog/us-apple-id-guide/`、`/blog/hk-bank-card-guide/`、
  `/blog/airport-recommendation/`、`/blog/proxy-tools/`、`/blog/vps-recommendation/`
- 优惠：`/blog/deals/epic-knightica-free/`（注意：Knightica 的
  `dealValidUntil` 是 2026-11-19T16:00:00Z，过期后自动隐藏，需重新核实才能再显示）
- RSS：`/rss.xml`；sitemap：`/sitemap-index.xml`；搜索页：`/search/`

## 内容规则（沿用旧站，不可绕过）

- deal 可见条件：`dealStatus === ready` 且 `dealValidUntil` 存在且未过期。
  **ERNIE 文章目前不可见**：`dealStatus` 是 ready 但 `dealValidUntil` 为空，
  且 `unknowns` 有 2 条（未实际调用、免费档限速未确认），按旧站 deal-policy
  应为 `blocked`。上线前由用户决定：改回 `blocked`，或重新核实后补上有效期。
- 咪咕文章是 `blocked`（无官方活动页、用户手动发布），同样不可见；
  不要对它跑旧站的 `publish-deals.mjs`（会覆盖正文并改回草稿）。
- 以下 3 篇草稿 deal（Perch / 八达通 / GMH）未迁移为可见内容，只在
  `migration/` 里留档；要上线的先在 Studio 里核实后改状态。

## 已知未验证项

- Sanity 导入未实际跑过（没有用户的 Sanity 项目和 token），`migration/*.json`
  只在本地校验通过（11 篇、0 错误、2 警告，均为 ERNIE）。
- Vercel 构建未实际跑过（没有用户的 Vercel 项目）；本地 `npm run build` 通过。
- 旧站 Cloudflare Pages 构建卡住的问题与本工程无关，旧站保持原样在线，
  直到用户确认切换。
- Portable Text 渲染：表格/代码块按 `tableBlock`/`codeBlock` 处理，
  上线后请逐篇点开核对一次版式（尤其是港卡指南的 3 张表格）。
- 标题锚点 ID 由正文 h2/h3 文本生成，与旧站 rehype 规则可能有细微差别，
  不影响正文，只影响 `#` 跳转链接。
