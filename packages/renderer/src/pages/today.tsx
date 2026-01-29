import { useCallback, useEffect } from "react";
import { ArrowRight, ListChecks, NotebookPen, Wand2 } from "lucide-react";

import PageHeader from "../components/layout/page-header.js";
import { FadeIn } from "../components/motion/presets.js";
import Badge from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import Card from "../components/ui/card.js";
import {
  TodayList,
  TodaySheet,
  filterWordsForToday,
  useTodayStore,
} from "../features/index.js";
import { fetchWords } from "../features/today/api.js";
import { useApi } from "../hooks/use-api.js";

const steps = [
  {
    title: "录入词条",
    description: "点击“新建”打开悬浮表单，填写必填字段并通过校验。",
    icon: NotebookPen,
    badge: "入口 + 校验",
  },
  {
    title: "AI 生成与覆盖",
    description: "调用生成接口补全释义、情景与例句，支持手动覆盖。",
    icon: Wand2,
    badge: "生成可编辑",
  },
  {
    title: "保存同步",
    description: "提交后写入数据库，今日列表即时更新并支持预览。",
    icon: ListChecks,
    badge: "状态同步",
  },
];

const TodayPage = () => {
  const { withErrorToast } = useApi();
  const {
    items,
    setItems,
    addItem,
    isSheetOpen,
    setSheetOpen,
    isLoadingList,
    setLoadingList,
  } = useTodayStore();

  const loadTodayList = useCallback(async () => {
    setLoadingList(true);
    try {
      const allWords = await withErrorToast(
        () => fetchWords(120, 0),
        "获取词条列表失败",
      );
      setItems(filterWordsForToday(allWords));
    } catch {
      // 错误已在 toast 中提示，避免继续向上传播。
    } finally {
      setLoadingList(false);
    }
  }, [setItems, setLoadingList, withErrorToast]);

  useEffect(() => {
    loadTodayList().catch(() => {});
  }, [loadTodayList]);

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow="今日学习"
        title="新增、生成、预览今天的学习词条"
        description="通过 AI 辅助快速录入生词，校验必填字段，保存后即时更新今日列表。"
        accent={`${items.length} 条已记录`}
        actions={
          <Button variant="primary" size="sm" onClick={() => setSheetOpen(true)}>
            新建词条
            <ArrowRight className="h-4 w-4" />
          </Button>
        }
      />

      <FadeIn className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {steps.map((step) => (
          <Card key={step.title} className="flex flex-col gap-3 border border-border/70">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
              <step.icon className="h-4 w-4 text-accent-strong" />
              {step.title}
            </div>
            <p className="text-sm text-muted">{step.description}</p>
            <Badge tone="muted">{step.badge}</Badge>
          </Card>
        ))}
      </FadeIn>

      <TodayList items={items} isLoading={isLoadingList} onRefresh={loadTodayList} />

      <TodaySheet
        open={isSheetOpen}
        onClose={() => setSheetOpen(false)}
        onCreated={(record) => {
          addItem(record);
          setSheetOpen(false);
        }}
      />
    </div>
  );
};

export default TodayPage;
