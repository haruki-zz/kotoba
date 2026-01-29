import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowRight,
  Loader2,
  Sparkles,
  Wand2,
  X,
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";

import {
  Form,
  FormDescription,
  FormItem,
  FormLabel,
  FormMessage,
} from "../../../components/form/form.js";
import { FadeIn } from "../../../components/motion/presets.js";
import { Button } from "../../../components/ui/button.js";
import Input from "../../../components/ui/input.js";
import Select from "../../../components/ui/select.js";
import Textarea from "../../../components/ui/textarea.js";
import { useApi } from "../../../hooks/use-api.js";
import useZodForm from "../../../hooks/use-zod-form.js";
import type { WordRecord } from "@kotoba/shared";
import { generateWord, createWord } from "../api.js";
import { wordFormSchema, type WordFormValues, toWordCreateInput } from "../schema.js";

type TodaySheetProps = {
  open: boolean;
  onClose: () => void;
  onCreated: (record: WordRecord) => void;
};

const sheetVariants = {
  hidden: { x: "6%", opacity: 0 },
  visible: { x: "0%", opacity: 1 },
  exit: { x: "6%", opacity: 0 },
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 },
  exit: { opacity: 0 },
};

const defaultValues: WordFormValues = {
  word: "",
  reading: undefined,
  contextExpl: undefined,
  sceneDesc: undefined,
  example: undefined,
  difficulty: "medium",
  hint: undefined,
  locale: "ja",
};

