import { ArrowLeftRight, History, Keyboard, TimerReset } from "lucide-react";

import PageHeader from "../components/layout/page-header.js";
import { FadeIn } from "../components/motion/presets.js";
import Badge from "../components/ui/badge.js";
import Card from "../components/ui/card.js";

const ReviewPage = () => (
  <div className="space-y-4">
    <PageHeader
      eyebrow="复习"
      title="SM-2 队列与回退体验"
      description="复习路由和布局已连接，后续将绑定 Fastify API 与 SM-2 队列、撤销、快捷键。"
      accent="队列占位"
    />

    <FadeIn className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <TimerReset className="h-4 w-4 text-success" />
          队列与进度
        </div>
        <p className="text-sm text-muted">
          以 next_due_at 升序获取，默认批量 30，可按设置自定义。
        </p>
        <Badge tone="muted">进度条 + 队列缓存</Badge>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <ArrowLeftRight className="h-4 w-4 text-accent-strong" />
          质量选择
        </div>
        <p className="text-sm text-muted">
          展开详情后选择 easy/medium/hard，未选择默认 medium；跳过即 easy。
        </p>
        <Badge tone="muted">同步 SM-2 模型</Badge>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <History className="h-4 w-4 text-warning" />
          撤销上一条
        </div>
        <p className="text-sm text-muted">
          支持 Ctrl/Cmd + Z 回退上一条，保持队列指针与复用缓存。
        </p>
        <Badge tone="muted">键盘 / 动效</Badge>
      </Card>
    </FadeIn>

    <Card className="flex flex-col gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
        <Keyboard className="h-4 w-4 text-accent-strong" />
        快捷键计划
      </div>
      <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
        <li>左右方向键或 J/K：下一条 / 上一条</li>
        <li>空格：展开/收起详情</li>
        <li>1/2/3：hard/medium/easy 选择</li>
      </ul>
    </Card>
  </div>
);

export default ReviewPage;
