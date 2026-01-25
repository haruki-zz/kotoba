import { ArrowRight, ListChecks, NotebookPen, Wand2 } from "lucide-react";

import PageHeader from "../components/layout/page-header.js";
import { FadeIn } from "../components/motion/presets.js";
import Badge from "../components/ui/badge.js";
import { Button } from "../components/ui/button.js";
import Card from "../components/ui/card.js";

const steps = [
  {
    title: "录入单词",
    description: "输入单词，复用默认例句风格，自动加入队列但不进入当日复习。",
    icon: NotebookPen,
    badge: "表单基线",
  },
  {
    title: "AI 生成与校对",
    description: "生成假名、情景解释、场景描述、例句；用户可覆盖与微调。",
    icon: Wand2,
    badge: "Zod 校验",
  },
  {
    title: "新增列表",
    description: "今日新增列表显示 word/reading/context，快速预览与编辑。",
    icon: ListChecks,
    badge: "待接 API",
  },
];

const TodayPage = () => (
  <div className="space-y-4">
    <PageHeader
      eyebrow="今日学习"
      title="新增词条与生成体验"
      description="表单、验证、动效与状态管理骨架已就绪，等待后续接入 API 与存储。"
      actions={
        <Button variant="primary" size="sm">
          进入新增流程
          <ArrowRight className="h-4 w-4" />
        </Button>
      }
    />

    <FadeIn className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {steps.map((step) => (
        <Card key={step.title} className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
            <step.icon className="h-4 w-4 text-accent-strong" />
            {step.title}
          </div>
          <p className="text-sm text-muted">{step.description}</p>
          <Badge tone="muted">{step.badge}</Badge>
        </Card>
      ))}
    </FadeIn>
  </div>
);

export default TodayPage;
