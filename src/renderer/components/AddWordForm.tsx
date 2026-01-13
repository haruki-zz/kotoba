import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useAppStore } from "../store";

type FieldKey = "term" | "kana" | "definition_ja" | "scene_ja" | "example_ja";

type FieldState = Record<FieldKey, string>;

const emptyFields: FieldState = {
  term: "",
  kana: "",
  definition_ja: "",
  scene_ja: "",
  example_ja: "",
};

const sanitize = (value: string) => value.trim();

interface AddWordFormProps {
  focusToken?: number;
}

const AddWordForm = ({ focusToken = 0 }: AddWordFormProps) => {
  const { addWord, refreshWords, refreshActivity } = useAppStore();
  const [fields, setFields] = useState<FieldState>(emptyFields);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);
  const termInputRef = useRef<HTMLInputElement>(null);

  const isComplete = useMemo(
    () => Object.values(fields).every((value) => sanitize(value).length > 0),
    [fields],
  );

  const previewFields = useMemo(
    () => ({
      term: sanitize(fields.term) || "待输入单词",
      kana: sanitize(fields.kana) || "假名将在生成后填充",
      definition_ja: sanitize(fields.definition_ja) || "释义会出现在这里",
      scene_ja: sanitize(fields.scene_ja) || "情境/情感描述将展示在此处",
      example_ja: sanitize(fields.example_ja) || "例句将展示在此处",
    }),
    [fields],
  );

  const updateField = (key: FieldKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    termInputRef.current?.focus();
  }, [focusToken]);

  const handleGenerate = async () => {
    if (!sanitize(fields.term)) {
      setError("请输入单词再生成");
      return;
    }

    setGenerating(true);
    setError(undefined);
    setMessage(undefined);

    try {
      const result = await window.electronAPI.generateWordCard({ term: sanitize(fields.term) });
      setFields((prev) => ({
        ...prev,
        kana: result.kana ?? prev.kana,
        definition_ja: result.definition_ja ?? prev.definition_ja,
        scene_ja: result.scene_ja ?? prev.scene_ja,
        example_ja: result.example_ja ?? prev.example_ja,
      }));
      setMessage("已自动填充，可调整后保存");
    } catch (err) {
      const message = err instanceof Error ? err.message : "生成失败，请稍后重试";
      setError(message);
    } finally {
      setGenerating(false);
    }
  };

  const saveCard = async () => {
    setError(undefined);
    setMessage(undefined);

    if (!isComplete) {
      setError("请填写完整后保存");
      return;
    }

    setSaving(true);

    try {
      await addWord({
        term: sanitize(fields.term),
        kana: sanitize(fields.kana),
        definition_ja: sanitize(fields.definition_ja),
        scene_ja: sanitize(fields.scene_ja),
        example_ja: sanitize(fields.example_ja),
      });
      await Promise.all([refreshWords(), refreshActivity()]);
      setMessage("已保存，词条进入复习计划");
      setFields(emptyFields);
      termInputRef.current?.focus();
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败，请稍后重试";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    await saveCard();
  };

  return (
    <section className="panel w-full space-y-6 p-6">
      <div className="space-y-2">
        <p className="eyebrow">新增单词</p>
        <h1 className="text-3xl font-semibold text-ink">最少 3 步完成造卡</h1>
        <p className="text-muted">
          输入单词后自动生成读音、释义、情境与例句，必要时可手动调整，再保存/手动完成。
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {[
          { title: "输入单词", detail: "默认聚焦输入框，回车即可触发生成" },
          { title: "生成预览", detail: "自动填充读音/释义，随时可手动修改" },
          { title: "保存/手动完成", detail: "补全字段后保存，立即进入复习计划" },
        ].map((step) => (
          <div key={step.title} className="stat-card space-y-1">
            <p className="text-sm font-semibold text-ink">{step.title}</p>
            <p className="text-xs text-muted">{step.detail}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-ink" htmlFor="term">
              单词
            </label>
            <div className="flex flex-col gap-3 md:flex-row">
              <input
                ref={termInputRef}
                id="term"
                name="term"
                className="input text-lg"
                placeholder="输入单词，回车生成"
                value={fields.term}
                onChange={(event) => updateField("term", event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    handleGenerate();
                  }
                }}
                disabled={saving || generating}
              />
              <button
                type="button"
                className="btn btn-primary min-w-[140px]"
                onClick={handleGenerate}
                disabled={saving || generating}
              >
                {generating ? "生成中…" : "生成卡片"}
              </button>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field
              id="kana"
              label="假名"
              value={fields.kana}
              onChange={(value) => updateField("kana", value)}
              disabled={saving}
            />
            <Field
              id="definition_ja"
              label="日文释义"
              textarea
              value={fields.definition_ja}
              onChange={(value) => updateField("definition_ja", value)}
              disabled={saving}
            />
            <Field
              id="scene_ja"
              label="情境/情感"
              textarea
              value={fields.scene_ja}
              onChange={(value) => updateField("scene_ja", value)}
              disabled={saving}
            />
            <Field
              id="example_ja"
              label="例句"
              textarea
              value={fields.example_ja}
              onChange={(value) => updateField("example_ja", value)}
              disabled={saving}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving || generating || !isComplete}
            >
              {saving ? "保存中…" : "保存卡片"}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => void saveCard()}
              disabled={saving || generating}
            >
              手动完成
            </button>
            <p className="text-sm text-muted">保存后将加入今日复习计划，可随时返回编辑</p>
          </div>

          {(error || message) && (
            <div
              className={`callout ${error ? "callout-error" : "callout-success"}`}
            >
              {error ?? message}
            </div>
          )}
        </form>

        <aside className="panel space-y-4 p-5">
          <div className="space-y-1">
            <p className="eyebrow text-xs">预览</p>
            <p className="text-lg font-semibold text-ink">生成或手动填写后，预览实时更新</p>
            <p className="text-sm text-muted">右侧卡片会在生成或编辑时同步，帮助确认字段是否完整。</p>
          </div>

          <div className="rounded-2xl border border-border bg-white/90 p-5 shadow-sm space-y-2">
            <div className="flex items-baseline gap-3">
              <p className="text-2xl font-semibold text-ink">{previewFields.term}</p>
              <p className="text-lg text-muted">{previewFields.kana}</p>
            </div>
            <div className="space-y-2 text-sm text-ink">
              <p className="font-semibold text-ink">{previewFields.definition_ja}</p>
              <p className="text-ink">{previewFields.scene_ja}</p>
              <p className="text-ink">{previewFields.example_ja}</p>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
};

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  textarea?: boolean;
}

const Field = ({ id, label, value, onChange, disabled, textarea }: FieldProps) => (
  <label className="flex flex-col gap-2 text-sm font-semibold text-ink" htmlFor={id}>
    {label}
    {textarea ? (
      <textarea
        id={id}
        name={id}
        className="input min-h-[120px] text-base"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    ) : (
      <input
        id={id}
        name={id}
        className="input text-base"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    )}
  </label>
);

export default AddWordForm;
