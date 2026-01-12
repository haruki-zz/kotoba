import { ChangeEvent, useState } from "react";
import { createAppStore, useAppStore } from "../store";

type StoreHook = ReturnType<typeof createAppStore>;

interface DataTransferPanelProps {
  store?: StoreHook;
}

const extractFilePath = (event: ChangeEvent<HTMLInputElement>) => {
  const [file] = Array.from(event.target.files ?? []);
  if (!file) return "";
  return "path" in file ? ((file as File & { path?: string }).path ?? "") : "";
};

const DataTransferPanel = ({ store = useAppStore }: DataTransferPanelProps) => {
  const exportData = store((state) => state.exportData);
  const importData = store((state) => state.importData);
  const refreshWords = store((state) => state.refreshWords);
  const refreshActivity = store((state) => state.refreshActivity);
  const refreshReviewQueue = store((state) => state.refreshReviewQueue);
  const session = store((state) => state.session);

  const [importPaths, setImportPaths] = useState({ words: "", activity: "" });
  const [exportPaths, setExportPaths] = useState({ words: "", activity: "", csv: "" });

  const [importMessage, setImportMessage] = useState<string | undefined>();
  const [exportMessage, setExportMessage] = useState<string | undefined>();
  const [importError, setImportError] = useState<string | undefined>();
  const [exportError, setExportError] = useState<string | undefined>();
  const [importIssues, setImportIssues] = useState<string[]>([]);

  const handleImportFile = (kind: "words" | "activity") => (event: ChangeEvent<HTMLInputElement>) => {
    const path = extractFilePath(event);
    setImportPaths((prev) => ({ ...prev, [kind]: path }));
    setImportError(undefined);
    setImportMessage(undefined);
    setImportIssues([]);
  };

  const handleExportPathChange = (key: "words" | "activity" | "csv") => (value: string) => {
    setExportPaths((prev) => ({ ...prev, [key]: value }));
    setExportError(undefined);
    setExportMessage(undefined);
  };

  const handleImport = async () => {
    const wordsPath = importPaths.words.trim();
    const activityPath = importPaths.activity.trim();

    if (!wordsPath && !activityPath) {
      setImportError("请选择要导入的 JSON 文件");
      setImportMessage(undefined);
      setImportIssues([]);
      return;
    }

    setImportError(undefined);
    setImportMessage(undefined);
    setImportIssues([]);

    try {
      const result = await importData({
        wordsPath: wordsPath || undefined,
        activityPath: activityPath || undefined,
      });

      setImportMessage(
        `导入完成：新增 ${result.importedWords} 条，替换 ${result.replacedWords} 条，跳过 ${result.skippedWords} 条，活跃度 ${result.activityDaysImported} 天`,
      );
      setImportIssues(result.errors);

      try {
        await Promise.all([refreshWords(), refreshReviewQueue(), refreshActivity()]);
      } catch (err) {
        const reason = err instanceof Error ? err.message : "刷新数据失败";
        setImportError(`导入成功但刷新数据失败：${reason}`);
      }
    } catch (err) {
      const reason = err instanceof Error ? err.message : "导入失败，请检查文件路径";
      setImportError(reason);
    }
  };

  const handleExport = async () => {
    const wordsPath = exportPaths.words.trim();
    const activityPath = exportPaths.activity.trim();
    const csvPath = exportPaths.csv.trim();

    if (!wordsPath && !activityPath && !csvPath) {
      setExportError("请至少填写一个导出路径");
      setExportMessage(undefined);
      return;
    }

    setExportError(undefined);
    setExportMessage(undefined);

    try {
      const result = await exportData({
        wordsPath: wordsPath || undefined,
        activityPath: activityPath || undefined,
        csvPath: csvPath || undefined,
      });

      const parts = [];
      if (wordsPath || csvPath) {
        parts.push(`词条 ${result.wordsCount} 条`);
      }
      if (activityPath) {
        parts.push(`活跃度 ${result.activityDaysCount} 天`);
      }
      if (csvPath) {
        parts.push(`CSV ${result.csvCount ?? 0} 条`);
      }

      setExportMessage(`导出完成：${parts.join("，")}`);
    } catch (err) {
      const reason = err instanceof Error ? err.message : "导出失败，请检查路径是否可写";
      setExportError(reason);
    }
  };

  return (
    <section className="panel mx-auto max-w-5xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.08em] text-slate-500">导入 / 导出</p>
        <h2 className="text-3xl font-semibold text-slate-900">迁移词库与活跃度</h2>
        <p className="text-slate-600">
          导入外部 JSON 时会进行校验并按单词去重，导出可生成 words/activity JSON 与 CSV，所有操作会在完成后刷新当前数据。
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900">导出 JSON / CSV</h3>
            <p className="text-sm text-slate-600">填写目标文件路径，可选择导出词库 JSON、活跃度 JSON 与 CSV。</p>
          </div>

          <div className="mt-4 space-y-3">
            <TextField
              id="export-words"
              label="词库 JSON 导出路径"
              placeholder="/Users/you/Downloads/words-export.json"
              value={exportPaths.words}
              onChange={handleExportPathChange("words")}
              disabled={session.loading}
            />
            <TextField
              id="export-activity"
              label="活跃度 JSON 导出路径"
              placeholder="/Users/you/Downloads/activity-export.json"
              value={exportPaths.activity}
              onChange={handleExportPathChange("activity")}
              disabled={session.loading}
            />
            <TextField
              id="export-csv"
              label="词库 CSV 导出路径"
              placeholder="/Users/you/Downloads/words-export.csv"
              value={exportPaths.csv}
              onChange={handleExportPathChange("csv")}
              disabled={session.loading}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cta"
                onClick={handleExport}
                disabled={session.loading}
              >
                {session.loading ? "处理中…" : "导出文件"}
              </button>
              <p className="text-sm text-slate-600">至少填写一个路径，可同时生成 JSON 与 CSV。</p>
            </div>

            {exportError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {exportError}
              </div>
            )}
            {exportMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {exportMessage}
              </div>
            )}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="space-y-1">
            <h3 className="text-xl font-semibold text-slate-900">导入 JSON</h3>
            <p className="text-sm text-slate-600">
              选择 words.json 或 activity.json，系统会按 term 去重并跳过非法记录，导入后自动刷新词库与活跃度。
            </p>
          </div>

          <div className="mt-4 space-y-4">
            <FileField
              id="import-words"
              label="词库 JSON（words.json）"
              value={importPaths.words}
              onChange={handleImportFile("words")}
              disabled={session.loading}
            />
            <FileField
              id="import-activity"
              label="活跃度 JSON（activity.json）"
              value={importPaths.activity}
              onChange={handleImportFile("activity")}
              disabled={session.loading}
            />

            <div className="flex items-center gap-3">
              <button
                type="button"
                className="cta"
                onClick={handleImport}
                disabled={session.loading}
              >
                {session.loading ? "处理中…" : "导入文件"}
              </button>
              <p className="text-sm text-slate-600">至少选择一个文件，导入后数据会立即生效。</p>
            </div>

            {importError && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {importError}
              </div>
            )}
            {importMessage && (
              <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                {importMessage}
              </div>
            )}
            {importIssues.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <p className="font-medium">以下记录被跳过：</p>
                <ul className="mt-2 list-disc space-y-1 pl-5">
                  {importIssues.map((issue) => (
                    <li key={issue}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

interface TextFieldProps {
  id: string;
  label: string;
  placeholder?: string;
  value: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}

const TextField = ({ id, label, placeholder, value, onChange, disabled }: TextFieldProps) => (
  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
    {label}
    <input
      id={id}
      name={id}
      className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
      placeholder={placeholder}
      value={value}
      onChange={(event) => onChange(event.target.value)}
      disabled={disabled}
    />
  </label>
);

interface FileFieldProps {
  id: string;
  label: string;
  value: string;
  disabled?: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
}

const FileField = ({ id, label, value, disabled, onChange }: FileFieldProps) => (
  <div className="flex flex-col gap-2 text-sm font-medium text-slate-700">
    <label className="flex flex-col gap-2" htmlFor={id}>
      {label}
      <input
        id={id}
        name={id}
        type="file"
        accept="application/json"
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 shadow-sm file:mr-3 file:rounded-md file:border-0 file:bg-slate-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200"
        onChange={onChange}
        disabled={disabled}
        data-testid={`${id}-input`}
      />
    </label>
    <p className="text-xs font-normal text-slate-600">已选择：{value || "未选择文件"}</p>
  </div>
);

export default DataTransferPanel;
