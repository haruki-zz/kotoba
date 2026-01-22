import fs from "node:fs";
import path from "node:path";

import {
  AppSettings,
  appSettingsSchema,
  defaultExampleStyle,
} from "@kotoba/shared";

const SETTINGS_FILENAME = "settings.json";

const ensureDirectory = (filePath: string) => {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
};

export const resolveSettingsPath = (customPath?: string) => {
  if (customPath) {
    ensureDirectory(customPath);
    return customPath;
  }
  const target = path.resolve(process.cwd(), "data", SETTINGS_FILENAME);
  ensureDirectory(target);
  return target;
};

export class SettingsService {
  constructor(private readonly filePath = resolveSettingsPath()) {}

  getSettings(): AppSettings {
    if (!fs.existsSync(this.filePath)) {
      return appSettingsSchema.parse({
        exampleStyle: defaultExampleStyle(),
      });
    }

    const raw = fs.readFileSync(this.filePath, "utf-8");
    const parsed = JSON.parse(raw) as unknown;
    return appSettingsSchema.parse(parsed);
  }

  updateSettings(partial: Partial<AppSettings>): AppSettings {
    const current = this.getSettings();
    const merged: AppSettings = {
      ...current,
      ...partial,
      exampleStyle: {
        ...current.exampleStyle,
        ...(partial.exampleStyle ?? {}),
      },
    };
    const validated = appSettingsSchema.parse(merged);
    ensureDirectory(this.filePath);
    fs.writeFileSync(
      this.filePath,
      JSON.stringify(validated, null, 2),
      "utf-8",
    );
    return validated;
  }
}
