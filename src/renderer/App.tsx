import React from 'react';

import AiPlayground from './components/AiPlayground';

const checkpoints = [
  '单一 package.json，无 workspace/workspaces 配置',
  'Fastify API + SQLite + SM-2 调度已串通',
  '新增 AI provider 抽象（ChatGPT/Gemini/Mock）与提示模板',
  'AI 调用写入 ai_requests 表，可选写回词条字段',
  '.env.example 更新：OPENAI/GEMINI/AI_PROVIDER/CORS_ORIGIN',
];

function App() {
  return (
    <main className="app-shell">
      <div className="layout-grid">
        <section className="card baseline-card">
          <p className="eyebrow">Kotoba · 状态总览</p>
          <h1>本地 API 与 AI 管线就绪</h1>
          <p className="lede">
            后端已覆盖词条 CRUD、SM-2 复习队列、AI 生成与速率/错误处理；下方可用 Mock
            provider 直接体验提示效果，或切换到真实模型。
          </p>
          <ul className="checklist">
            {checkpoints.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>
        <AiPlayground />
      </div>
    </main>
  );
}

export default App;
