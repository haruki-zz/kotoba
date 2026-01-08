# 技术栈（简单且健壮）

- 桌面框架：Electron 27+（主进程/IPC）、Vite 5 + React 18 + TypeScript 5（渲染进程，ESM），Node 18+ 内置 fetch/crypto；项目基线采用 electron-vite 脚手架。
- 构建与打包：Vite 处理 preload/renderer；electron-builder 生成 macOS dmg/zip 与 Windows nsis/portable。
- 路由与状态：React Router 6（页面切换），Zustand 轻量全局状态（复习队列/设定/缓存），必要时使用持久化中间件；避免 redux 级别重量。
- 样式与主题：Tailwind CSS（自定义主题变量/字体/间距），必要处可结合少量 CSS Modules；PostCSS 处理嵌套/变量；`clsx` 辅助动态类；当前使用内置 `Noto Serif JP` 作为主要日文字体替代游明朝/教科書体；图标采用 Feather/Remix 线框。
- 数据与存储：主进程使用 `fs/promises` 读写 `words.jsonl`/`sessions.jsonl`/`activity.json`，路径使用 `app.getPath('userData')`；ID 用 `crypto.randomUUID`；日期处理用 `date-fns` 做 UTC/本地日转换。
- 业务算法：SM-2 复习逻辑与活跃度聚合自实现（无额外算法库）保持可控和轻量，评分档位限定为 easy/medium/hard（质量分 5/3/1，`hard` 重置、`medium/easy` 按公式更新且 `ef` 下限 1.3）。
- AI 接入：主进程使用官方 SDK 调用（OpenAI: `openai`；Google: `@google/genai`），Provider Router 默认使用 Google，超时 15–30 秒且 1 次重试，失败且双 provider 均有 key 时自动切换到 OpenAI；无任何 key 时阻断生成并提示手动录入；Provider 抽象后由渲染进程通过 IPC 调用。
- 测试与质量：Vitest + @testing-library/react 做单元/组件测试，ESLint + Prettier 保持风格一致；本地开发与 CI 可通过环境变量注入 API key 便于测试。
