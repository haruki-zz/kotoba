# Kotoba UI 优化迭代进度记录

## 1. 当前状态
- 记录日期：`2026-04-05`
- 任务范围：围绕当前渲染层进行持续 UI 优化迭代，仅调整界面表现、布局、样式与交互细节，不改变核心功能、IPC 契约、主进程服务与数据模型。
- 当前阶段：已完成首轮基于 `stitch_ui/` 原型的界面重写，形成新的 UI 基线，可在此基础上继续做视觉与体验优化。

## 2. 本轮已完成事项
### 2.1 全局视觉基线重建
- 已重写 [style.css](/Users/haruki/workspace/kotoba/src/renderer/style.css)：
  - 引入新的字体组合与全局 token
  - 建立偏绿色、柔和玻璃感的背景与表面层级
  - 统一圆角、阴影、输入态、选择态与文本气质
- 当前风格来源于 `stitch_ui` 中的两套原型语言：
  - `kotoba_zen`
  - `kotoba_kinetic`

### 2.2 应用壳与导航重写
- 已完成：
  - [app_shell.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/app_shell.tsx)
  - [app_navigation.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/app_navigation.tsx)
  - [page_header.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/layout/page_header.tsx)
- 当前 UI 基线：
  - 左侧固定导航
  - 顶部玻璃感标题区
  - 页面区域与侧栏分层布局
  - 保持 `活動` 为默认主界面

### 2.3 共享组件视觉统一
- 已更新共享 UI 基元：
  - [button.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/button.tsx)
  - [card.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/card.tsx)
  - [badge.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/badge.tsx)
  - [input.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/input.tsx)
  - [textarea.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/textarea.tsx)
  - [alert.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/ui/alert.tsx)
- 已更新共享状态组件：
  - [loading_state.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/loading_state.tsx)
  - [empty_state.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/empty_state.tsx)
  - [confirm_dialog.tsx](/Users/haruki/workspace/kotoba/src/renderer/components/shared/confirm_dialog.tsx)

### 2.4 五个主页面视觉重写
- 已重写页面：
  - [activity_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/activity/activity_page.tsx)
  - [library_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/library/library_page.tsx)
  - [review_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/review/review_page.tsx)
  - [settings_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/settings/settings_page.tsx)
  - [word_add_page.tsx](/Users/haruki/workspace/kotoba/src/renderer/features/word_add/word_add_page.tsx)
- 当前页面方向：
  - `活動`：仪表盘式摘要 + 热力图
  - `単語帳`：搜索头图 + 统计卡 + 词条卡片
  - `復習`：大幅居中复习卡 + 强调评分动作
  - `設定`：控制台式分区布局
  - `単語追加`：生成工作台布局

## 3. 已验证结果
- 已通过：
  - `pnpm typecheck`
  - `pnpm lint`
  - `pnpm test`
- 当前说明：
  - 本轮未执行 `pnpm test:e2e`
  - 当前本地环境存在 Node 版本 warning：仓库目标为 `22`，实际执行环境为 `v25.2.1`
  - 静态检查与单测在该环境下已通过

## 4. UI 迭代约束
- 仅允许修改渲染层 UI 相关文件。
- 不修改主进程业务逻辑、仓储、SM-2、AI provider、IPC 契约与共享领域模型语义。
- 所有用户可见文案继续保持日语。
- 不因视觉调整破坏：
  - `活動` 默认主界面
  - `単語追加` 草稿机制
  - `単語帳` 搜索 / 编辑 / 删除
  - `復習` 评分与队列更新
  - `設定` 保存与 API Key 管理

## 5. 后续建议迭代方向
### 5.1 视觉细化
- 继续压缩“组件库默认感”，增强页面级独特性。
- 统一卡片留白、标题尺度、按钮优先级与色块节奏。
- 针对桌面宽屏与窄窗口分别优化密度。

### 5.2 交互细化
- 为页面切换、加载、评分操作补充更克制的动效。
- 进一步区分主动作与次动作，降低误触风险。
- 检查所有空态、错误态、成功态的视觉层级是否一致。

### 5.3 页面专项优化入口
- `活動`：
  - 热力图标签密度
  - 摘要卡片层级
  - 记忆等级区信息密度
- `単語帳`：
  - 列表项信息压缩
  - 编辑态与浏览态切换节奏
- `復習`：
  - 评分按钮对比度与键盘可达性
  - 卡面信息揭示顺序
- `設定`：
  - 表单分组关系
  - 保存反馈显著性
- `単語追加`：
  - 输入与结果区比例
  - 生成前后状态切换

## 6. 完成定义
- 为 UI 迭代建立独立记录，不与主线功能进度混写。
- 后续每次 UI-only 迭代都应更新本文件的：
  - 当前状态
  - 已完成事项
  - 已验证结果
  - 下一步入口
