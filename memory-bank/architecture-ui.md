# Kotoba UI 优化迭代架构说明

## 1. 文档定位
- 本文件仅描述 UI 优化迭代相关的渲染层结构、职责边界与后续修改原则。
- 它是对主架构文档 [architecture.md](/Users/haruki/workspace/kotoba/memory-bank/architecture.md) 的补充，不替代主架构说明。
- 当任务目标是“保持功能不变，仅优化 UI”时，应优先参考本文件。

## 2. UI 迭代边界
### 2.1 允许改动的范围
- `src/renderer/**`
- 重点包括：
  - `components/layout`
  - `components/shared`
  - `components/ui`
  - `features/*/*_page.tsx`
  - `style.css`

### 2.2 默认不改动的范围
- `src/main/**`
- `src/preload/**`
- `src/shared/ipc.ts`
- `src/shared/domain_schema.ts`
- 测试中与业务语义强绑定的契约部分

### 2.3 修改原则
- 以视觉和交互重构为主，不引入业务行为变化。
- 不改变页面主职责，不重排现有产品信息架构。
- 若 UI 变更需要影响状态流或 IPC 数据结构，应先明确说明其已超出本专项边界。

## 3. 当前渲染层 UI 结构
### 3.1 顶层入口
- [app.tsx](/Users/haruki/workspace/kotoba/src/renderer/app.tsx)
  - 持有当前页面切换状态
  - 读取启动通知
  - 将页面元信息注入壳层
  - 装配五个 feature 入口

### 3.2 应用壳层
- [app_shell.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/app_shell.tsx)
  - 负责整体画布背景
  - 负责左右两栏布局
  - 承载导航、顶部标题区与主内容区
- [app_navigation.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/app_navigation.tsx)
  - 负责左侧固定导航
  - 当前使用图标 + 标题 + 激活圆点的导航表达
  - 不承载业务逻辑，仅触发页面切换
- [page_header.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/page_header.tsx)
  - 负责页面标题、说明与顶部摘要卡
  - 用于维持跨页面一致的“编辑型工作台”气质

## 4. 视觉系统组成
### 4.1 全局主题
- [style.css](/Users/haruki/workspace/kotoba/src/renderer/style.css)
  - 维护字体、颜色 token、圆角、背景和基础 reset
  - 当前主题融合：
    - `stitch_ui/kotoba_zen`
    - `stitch_ui/kotoba_kinetic`
  - 当前主视觉特征：
    - 绿色系渐变背景
    - 玻璃感卡片
    - 高圆角
    - 柔和环境阴影
    - `Manrope + Noto Sans JP`

### 4.2 基础控件层
- `components/ui`
  - [button.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/button.tsx)
  - [card.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/card.tsx)
  - [badge.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/badge.tsx)
  - [input.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/input.tsx)
  - [textarea.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/textarea.tsx)
  - [alert.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/alert.tsx)
- 原则：
  - 基础控件负责统一气质，不内嵌页面语义
  - 页面差异应通过 feature 组合实现，而不是在基元里堆特例

### 4.3 共享状态组件层
- `components/shared`
  - [status_message.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/status_message.tsx)
  - [loading_state.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/loading_state.tsx)
  - [empty_state.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/empty_state.tsx)
  - [confirm_dialog.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/confirm_dialog.tsx)
- 原则：
  - 状态组件负责全局统一反馈语言
  - 新页面不应重复手写加载态、空态、错误态容器

## 5. 页面级 feature 结构
### 5.1 页面组织方式
- 每个页面由 `*_feature.tsx` 管理数据与状态。
- 每个页面由 `*_page.tsx` 负责主要视图结构。
- UI-only 迭代优先改 `*_page.tsx`，只有在确有必要时才动 `*_feature.tsx`。

### 5.2 当前页面职责
- [activity_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/activity/activity_page.tsx)
  - 仪表盘摘要
  - 热力图展示
  - 记忆等级构成
- [library_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/library/library_page.tsx)
  - 搜索入口
  - 统计卡
  - 单语卡片浏览态 / 编辑态
  - 删除确认入口
- [review_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/review/review_page.tsx)
  - 复习摘要
  - 大幅复习卡片
  - 评分动作入口
- [settings_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/settings/settings_page.tsx)
  - 连接配置摘要
  - 生成参数编辑
  - API Key 管理
- [word_add_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/word_add/word_add_page.tsx)
  - 单词输入
  - AI 生成结果编辑
  - 生成 / 保存动作

## 6. UI 迭代时的推荐改法
### 6.1 优先顺序
1. 优先修改 `*_page.tsx` 的布局与信息层级。
2. 其次修改 `components/shared` 统一状态表达。
3. 最后才修改 `components/ui` 的基础 token 与基元行为。

### 6.2 何时不该动基础组件
- 当问题只属于某一个页面的视觉布局时，不应通过改 `Button`、`Card`、`Input` 来“全局修”。
- 当页面有明显个性需求时，应在页面里组合 utility class，而不是污染基元。

### 6.3 允许的迭代类型
- 字体层级与留白调整
- 卡片排版与节奏调整
- 色块、渐变、背景、阴影优化
- 状态提示与反馈组件统一
- 按钮优先级和动作分组优化
- 页面在桌面窄宽度下的自适应优化

### 6.4 应谨慎处理的改动
- 会影响 DOM 语义与测试查询方式的结构调整
- 会改变页面装配顺序的导航重构
- 会改变默认页面、主动作路径或字段显示语义的设计更改

## 7. 参考来源
- 原型文件位于：
  - `/Users/haruki/workspace/kotoba/stitch_ui/`
- 关键设计说明：
  - [DESIGN.md](/Users/haruki/workspace/kotoba/stitch_ui/kotoba_zen/DESIGN.md)
  - [DESIGN.md](/Users/haruki/workspace/kotoba/stitch_ui/kotoba_kinetic/DESIGN.md)
- 现阶段的实现策略不是像素级复刻，而是：
  - 提取视觉语言
  - 映射到现有页面结构
  - 保持产品语义与功能不变

## 8. 后续维护建议
- 后续每次 UI-only 迭代后：
  - 更新 [progress-ui.md](/Users/haruki/workspace/kotoba/memory-bank/progress-ui.md)
  - 如有结构变化，再更新本文件
- 若后续 UI 迭代引入新的共享视觉模式，应优先沉淀到：
  - `style.css`
  - `components/ui`
  - `components/shared`
- 若某次迭代开始触及状态流、页面装配模式或测试语义，应把该任务视为“UI + 行为”联合改造，不再只记到本专项文档中。
