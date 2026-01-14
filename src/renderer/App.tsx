import { useMemo, useState } from "react";
import AddWordForm from "./components/AddWordForm";
import ActivityOverview from "./components/ActivityOverview";
import LibraryHub from "./components/LibraryHub";
import ReviewSession from "./components/ReviewSession";

type ViewKey = "add" | "review" | "library" | "stats";

const NAV_ITEMS: Array<{ id: ViewKey; label: string; hint: string }> = [
  { id: "add", label: "新增单词", hint: "输入并生成卡片" },
  { id: "review", label: "复习", hint: "今日计划与自选" },
  { id: "library", label: "词库", hint: "导入/导出与设置" },
  { id: "stats", label: "统计", hint: "活跃度与难度" },
];

const VIEW_META: Record<ViewKey, { title: string; description: string; action: string; anchor: string }> = {
  add: {
    title: "新增单词",
    description: "输入→生成预览→保存/手动完成，默认聚焦输入框，回车即可触发生成。",
    action: "去输入",
    anchor: "add-word",
  },
  review: {
    title: "复习",
    description: "查看今日计划或自选复习，翻面后按容易/一般/困难评分更新 SM-2。",
    action: "开始复习",
    anchor: "review-session",
  },
  library: {
    title: "词库",
    description: "后续将补充列表与筛选，当前可先进行导入/导出与 provider 设置。",
    action: "管理数据",
    anchor: "library",
  },
  stats: {
    title: "统计",
    description: "查看 streak、活跃度热力格与词库难度占比，一屏掌握学习节奏。",
    action: "去复习",
    anchor: "stats",
  },
};

const scrollToAnchor = (anchor: string) => {
  const target = document.getElementById(anchor);
  if (target) {
    target.scrollIntoView({ behavior: "smooth", block: "start" });
  }
};

const App = () => {
  const [activeView, setActiveView] = useState<ViewKey>("add");
  const [addFocusToken, setAddFocusToken] = useState(0);

  const header = useMemo(() => VIEW_META[activeView], [activeView]);

  const navigateToView = (view: ViewKey) => {
    setActiveView(view);
    setTimeout(() => scrollToAnchor(VIEW_META[view].anchor), 32);
  };

  const handleNavigateToReview = () => navigateToView("review");
  const handleNavigateToLibrary = () => navigateToView("library");

  const handlePrimaryAction = () => {
    if (activeView === "add") {
      setAddFocusToken((token) => token + 1);
    }
    if (activeView === "stats") {
      handleNavigateToReview();
      return;
    }
    scrollToAnchor(header.anchor);
  };

  const renderView = () => {
    switch (activeView) {
      case "add":
        return (
          <div id="add-word">
            <AddWordForm focusToken={addFocusToken} />
          </div>
        );
      case "review":
        return (
          <div id="review-session">
            <ReviewSession />
          </div>
        );
      case "library":
        return (
          <div id="library">
            <LibraryHub />
          </div>
        );
      case "stats":
      default:
        return (
          <div id="stats">
            <ActivityOverview
              onNavigateToReview={handleNavigateToReview}
              onNavigateToLibrary={handleNavigateToLibrary}
            />
          </div>
        );
    }
  };

  return (
    <main className="app-shell">
      <div className="mx-auto flex max-w-[1280px] gap-6">
        <aside className="panel nav-rail w-56 shrink-0 p-5">
          <div className="space-y-1">
            <p className="eyebrow text-xs">Kotoba</p>
            <h1 className="text-xl font-semibold text-ink">学习导航</h1>
            <p className="text-sm text-muted">四个入口覆盖造卡、复习与统计</p>
          </div>

          <nav className="mt-4 space-y-2">
            {NAV_ITEMS.map((item) => {
              const active = item.id === activeView;

              return (
                <button
                  key={item.id}
                  type="button"
                  className={`nav-item ${active ? "nav-item--active" : ""}`}
                  onClick={() => navigateToView(item.id)}
                  aria-pressed={active}
                >
                  <span className="text-base font-semibold text-ink">{item.label}</span>
                  <span className="text-xs text-muted">{item.hint}</span>
                </button>
              );
            })}
          </nav>

          <div className="mt-auto pt-6 text-xs text-muted">
            <p>导入/导出与密钥设置位于「词库」。</p>
            <p>统计页面可查看 streak、热力格与难度占比。</p>
          </div>
        </aside>

        <section className="flex-1">
          <div className="mx-auto flex max-w-[960px] flex-col gap-6 pb-12">
            <div className="page-header panel flex items-start justify-between gap-4 p-5">
              <div className="space-y-2">
                <p className="eyebrow text-xs">主区域</p>
                <h2 className="text-3xl font-semibold text-ink">{header.title}</h2>
                <p className="text-sm text-muted">{header.description}</p>
              </div>
              <button
                type="button"
                className="btn btn-primary whitespace-nowrap"
                onClick={handlePrimaryAction}
              >
                {header.action}
              </button>
            </div>

            {renderView()}
          </div>
        </section>
      </div>
    </main>
  );
};

export default App;
