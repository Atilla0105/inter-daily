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
- 5 Tab 信息架构：首页 / 赛程 / 球队 / 新闻 / 我的
- 组件化的比赛卡片、积分卡、新闻列表、球队镜像流、记忆模块
- 稳定内部 API schema
- football-data.org provider 接入与回退逻辑
- Inter 官网新闻抓取与正文解析
- Apify 驱动的 Instagram 社媒镜像骨架，前端仅消费 `/api/social`
- 社媒缩略图与媒体资源通过站内代理返回，避免在客户端暴露外部资源地址
- 本地偏好、私有评分、私有球迷反应
- Web Push 订阅与发送端骨架
- Prisma 数据模型与内容仓库
- Vercel cron 配置（Hobby 账户保持每日 1 次；页面访问与缓存 TTL 会在 2-6 小时窗口内触发社媒刷新）
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
配置 `SPORTS_API_KEY / APIFY_TOKEN / DATABASE_URL / REDIS_URL / VAPID` 后，会自动切换到更接近生产的同步模式。
