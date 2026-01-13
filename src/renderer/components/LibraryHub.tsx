import DataTransferPanel from "./DataTransferPanel";
import SettingsPanel from "./SettingsPanel";

const LibraryHub = () => (
  <div className="space-y-6">
    <section className="panel space-y-4 p-6">
      <div className="space-y-2">
        <p className="eyebrow">词库</p>
        <h2 className="text-3xl font-semibold text-ink">词库管理骨架</h2>
        <p className="text-muted">
          词库列表、搜索筛选与编辑将在后续步骤补充，目前可先通过导入/导出维护数据，并配置 provider 与密钥。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="stat-card space-y-2">
          <p className="text-sm font-semibold text-ink">当前可做的事情</p>
          <ul className="list-disc space-y-1 pl-5 text-sm text-ink">
            <li>导入现有 words/activity JSON 或词库 CSV</li>
            <li>保存 provider 选择与密钥，准备造卡</li>
            <li>造卡/复习完成后回到统计查看 streak</li>
          </ul>
        </div>

        <div className="stat-card space-y-2">
          <p className="text-sm font-semibold text-ink">即将上线</p>
          <p className="text-sm text-muted">
            「词库」列表与搜索筛选、行内编辑与删除确认，保持单列布局与手动保存/自动保存并行。
          </p>
          <p className="text-sm text-muted">
            现阶段可通过下方导入/导出功能迁移数据，或直接在新增页手动录入单词。
          </p>
        </div>
      </div>
    </section>

    <DataTransferPanel />
    <SettingsPanel />
  </div>
);

export default LibraryHub;