const TodaySheet = ({ open, onClose, onCreated }: TodaySheetProps) => {
  const wordInputRef = useRef<HTMLInputElement | null>(null);
  const { withErrorToast } = useApi();
  const form = useZodForm(wordFormSchema, { defaultValues });
  const wordField = form.register("word");

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [generationMeta, setGenerationMeta] = useState<
    { provider: string; latencyMs: number; model?: string } | undefined
  >(undefined);

  const wordValue = form.watch("word");

  useEffect(() => {
    if (open) {
      form.reset(defaultValues);
      setGenerationMeta(undefined);
      setIsGenerating(false);
      setIsSubmitting(false);
      setTimeout(() => wordInputRef.current?.focus(), 10);
    }
  }, [open, form]);

  const handleSubmit = useCallback(
    async (values: WordFormValues) => {
      setIsSubmitting(true);
      try {
        const created = await withErrorToast(
          () => createWord(toWordCreateInput(values)),
          "保存失败，请检查必填项",
        );
        onCreated(created);
        toast.success("已保存到今日列表");
        onClose();
      } finally {
        setIsSubmitting(false);
      }
    },
    [onClose, onCreated, withErrorToast],
  );

  useEffect(() => {
    if (!open) return;
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      }
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        event.preventDefault();
        void form.handleSubmit(handleSubmit)();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [form, handleSubmit, onClose, open]);

  const handleGenerate = useCallback(async () => {
    const word = form.getValues("word");
    if (!word.trim()) {
      form.setError("word", { message: "请先输入要学习的单词" });
      wordInputRef.current?.focus();
      return;
    }
    setIsGenerating(true);
    try {
      const input = form.getValues();
      const result = await withErrorToast(
        () =>
          generateWord({
            word: input.word,
            hint: input.hint,
            locale: input.locale ?? "ja",
          }),
        "生成失败，请稍后重试",
      );
      form.setValue("reading", result.output.reading);
      form.setValue("contextExpl", result.output.contextExpl);
      form.setValue("sceneDesc", result.output.sceneDesc);
      form.setValue("example", result.output.example);
      setGenerationMeta({
        provider: result.provider,
        latencyMs: result.latencyMs,
        model: result.model,
      });
      toast.success("生成完成，可继续微调内容");
    } finally {
      setIsGenerating(false);
    }
  }, [form, withErrorToast]);

  const disableSubmit = useMemo(
    () => isSubmitting || isGenerating || !wordValue.trim(),
    [isGenerating, isSubmitting, wordValue],
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <motion.div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={overlayVariants}
        onClick={onClose}
      />

      <motion.div
        role="dialog"
        aria-modal="true"
        className="absolute right-0 top-0 h-full w-full max-w-2xl bg-surface text-foreground shadow-2xl"
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={sheetVariants}
      >
        <div className="flex items-center justify-between border-b border-border px-6 py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">
              今日学习
            </p>
            <h3 className="text-xl font-bold leading-tight">
              新增词条 / 生成 / 微调
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {generationMeta ? (
              <div className="rounded-md bg-surface-soft px-3 py-2 text-xs text-muted">
                {generationMeta.provider}
                {" · "}
                {generationMeta.latencyMs} ms
                {generationMeta.model ? ` · ${generationMeta.model}` : ""}
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              aria-label="关闭创建面板"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="h-[calc(100%-64px)] overflow-y-auto px-6 pb-6 pt-4">
          <Form {...form}>
            <form
              className="space-y-5"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="grid gap-4 md:grid-cols-2">
                <FormItem>
                  <FormLabel htmlFor="word">单词 *</FormLabel>
                  <Input
                    id="word"
                    placeholder="例如：習う / 学ぶ"
                    {...wordField}
                    ref={(el) => {
                      wordField.ref(el);
                      wordInputRef.current = el;
                    }}
                    aria-required
                  />
                  <FormMessage>
                    {form.formState.errors.word?.message}
                  </FormMessage>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="reading">读音</FormLabel>
                  <Input
                    id="reading"
                    placeholder="ならう"
                    {...form.register("reading")}
                  />
                  <FormDescription>可手动覆盖 AI 结果</FormDescription>
                </FormItem>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <FormItem>
                  <FormLabel htmlFor="contextExpl">释义 / 场景</FormLabel>
                  <Textarea
                    id="contextExpl"
                    rows={3}
                    placeholder="记忆提示、使用语境"
                    {...form.register("contextExpl")}
                  />
                  <FormMessage>
                    {form.formState.errors.contextExpl?.message}
                  </FormMessage>
                </FormItem>
                <FormItem>
                  <FormLabel htmlFor="sceneDesc">情景描述</FormLabel>
                  <Textarea
                    id="sceneDesc"
                    rows={3}
                    placeholder="在什么场景看到/听到这个词？"
                    {...form.register("sceneDesc")}
                  />
                  <FormMessage>
                    {form.formState.errors.sceneDesc?.message}
                  </FormMessage>
                </FormItem>
              </div>

              <FormItem>
                <FormLabel htmlFor="example">例句</FormLabel>
                <Textarea
                  id="example"
                  rows={3}
                  placeholder="例：子どもの頃に習った歌をまだ覚えている。"
                  {...form.register("example")}
                />
                <FormMessage>
                  {form.formState.errors.example?.message}
                </FormMessage>
              </FormItem>

              <div className="grid gap-4 md:grid-cols-3">
                <FormItem>
                  <FormLabel htmlFor="difficulty">难度</FormLabel>
                  <Select
                    id="difficulty"
                    {...form.register("difficulty")}
                    defaultValue={form.getValues("difficulty")}
                  >
                    <option value="easy">简单</option>
                    <option value="medium">适中</option>
                    <option value="hard">困难</option>
                  </Select>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="hint">生成提示</FormLabel>
                  <Input
                    id="hint"
                    placeholder="可选：方言、语域、记忆点"
                    {...form.register("hint")}
                  />
                  <FormDescription>不保存，只用于生成</FormDescription>
                </FormItem>

                <FormItem>
                  <FormLabel htmlFor="locale">语言</FormLabel>
                  <Select id="locale" {...form.register("locale")}>
                    <option value="ja">日语</option>
                    <option value="zh">中文</option>
                    <option value="en">英语</option>
                  </Select>
                </FormItem>
              </div>

              <FadeIn className="flex flex-wrap items-center gap-3">
                <Button
                  type="button"
                  variant="subtle"
                  size="md"
                  onClick={handleGenerate}
                  disabled={isGenerating || !wordValue.trim()}
                >
                  {isGenerating ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Wand2 className="h-4 w-4" />
                  )}
                  调用 AI 生成
                </Button>

                <Button type="submit" size="md" disabled={disableSubmit}>
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Sparkles className="h-4 w-4" />
                  )}
                  保存到今日
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  size="md"
                  onClick={onClose}
                >
                  取消
                  <ArrowRight className="h-4 w-4" />
                </Button>

                <p className="text-xs text-muted">
                  快捷键：Ctrl/Cmd + Enter 提交，Esc 关闭
                </p>
              </FadeIn>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  );
};

export default TodaySheet;
