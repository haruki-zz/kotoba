import { FormEvent, useEffect, useState } from "react";
import { ProviderName } from "../../shared/ai";
import { createAppStore, useAppStore } from "../store";

type StoreHook = ReturnType<typeof createAppStore>;

interface SettingsPanelProps {
  store?: StoreHook;
}

const providerOptions: { value: ProviderName; label: string; helper: string }[] = [
  { value: "mock", label: "Mock（测试）", helper: "固定返回示例结果，便于离线调试与演示" },
  { value: "openai", label: "OpenAI", helper: "使用 gpt-4o-mini 生成读音与释义" },
  { value: "gemini", label: "Gemini", helper: "使用 Gemini Flash 生成日语释义" },
];

const SettingsPanel = ({ store = useAppStore }: SettingsPanelProps) => {
  const providerState = store((state) => state.provider);
  const refreshProvider = store((state) => state.refreshProvider);
  const setProvider = store((state) => state.setProvider);
  const session = store((state) => state.session);

  const [selectedProvider, setSelectedProvider] = useState<ProviderName>("mock");
  const [apiKey, setApiKey] = useState("");
  const [message, setMessage] = useState<string | undefined>();
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    const load = async () => {
      try {
        await refreshProvider();
        setError(undefined);
      } catch (err) {
        const reason = err instanceof Error ? err.message : "加载当前设置失败";
        setError(reason);
      }
    };

    void load();
  }, [refreshProvider]);

  useEffect(() => {
    if (providerState?.provider) {
      setSelectedProvider(providerState.provider);
    }
  }, [providerState?.provider]);

  const requiresApiKey =
    selectedProvider !== "mock" &&
    !(providerState?.hasApiKey && providerState.provider === selectedProvider);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const keyToSave = apiKey.trim();

    if (requiresApiKey && !keyToSave) {
      setError("请填写对应的 API 密钥");
      setMessage(undefined);
      return;
    }

    setError(undefined);
    setMessage(undefined);

    try {
      await setProvider({
        provider: selectedProvider,
        apiKey: keyToSave || undefined,
      });
      setMessage("设置已保存，密钥仅存储在本机钥匙串");
      setApiKey("");
    } catch (err) {
      const reason = err instanceof Error ? err.message : "保存失败，请稍后重试";
      setError(reason);
    }
  };

  return (
    <section className="panel mx-auto max-w-3xl space-y-6 p-6">
      <div className="space-y-2">
        <p className="eyebrow">设置</p>
        <h2 className="text-3xl font-semibold text-ink">选择模型与保存密钥</h2>
        <p className="text-muted">
          切换 LLM 提供商或密钥时，密钥会写入系统钥匙串，不会在界面上回显完整内容。
        </p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="provider">
            LLM 提供商
          </label>
          <select
            id="provider"
            name="provider"
            className="input text-base"
            value={selectedProvider}
            onChange={(event) => setSelectedProvider(event.target.value as ProviderName)}
            disabled={session.loading}
          >
            {providerOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <p className="text-sm text-muted">
            {providerOptions.find((option) => option.value === selectedProvider)?.helper}
          </p>
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-semibold text-ink" htmlFor="apiKey">
            API 密钥
          </label>
          <input
            id="apiKey"
            name="apiKey"
            type="password"
            className="input text-base"
            placeholder="sk-... 或 AIzx..."
            value={apiKey}
            onChange={(event) => setApiKey(event.target.value)}
            disabled={session.loading}
          />
          <p className="text-sm text-muted">
            {providerState?.hasApiKey && providerState.provider === selectedProvider
              ? "当前 provider 的密钥已安全保存，不会在此处展示。"
              : "不会上传到服务器，仅保存在本机系统钥匙串。"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="submit"
            className="btn btn-primary"
            disabled={session.loading}
          >
            {session.loading ? "保存中…" : "保存设置"}
          </button>
          <p className="text-sm text-muted">
            切换到 Mock 可离线调试，OpenAI/Gemini 需填写有效密钥。
          </p>
        </div>

        {(error || message) && (
          <div className={`callout ${error ? "callout-error" : "callout-success"}`}>
            {error ?? message}
          </div>
        )}
      </form>
    </section>
  );
};

export default SettingsPanel;
