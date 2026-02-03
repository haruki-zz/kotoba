import React from 'react';

const checkpoints = [
  '单一 package.json，无 workspace/workspaces 配置',
  '根级脚本：dev / build / test / lint / format / typecheck',
  'Vite + React 渲染层占位，后续可接入 Electron 壳',
  'TS/ESLint/Prettier 基线已配置',
  '.env.example 与 data 目录就绪（已 gitignore）',
];

function App() {
  return (
    <main className="app-shell">
      <section className="card">
        <p className="eyebrow">Kotoba · 环境基线</p>
        <h1>环境与基础框架已就绪</h1>
        <p className="lede">
          下一步可以按计划接入数据库、SM-2 调度、Fastify API、AI 生成与 Electron
          主进程。当前页面仅作为构建与开发脚本的占位验证。
        </p>
        <ul className="checklist">
          {checkpoints.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>
    </main>
  );
}

export default App;
