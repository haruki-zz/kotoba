import './App.css';

const featureList = [
  'Add words with context-rich examples',
  'Review queue powered by SM-2 basics',
  'See daily streaks and hard-word reminders',
];

function App() {
  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="logo">kotoba</div>
        <nav>
          <a href="#today">Today</a>
          <a href="#review">Review</a>
          <a href="#library">Library</a>
          <a href="#settings">Settings</a>
        </nav>
      </header>

      <main className="app-main">
        <section className="hero">
          <p className="eyebrow">Plan 01 — workspace ready</p>
          <h1>Kick off your Japanese vocab companion.</h1>
          <p className="lede">
            Workspace scaffolding is in place. Start wiring SM-2 scheduling, AI
            assisted entries, and the desktop shell next.
          </p>
          <div className="cta-row">
            <button className="btn primary">Start Today Flow</button>
            <button className="btn ghost">Open Review Queue</button>
          </div>
        </section>

        <section className="panel-grid">
          <div className="panel">
            <h2>What&rsquo;s ready</h2>
            <ul>
              {featureList.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
          <div className="panel">
            <h2>Next steps</h2>
            <p>
              Implement data models and persistence (plan_02), then wire Fastify
              endpoints and renderer API hooks.
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
