import React from 'react';

type Props = {
  busy: boolean;
  importMessage: string | null;
  onImportFile: (file: File | null) => void;
  onExport: () => void;
};

export function LibraryImportExport({ busy, importMessage, onImportFile, onExport }: Props) {
  return (
    <section className="card">
      <div className="section-head">
        <div>
          <p className="eyebrow">导入 / 导出</p>
          <h2>批量处理文件</h2>
        </div>
      </div>
      <p className="muted">支持 JSON：顶层可为 `items` 数组或纯数组。导入前会返回校验错误报告。</p>
      <div className="library-batch-row">
        <input
          type="file"
          accept="application/json"
          onChange={(event) => onImportFile(event.target.files?.[0] ?? null)}
          disabled={busy}
        />
        <button type="button" className="btn ghost" onClick={onExport} disabled={busy}>
          导出当前筛选
        </button>
      </div>
      {importMessage ? <p className="muted">{importMessage}</p> : null}
    </section>
  );
}
