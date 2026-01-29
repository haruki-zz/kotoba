import { ChevronDown, ChevronUp, Clock, RefreshCw } from "lucide-react";
import { useMemo, useState } from "react";

import Card from "../../../components/ui/card.js";
import { Button } from "../../../components/ui/button.js";
import Badge from "../../../components/ui/badge.js";
import { FadeIn } from "../../../components/motion/presets.js";
import type { WordRecord } from "@kotoba/shared";
import { excerpt } from "../utils.js";

type TodayListProps = {
  items: WordRecord[];
  isLoading: boolean;
  onRefresh: () => void;
};

const difficultyTone: Record<WordRecord["difficulty"], "success" | "accent" | "warning"> =
  {
    easy: "success",
    medium: "accent",
    hard: "warning",
  };

const formatTime = (value: string) =>
  new Date(value).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const WordCard = ({ record }: { record: WordRecord }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <Card className="flex flex-col gap-3 border border-border/70 bg-surface-soft/60">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h4 className="text-lg font-semibold text-foreground">{record.word}</h4>
            {record.reading ? (
              <span className="rounded-md bg-surface px-2 py-1 text-xs text-muted">
                {record.reading}
              </span>
            ) : null}
            <Badge tone={difficultyTone[record.difficulty]}>
              {record.difficulty === "easy"
                ? "简单"
                : record.difficulty === "medium"
                  ? "适中"
                  : "困难"}
            </Badge>
          </div>
          {record.contextExpl ? (
            <p className="text-sm text-muted">{excerpt(record.contextExpl, 140)}</p>
          ) : null}
          <div className="flex items-center gap-1 text-xs text-muted">
            <Clock className="h-3.5 w-3.5" />
            <span>创建于 {formatTime(record.createdAt)}</span>
          </div>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          aria-expanded={expanded}
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? (
            <>
              收起
              <ChevronUp className="h-4 w-4" />
            </>
          ) : (
            <>
              展开
              <ChevronDown className="h-4 w-4" />
            </>
          )}
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-3 rounded-md border border-border/60 bg-surface px-3 py-3 text-sm">
          {record.sceneDesc ? (
            <div>
              <p className="font-semibold text-foreground">情景</p>
              <p className="text-muted">{record.sceneDesc}</p>
            </div>
          ) : null}
          {record.example ? (
            <div>
              <p className="font-semibold text-foreground">例句</p>
              <p className="text-muted">{record.example}</p>
            </div>
          ) : null}
          {!record.sceneDesc && !record.example ? (
            <p className="text-muted">暂无更多细节，稍后可在词库补充。</p>
          ) : null}
        </div>
      ) : null}
    </Card>
  );
};

const TodayList = ({ items, isLoading, onRefresh }: TodayListProps) => {
  const sorted = useMemo(
    () => [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [items],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">
            今日新增
          </p>
          <h3 className="text-lg font-bold text-foreground">
            {sorted.length} 条已创建
          </h3>
        </div>
        <Button
          type="button"
          variant="subtle"
          size="sm"
          onClick={onRefresh}
          disabled={isLoading}
        >
          <RefreshCw className={isLoading ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
          刷新列表
        </Button>
      </div>

      {isLoading ? (
        <FadeIn className="space-y-3">
          {[1, 2, 3].map((key) => (
            <div
              key={key}
              className="h-20 animate-pulse rounded-xl bg-surface-soft/80"
            />
          ))}
        </FadeIn>
      ) : null}

      {!isLoading && !sorted.length ? (
        <Card className="border border-dashed border-border/70 bg-surface-soft text-muted">
          <p className="p-4 text-center text-sm">
            还没有今日词条，点击“新建”开始记录。
          </p>
        </Card>
      ) : null}

      {!isLoading ? (
        <FadeIn className="grid grid-cols-1 gap-3 md:grid-cols-2">
          {sorted.map((item) => (
            <WordCard key={item.id} record={item} />
          ))}
        </FadeIn>
      ) : null}
    </div>
  );
};

export default TodayList;
