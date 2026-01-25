import { Filter, NotebookText, Search, ShieldQuestion } from "lucide-react";

import PageHeader from "../components/layout/page-header.js";
import Card from "../components/ui/card.js";

const LibraryPage = () => (
  <div className="space-y-4">
    <PageHeader
      eyebrow="词库"
      title="搜索、过滤与详情占位"
      description="词库路由已准备好挂接 API，后续将加入分页、搜索、过滤、悬浮详情等交互。"
      accent="数据表骨架"
    />

    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Search className="h-4 w-4 text-accent-strong" />
          搜索 / 分页
        </div>
        <p className="text-sm text-muted">
          将使用 shared schema 的查询参数（word、difficulty、分页）与 API 对齐。
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <Filter className="h-4 w-4 text-success" />
          过滤与排序
        </div>
        <p className="text-sm text-muted">
          难度过滤、到期筛选、默认按 created_at 降序；搜索同步高亮。
        </p>
      </Card>

      <Card className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-foreground/90">
          <NotebookText className="h-4 w-4 text-warning" />
          详情悬浮页
        </div>
        <p className="text-sm text-muted">
          点击词条后展示假名、解释、场景、例句，允许编辑、重生成与删除。
        </p>
      </Card>
    </div>

    <Card className="flex items-center gap-3">
      <ShieldQuestion className="h-5 w-5 text-accent-strong" />
      <div>
        <p className="text-sm font-semibold text-foreground">待办</p>
        <p className="text-sm text-muted">
          接入 Fastify API、表格组件、空状态与加载占位。
        </p>
      </div>
    </Card>
  </div>
);

export default LibraryPage;
