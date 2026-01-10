# 架构概览

## 当前目录结构与职责
- `package.json`: npm 清单，设定 ES module、私有包标记与占位 lint/test 脚本，为后续 Electron/Vite 配置提供基线。
- `package-lock.json`: 锁定依赖版本，确保安装结果可复现。
- `.gitignore`: 忽略 `node_modules`、打包产物与本地环境变量，保持仓库整洁与密钥安全。
- `.env.local`: 本地密钥占位文件（OpenAI/Google），避免后续读取缺失变量时报错，实际值不入库。
- `prompts/`: 约束开发流程的全局提示集合（coding-principles、system-prompt），变更行为需遵循此处规则。
- `memory-bank/`: 项目设计与进度文档中心（设计文档、技术栈、实施计划、架构说明、UI 设计、进度记录）。
- `AGENTS.md`: 代码助手的操作规范与技能列表。

## 当前架构要点
- 环境基线已建立，可直接 `npm install`/`npm run lint`（占位）验证工具链；后续 Electron/Vite/ESLint 将基于该 npm 配置扩展。
- 密钥与依赖隔离：通过 `.env.local` 与 `.gitignore` 避免敏感信息入库，锁文件保证团队一致性。
- 文档优先：prompts 与 memory-bank 构成规则与设计的单一可信来源，后续模块与代码需按其约束演进。
