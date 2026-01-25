import {
  Activity,
  ArrowRight,
  BarChart3,
  Compass,
  Sparkles,
} from "lucide-react";

import PageHeader from "../components/layout/page-header.js";
import { FadeIn } from "../components/motion/presets.js";
import { Button } from "../components/ui/button.js";
import Card from "../components/ui/card.js";

const HomePage = () => (
  <div className="space-y-4">
    <PageHeader
      eyebrow="主页"
      title="Kotoba 渲染端设计与导航基线"
      description="统一的布局、主题、动效与状态管理已经接入。以下入口会在后续迭代中挂上真实数据。"
      accent="同步 API 设计"
      actions={
        <>
          <Button variant="subtle" size="sm">
            查看架构
            <ArrowRight className="h-4 w-4" />
          </Button>
          <Button variant="primary" size="sm">
            去今日学习
          </Button>
        </>
      }
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card tone="accent" className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Sparkles className="h-4 w-4" />
          即将上线
        </div>
        <h3 className="text-lg font-bold">AI 生成 + 复习动效</h3>
        <p className="text-sm text-muted">
          今日学习、复习、词库、设置路由已占位，等待数据与交互接线。
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Activity className="h-4 w-4 text-success" />
          状态管理
        </div>
        <h3 className="text-lg font-bold">Zustand + 主题存储</h3>
        <p className="text-sm text-muted">
          导航开关与主题偏好持久化，后续可挂接 API 加载态与错误提示。
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <BarChart3 className="h-4 w-4 text-warning" />
          响应式与快捷键
        </div>
        <h3 className="text-lg font-bold">移动端折叠菜单</h3>
        <p className="text-sm text-muted">
          Cmd/Ctrl + B 切换侧栏，Cmd/Ctrl + J 切换主题，支持键盘跳转主内容。
        </p>
      </Card>
    </div>

    <FadeIn className="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Compass className="h-4 w-4 text-accent-strong" />
          导航结构
        </div>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>主页：设计/架构概览与快捷入口</li>
          <li>今日学习：新增词条、AI 生成、轻量编辑</li>
          <li>复习：SM-2 队列、快捷键与回退</li>
          <li>词库：搜索、过滤、详情悬浮页</li>
          <li>设置：主题、例句风格、批量大小</li>
        </ul>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Sparkles className="h-4 w-4 text-accent-strong" />
          UI / 动效基线
        </div>
        <ul className="list-disc space-y-2 pl-5 text-sm text-muted">
          <li>Tailwind + shadcn 风格按钮、徽标、卡片</li>
          <li>Framer Motion 进场动效，统一淡入滑动</li>
          <li>Toaster 统一错误提示（sonner）</li>
          <li>主题令牌覆盖背景、文本、边框、阴影</li>
        </ul>
      </Card>
    </FadeIn>
  </div>
);

export default HomePage;
