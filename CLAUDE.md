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
    │   ├── index.ts           # Electron 主进程入口，创建窗口并加载渲染器
    │   └── storage            # 主进程存储层，管理本地 JSON
    │       ├── index.ts       # DataStore 入口，词条增删改/SM-2 评分更新与活跃度累积
    │       ├── json.ts        # JSON 读写与原子写入（临时文件+rename）
    │       ├── paths.ts       # 默认数据目录与文件路径解析
    │       ├── words.ts       # 词条草稿/更新补全与校验
    │       ├── activity.ts    # 活跃度递增、streak 计算与汇总
    │       └── types.ts       # 存储层专用类型
    ├── preload
    │   └── index.ts           # 预加载脚本占位，预留 contextBridge 暴露接口
    ├── shared
    │   ├── index.ts           # 统一导出共享类型、校验与 SM-2 算法
    │   ├── sm2.ts             # SM-2 默认状态、更新函数与复习队列排序
    │   ├── types.ts           # 词条、活跃度、复习日志等共享类型定义
    │   └── validation.ts      # JSON 校验与默认补全（词条、SM-2、活跃度）
    ├── __test__
    │   ├── sm2.test.ts        # 覆盖 SM-2 计算与队列排序的 Vitest 用例
    │   ├── validation.test.ts # 覆盖词条/活跃度校验与默认补全的 Vitest 用例
    │   └── storage.test.ts    # 基于临时目录的存储层单测，验证原子写入与活跃度累积
    └── renderer
        ├── App.tsx            # 渲染端占位界面
        └── main.tsx           # React 入口，挂载根组件
```

## 角色与依赖
- **主进程**：`src/main/index.ts` 负责窗口生命周期与加载 dev/prod 资源，输出为 ESM，预设安全配置（禁用 NodeIntegration，启用 contextIsolation）。
- **存储层**：`src/main/storage` 封装本地 JSON 读写与原子写入，`index.ts` 暴露 DataStore 以处理词条增删改、SM-2 评分更新与活跃度递增，`activity.ts` 负责 streak 计算。
- **预加载层**：`src/preload/index.ts` 保留空桥接点，采用 CJS 输出方便 contextBridge 注入，后续按需暴露受控 API。
- **共享逻辑**：`src/shared` 提供词条/活跃度类型、SM-2 状态默认值与更新算法、JSON 校验与补全，供主/渲染进程复用。
- **测试**：`src/__test__` 中的 Vitest 用例覆盖 SM-2 计算、复习队列排序与数据校验，确保算法与默认值稳定。
- **渲染层**：`src/renderer/main.tsx` + `App.tsx` 组成最小 UI 占位，确保 Vite/HMR 路径正常。
- **构建工具链**：`vite.config.ts` 管理三端构建；`package.json` scripts 提供 `dev`、`build`、`build:desktop`，electron-builder 输出到 `release/`；`npm run lint`/`format` 依赖 ESLint + Prettier 统一风格。
