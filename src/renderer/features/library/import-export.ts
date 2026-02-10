import { WordCreateWithMetaInput, WordView, wordCreateWithMetaSchema } from '@shared/types';

export type ImportParseResult = {
  rawItems: unknown[];
  normalized: WordCreateWithMetaInput[];
  errors: { index: number; message: string }[];
};

function normalize_json_payload(payload: unknown): unknown[] {
  if (Array.isArray(payload)) return payload;
  if (typeof payload === 'object' && payload !== null) {
    const maybe_items = (payload as { items?: unknown }).items;
    if (Array.isArray(maybe_items)) {
      return maybe_items;
    }
  }
  return [];
}

export function parse_import_text(text: string): ImportParseResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return {
      rawItems: [],
      normalized: [],
      errors: [{ index: -1, message: '文件不是有效的 JSON。' }],
    };
  }

  const rawItems = normalize_json_payload(parsed);
  if (rawItems.length === 0) {
    return {
      rawItems: [],
      normalized: [],
      errors: [{ index: -1, message: '未找到可导入的 items 数组。' }],
    };
  }

  const normalized: WordCreateWithMetaInput[] = [];
  const errors: { index: number; message: string }[] = [];

  rawItems.forEach((item, index) => {
    const safe = wordCreateWithMetaSchema.safeParse(item);
    if (!safe.success) {
      errors.push({
        index,
        message: safe.error.issues.map((issue) => issue.message).join('; '),
      });
      return;
    }
    normalized.push(safe.data);
  });

  return {
    rawItems,
    normalized,
    errors,
  };
}

export function download_export_json(items: WordView[], filename = 'kotoba-library-export.json') {
  const payload = {
    exportedAt: new Date().toISOString(),
    count: items.length,
    items,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}
