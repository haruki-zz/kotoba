# 架构快照（脚手架）

## 目录树
```
. 
├─ electron/               # 主进程与 preload
│  ├─ main.ts              # 创建 BrowserWindow，加载 dev/prod，透传启动消息
│  ├─ preload.ts           # contextBridge 暴露 ipcRenderer
│  └─ electron-env.d.ts    # 主进程/预加载环境与 Window 类型
├─ src/                    # 渲染进程 React
│  ├─ main.tsx             # React 入口，挂载 App
│  ├─ App.tsx              # 示例计数器 UI
│  ├─ App.css / index.css  # 基础样式
│  ├─ __test__/            # 测试目录，所有 *.test.ts(x) 统一放置
│  │  └─ App.test.tsx      # 示例渲染测试
│  ├─ assets/              # 静态资源 (react.svg)
│  └─ setupTests.ts        # jest-dom 注入
├─ public/                 # 静态图标 (electron-vite.*)
├─ memory-bank/            # 产品/设计/计划/进度文档
├─ vite.config.ts          # Vite + electron 插件、Vitest 配置
├─ tsconfig*.json          # TS 编译选项 (含 electron、Node 类型)
├─ package.json            # 脚本与依赖，主入口 dist-electron/main.js
├─ electron-builder.json5  # 打包目标与元数据
├─ .eslintrc.cjs           # ESLint 规则 (TS/React/Prettier)
├─ prettier.config.cjs     # 格式化规则
└─ .gitignore              # 忽略构建产物/IDE/系统文件
```

## 职责边界
- Main 侧（electron/）：负责窗口生命周期与 IPC 桥接；不直接承载业务 UI。
- Renderer 侧（src/）：当前为占位 UI，后续按 features/components/hooks 分组实现业务。
- 构建层（vite.config.ts、tsconfig*、package.json、electron-builder.json5）：确保 main/preload/render 同步构建与打包。
- 规范层（.eslintrc.cjs、prettier.config.cjs、.gitignore）：统一代码风格与输出路径约束。
- 文档层（memory-bank/）：锁定产品范围、设计规范与实施步骤，进度持续更新。
