# Inter Daily

Inter Daily 是一个移动端优先的国际米兰球迷 PWA，定位是“比赛日控制台”而不是普通新闻流。

## 技术栈

- Next.js App Router
- TypeScript
- Tailwind CSS + CSS Variables
- TanStack Query
- Prisma
- PWA manifest + service worker

## 已实现

- 深色优先、360px-430px 优先的移动端 UI
- 5 Tab 信息架构：首页 / 赛程 / Live / 新闻 / 我的
- 组件化的比赛卡片、积分卡、新闻列表、Live 面板、记忆模块
- 稳定内部 API schema
- football-data.org provider 接入与回退逻辑
- Inter 官网新闻抓取与正文解析
- 本地偏好、私有评分、私有球迷反应
- Web Push 订阅与发送端骨架
- Prisma 数据模型与内容仓库
- Vercel cron 配置
- 内置 seed/mock 数据与缓存回退

## 本地运行

```bash
pnpm install
cp .env.example .env.local
pnpm dev
```

## 校验

```bash
pnpm lint
pnpm typecheck
pnpm build
```

## 部署说明

这套代码在缺少第三方 key 时也能用内置 seed/mock 数据完整运行，因此可以直接部署到预览环境。
配置 `SPORTS_API_KEY / DATABASE_URL / REDIS_URL / VAPID` 后，会自动切换到更接近生产的同步模式。
