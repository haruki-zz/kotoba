import { useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";

import {
  Form,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "../components/form/form.js";
import PageHeader from "../components/layout/page-header.js";
import { Button } from "../components/ui/button.js";
import Input from "../components/ui/input.js";
import Select from "../components/ui/select.js";
import { useApi } from "../hooks/use-api.js";
import useZodForm from "../hooks/use-zod-form.js";
import { useTheme } from "../theme/theme-provider.js";

const settingsSchema = z.object({
  themePreference: z.enum(["light", "dark", "system"]),
  reviewBatchSize: z
    .number({ invalid_type_error: "请输入数字" })
    .min(5, "至少 5 条")
    .max(100, "不超过 100 条"),
  exampleStyle: z.enum(["casual", "polite"]),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

const SettingsPage = () => {
  const { api, withErrorToast } = useApi();
  const { theme, setTheme } = useTheme();
  const form = useZodForm(settingsSchema, {
    defaultValues: {
      themePreference: theme,
      reviewBatchSize: 30,
      exampleStyle: "casual",
    },
  });

  useEffect(() => {
    form.setValue("themePreference", theme);
  }, [form, theme]);

  const submitForm = form.handleSubmit(async (values: SettingsFormValues) => {
    const preference = values.themePreference;
    setTheme(preference);
    await withErrorToast(async () => {
      // 占位：后续直接调用 api.patch("/api/v1/settings", values)
      await new Promise((resolve) => setTimeout(resolve, 160));
      return api;
    }, "保存设置失败");
    toast.success("设置已保存");
  });

  const errors = form.formState.errors;

  return (
    <div className="space-y-4">
      <PageHeader
        eyebrow="设置"
        title="主题、批量大小与例句风格"
        description="表单使用 React Hook Form + Zod 校验，提交时将通过 useApi 统一错误提示。"
      />

      <Form {...form}>
        <form
          onSubmit={(event) => void submitForm(event)}
          className="space-y-4 rounded-xl border border-border bg-surface-soft p-5 shadow-soft"
        >
          <FormItem>
            <FormLabel htmlFor="themePreference">主题模式</FormLabel>
            <Select
              id="themePreference"
              {...form.register("themePreference")}
              onChange={(event) => {
                const next = event.target
                  .value as SettingsFormValues["themePreference"];
                form.setValue("themePreference", next);
                setTheme(next);
              }}
            >
              <option value="system">跟随系统</option>
              <option value="light">浅色</option>
              <option value="dark">深色</option>
            </Select>
            <FormDescription>跟随系统时会监听偏好变更。</FormDescription>
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="reviewBatchSize">复习批量</FormLabel>
            <Input
              id="reviewBatchSize"
              type="number"
              inputMode="numeric"
              min={5}
              max={100}
              {...form.register("reviewBatchSize", { valueAsNumber: true })}
            />
            {errors.reviewBatchSize ? (
              <FormMessage>{errors.reviewBatchSize.message}</FormMessage>
            ) : (
              <FormDescription>默认 30，范围 5-100。</FormDescription>
            )}
          </FormItem>

          <FormItem>
            <FormLabel htmlFor="exampleStyle">例句风格</FormLabel>
            <Select id="exampleStyle" {...form.register("exampleStyle")}>
              <option value="casual">
                生活口语（15-25 字，场景 30-40 字）
              </option>
              <option value="polite">礼貌体</option>
            </Select>
            <FormDescription>
              与设计文档的例句风格一致，后续可扩展。
            </FormDescription>
          </FormItem>

          <div className="flex items-center justify-between">
            <FormDescription>
              提交将通过统一 API client 与 toast。
            </FormDescription>
            <Button type="submit">保存设置</Button>
          </div>
        </form>
      </Form>
    </div>
  );
};

export default SettingsPage;
