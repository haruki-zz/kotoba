# 实施计划（核心版）

1. 准备与环境校验  
   - 操作：安装 Node 18+ 依赖，使用 electron-vite 初始化 Electron + Vite + React + TypeScript 脚手架（dev、lint、test、build），确认 ESLint/Prettier/Vitest 配置存在。  
   - 验证：运行 npm run lint 与 npm run test 均通过；执行 npm run dev 能启动空白 Electron 窗口且无控制台报错。

2. 目录与配置落地  
   - 操作：创建 src/main、src/preload、src/renderer（按 features 及 components/hooks 分组）与 assets、tests 目录；设置 tsconfig 路径别名、Vite 配置、electron-builder 目标平台；在 Tailwind 配置中写入设计文档的色板、字体（使用 Noto Serif JP 替代游明朝/教科書体）、间距变量并引入字体文件。  
   - 验证：运行 npm run build 或 npm run lint -- --max-warnings=0 完成；在开发模式下检查浏览器样式面板确认变量生效（颜色、字体可被解析）。

3. 数据模型与时间规范  
   - 操作：在共享类型模块定义 WordRecord、Sm2Fields、SessionRecord、ActivityEntry 等类型，统一字段的 UTC ISO 秒级时间格式；明确必填字段与可选字段。  
   - 验证：添加 Vitest 类型单测或 schema 校验用例，使用设计文档示例数据构造对象，确保通过校验且缺失字段会被判定错误。

4. 持久化与文件操作工具  
   - 操作：在主进程实现 JSONL 读写工具，支持 append、全量重写（临时文件替换）、基于 word 去重覆盖、ID 自动生成；实现 activity.json 的读写和原子替换。  
   - 验证：编写主进程单元测试，使用临时目录模拟读写，断言追加、覆盖、去重与时间格式保持正确；运行 npm run test -- path/to/fs-tests 确认通过。

5. SM-2 调度与复习队列  
   - 操作：实现 SM-2 评分更新函数与队列生成器，遵循 score 0–4、ef 下限 1.3、间隔向上取整、优先过期词的规则；生成 next_review_at 与排序队列。  
   - 验证：添加算法单元测试覆盖 score <3 与 >=3 情况、ef 下限、间隔取整、队列补足顺序；运行 npm run test -- path/to/sm2-tests 全绿。

6. 主进程 API 提供者与 AI 调用  
   - 操作：封装 OpenAI 与 Google 提供者与 Provider Router：默认走 Google，设置 15–30 秒超时与 1 次重试；当两家 key 均存在时，Google 失败自动切换 OpenAI；无任何 key 时阻断生成并返回手动录入提示；保留可扩展提供者注册接口。  
   - 验证：编写提供者单测，使用 mock/fake client 覆盖成功、超时、Google 失败转 OpenAI、无 key 阻断等分支；运行 npm run test -- path/to/provider-tests 通过。

7. IPC 接口与权限隔离  
   - 操作：定义 IPC 通道（词库 CRUD、复习队列获取与提交评分、session 记录、activity 读取/重算、导入导出、AI 生成、API key 管理），在主进程注册处理器，在 preload 中暴露安全桥接函数。  
   - 验证：使用 Vitest 对 IPC handler 做集成测试，mock 渲染端调用并断言文件被更新且返回值符合预期；运行 npm run test -- path/to/ipc-tests 通过。

8. 渲染端状态管理  
   - 操作：建立 Zustand store（词库、复习队列、UI 状态、设置/API key），封装调用 preload 的服务层；处理加载/错误态与本地缓存。  
   - 验证：编写 store 单测，使用 fake IPC client 断言动作会更新状态、处理错误、缓存刷新；运行 npm run test -- path/to/store-tests 通过。

9. UI 基础框架与主题  
   - 操作：搭建导航栏和主内容双列布局，应用设计文档的色板、字体、间距、圆角、描边；实现响应式断点行为（≥1200、960–1199、768–959、<768）。  
   - 验证：启动 npm run dev，使用浏览器/应用窗口调试四个断点，确认导航折叠、列布局与字体切换符合描述；运行 npm run lint 确认样式类无错误。

10. 新增单词流程（AI/手动）  
    - 操作：实现输入框、生成按钮、手动输入入口；集成 AI 生成结果的可编辑预览卡，保存时写入 words.jsonl 并更新 activity；处理生成中/失败状态与提示。  
    - 验证：编写组件测试（输入→点击生成→mock AI 返回→可编辑→保存触发 IPC 写入）；手动验证：断开网络或 mock 失败时能走手动保存；运行 npm run test -- path/to/add-word-tests 通过。

11. 复习流程  
    - 操作：构建复习页面卡片翻转、评分按钮、进度条；进入页面请求队列，评分后更新 SM-2 字段、next_review_at 与 session 统计，支持键盘快捷键。  
    - 验证：组件测试覆盖翻转交互、键盘评分、进度条更新；算法集成测试断言评分后队列与持久化数据更新正确；手动运行 npm run dev 检查动效与无障碍焦点可见。

12. 单词库页面  
    - 操作：按五十音分区渲染列表，支持搜索、点击编辑抽屉修改读音/释义/例句、删除词条并同步复习队列；保持分区间距与 hover/active 样式。  
    - 验证：组件测试模拟编辑与删除，断言 IPC 被调用且列表刷新；手动检查 50 音顺排序正确、空缺分区不填充。

13. 活跃度热力图  
    - 操作：实现当月热力图渲染，方块尺寸/间距、绿阶梯度、tooltip 文案、摘要统计；按每日 `added + sessions` 等权求和映射颜色；支持从 activity.json 读取数据。  
    - 验证：组件测试使用固定数据快照断言色阶与 tooltip 内容（含等权求和逻辑）；手动切换月份边界日期确保渲染完整周；运行 npm run test -- path/to/activity-tests 通过。

14. 导入/导出与重算  
    - 操作：提供 JSON/JSONL 导入（对 word 进行假名/汉字空格正则化后去重覆盖），覆盖时保留旧记录的 `created_at` 与 `sm2`，仅更新读音/释义/例句；JSON/CSV 导出；导入后触发 activity 重算；显示新增/覆盖/跳过统计与导出路径。  
    - 验证：主进程/IPC 测试使用样例文件断言空格正则化、保留旧时间与 SM-2 的覆盖逻辑、activity 重算正确；手动导入包含重复词的文件确认统计与覆盖生效。

15. 设置与 API Key 管理  
    - 操作：实现设置页面入口（导航和主工具栏图标），表单保存 OpenAI/Google Key 至系统安全存储，允许选择默认提供者与超时；本地开发/CI 支持从环境变量读取 key；导入导出入口按钮放置在导航底部。  
    - 验证：组件测试覆盖表单校验、环境变量兜底、成功/错误提示；手动验证保存后重新打开应用仍能读取 Key 标签状态。

16. 端到端回归与打包  
    - 操作：串联新增→复习→单词库编辑→导出→导入→活跃度重算的完整流程，修复发现的问题；生成 macOS dmg/zip 与 Windows 可执行安装包。  
    - 验证：运行 npm run test 全量通过；执行 npm run build 成功产出安装包；手动在打包应用中完成上述用户流，无崩溃且提示完整。
