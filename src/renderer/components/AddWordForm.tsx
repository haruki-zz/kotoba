import { FormEvent, useMemo, useState } from "react";
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

const AddWordForm = () => {
  const { addWord, refreshWords, refreshActivity } = useAppStore();
  const [fields, setFields] = useState<FieldState>(emptyFields);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const [message, setMessage] = useState<string | undefined>(undefined);

  const isComplete = useMemo(
    () => Object.values(fields).every((value) => sanitize(value).length > 0),
    [fields],
  );

  const updateField = (key: FieldKey, value: string) => {
    setFields((prev) => ({ ...prev, [key]: value }));
  };

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

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!isComplete) {
      setError("请填写完整后保存");
      return;
    }

    setSaving(true);
    setError(undefined);
    setMessage(undefined);

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
    } catch (err) {
      const message = err instanceof Error ? err.message : "保存失败，请稍后重试";
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="panel mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="text-sm uppercase tracking-[0.08em] text-slate-500">新增单词</p>
        <h1 className="text-3xl font-semibold text-slate-900">最少 3 步完成造卡</h1>
        <p className="text-slate-600">
          输入单词后自动生成读音、释义、情境与例句，必要时可手动调整。
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700" htmlFor="term">
            单词
          </label>
          <div className="flex flex-col gap-3 md:flex-row">
            <input
              id="term"
              name="term"
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-lg shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
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
              className="cta min-w-[140px]"
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

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="cta"
            disabled={saving || generating || !isComplete}
          >
            {saving ? "保存中…" : "保存卡片"}
          </button>
          <p className="text-sm text-slate-600">保存后将加入今日复习计划</p>
        </div>

        {(error || message) && (
          <div
            className={`rounded-lg border px-4 py-3 text-sm ${
              error ? "border-red-200 bg-red-50 text-red-700" : "border-green-200 bg-green-50 text-green-700"
            }`}
          >
            {error ?? message}
          </div>
        )}
      </form>
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
  <label className="flex flex-col gap-2 text-sm font-medium text-slate-700" htmlFor={id}>
    {label}
    {textarea ? (
      <textarea
        id={id}
        name={id}
        className="min-h-[120px] rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    ) : (
      <input
        id={id}
        name={id}
        className="rounded-lg border border-slate-300 px-3 py-2 text-base text-slate-900 shadow-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    )}
  </label>
);

export default AddWordForm;
