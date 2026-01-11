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
    │   ├── ai                     # 主进程 AI 适配层，封装 OpenAI/Gemini/Mock 提供统一生成接口
    │   │   ├── index.ts           # buildAiProvider 入口，根据配置选择具体 provider
    │   │   ├── openai.ts          # OpenAI 提供商实现，使用 chat completions 输出 JSON 卡片
    │   │   ├── gemini.ts          # Gemini 提供商实现，使用 Gemini Flash 2.5 Lite 生成 JSON 卡片
    │   │   ├── mock.ts            # 本地 mock provider，开发/无密钥场景下返回固定内容
    │   │   ├── prompt.ts          # 统一的生成提示文案
    │   │   ├── types.ts           # provider 与生成结果类型定义
    │   │   └── utils.ts           # term 校验、超时控制与返回字段解析
    │   ├── ipc                    # 主进程 IPC 层，集中注册/校验/调度
    │   │   ├── handlers.ts        # IPC 频道处理器，校验入参并调度存储/AI/SM-2
    │   │   ├── index.ts           # 注册/卸载 ipcMain handlers，便于测试注入
    │   │   └── provider.ts        # 管理 AI provider 配置与实例，隐藏密钥，仅暴露状态
    │   ├── index.ts           # Electron 主进程入口，创建窗口并加载渲染器
    │   └── storage            # 主进程存储层，管理本地 JSON
    │       ├── index.ts       # DataStore 入口，词条增删改/SM-2 评分更新与活跃度累积
    │       ├── json.ts        # JSON 读写与原子写入（临时文件+rename）
    │       ├── paths.ts       # 默认数据目录与文件路径解析
    │       ├── words.ts       # 词条草稿/更新补全与校验
    │       ├── activity.ts    # 活跃度递增、streak 计算与汇总
    │       ├── transfer.ts    # 导入/导出解析与合并，生成 CSV
    │       └── types.ts       # 存储层专用类型
    ├── preload
    │   └── index.ts           # 预加载脚本，按 IPC 合同暴露受控 renderer API
    ├── shared
    │   ├── index.ts           # 统一导出共享类型、校验与 SM-2 算法
    │   ├── ai.ts              # 跨端共享的 provider/词卡字段与配置状态类型
    │   ├── ipc.ts             # IPC 频道名、请求/响应契约与 renderer API 类型
    │   ├── data-transfer.ts   # 导入/导出请求与结果类型
    │   ├── sm2.ts             # SM-2 默认状态、更新函数与复习队列排序
    │   ├── types.ts           # 词条、活跃度、复习日志等共享类型定义（含草稿/更新/汇总）
    │   └── validation.ts      # JSON 校验与默认补全（词条、SM-2、活跃度）
    ├── __test__
    │   ├── sm2.test.ts        # 覆盖 SM-2 计算与队列排序的 Vitest 用例
    │   ├── validation.test.ts # 覆盖词条/活跃度校验与默认补全的 Vitest 用例
    │   ├── ai-providers.test.ts# 覆盖 OpenAI/Gemini/mock provider 的超时与解析逻辑
    │   ├── storage.test.ts    # 基于临时目录的存储层单测，验证原子写入与活跃度累积
    │   └── ipc.test.ts        # IPC 处理与 provider 管理的入参校验、频道注册覆盖
    └── renderer
        ├── App.tsx            # 渲染端占位界面
        ├── electron-api.d.ts  # 声明 window.electronAPI 类型，限制渲染层可用接口
        └── main.tsx           # React 入口，挂载根组件
```

## 角色与依赖
- **主进程**：`src/main/index.ts` 负责窗口生命周期与加载 dev/prod 资源，并注册 IPC handlers，输出为 ESM，预设安全配置（禁用 NodeIntegration，启用 contextIsolation）。
- **存储层**：`src/main/storage` 封装本地 JSON 读写与原子写入，`index.ts` 暴露 DataStore 以处理词条增删改、SM-2 评分更新、活跃度递增与数据导入/导出；`activity.ts` 负责 streak 计算，`transfer.ts` 解析外部 words/activity 文件、按 term 去重合并并生成 CSV。
- **IPC 桥接**：`src/main/ipc` 将 DataStore、SM-2 与 AI provider 组合成受控频道，校验导入/导出路径与参数；`provider.ts` 管理密钥与超时；`src/preload/index.ts` 仅通过 contextBridge 暴露声明在 `shared/ipc.ts` 的白名单 API，渲染层无直接 Node 能力。
- **共享逻辑**：`src/shared` 提供词条/活跃度类型（含草稿、更新与汇总）、导入/导出契约、SM-2 状态默认值与更新算法、AI/IPC 契约、JSON 校验与补全，供主/渲染进程复用。
- **测试**：`src/__test__` 中的 Vitest 用例覆盖 SM-2 计算、复习队列排序、数据校验、AI provider、存储层导入导出与 IPC 入口，确保算法与通道契约稳定。
- **AI 适配层**：`src/main/ai` 封装 OpenAI/Gemini/Mock 三种 provider，统一生成词卡字段，内置提示文案、字段解析与超时控制，由 IPC/Preload 间接暴露。
- **渲染层**：`src/renderer/main.tsx` + `App.tsx` 组成最小 UI 占位，并通过 `electron-api.d.ts` 绑定可用的 electronAPI 类型，确保 Vite/HMR 路径正常。
- **构建工具链**：`vite.config.ts` 管理三端构建；`package.json` scripts 提供 `dev`、`build`、`build:desktop`，electron-builder 输出到 `release/`；`npm run lint`/`format` 依赖 ESLint + Prettier 统一风格。
