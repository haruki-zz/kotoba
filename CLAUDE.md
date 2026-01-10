# 架构记录（当前阶段）

## 目录骨架
```
.
├── index.html                 # Vite 入口，挂载渲染进程 React 应用
├── package.json               # npm 清单，Electron/Vite 脚本与 electron-builder 配置
├── eslint.config.js           # ESLint flat 配置，启用 TS/React/React Hooks 规则并对齐 Prettier
├── .prettierrc                # Prettier 风格配置（分号、双引号、行宽等）
├── .prettierignore            # Prettier 忽略列表，跳过构建产物与锁文件
├── tsconfig.json              # TypeScript 基线配置，启用严格模式与 React JSX
├── vite.config.ts             # Vite + vite-plugin-electron 配置，构建 main(ESM)/preload(CJS) 与 renderer
└── src
    ├── main
    │   └── index.ts           # Electron 主进程入口，创建窗口并加载渲染器
    ├── preload
    │   └── index.ts           # 预加载脚本占位，预留 contextBridge 暴露接口
    └── renderer
        ├── App.tsx            # 渲染端占位界面
        └── main.tsx           # React 入口，挂载根组件
```

## 角色与依赖
- **主进程**：`src/main/index.ts` 负责窗口生命周期与加载 dev/prod 资源，输出为 ESM，预设安全配置（禁用 NodeIntegration，启用 contextIsolation）。
- **预加载层**：`src/preload/index.ts` 保留空桥接点，采用 CJS 输出方便 contextBridge 注入，后续按需暴露受控 API。
- **渲染层**：`src/renderer/main.tsx` + `App.tsx` 组成最小 UI 占位，确保 Vite/HMR 路径正常。
- **构建工具链**：`vite.config.ts` 管理三端构建；`package.json` scripts 提供 `dev`、`build`、`build:desktop`，electron-builder 输出到 `release/`；`npm run lint`/`format` 依赖 ESLint + Prettier 统一风格。
