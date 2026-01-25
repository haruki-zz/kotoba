import { MoonStar, SunMedium } from "lucide-react";

import { useTheme } from "../../theme/theme-provider.js";
import { Button } from "../ui/button.js";

const ThemeToggle = () => {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  return (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      aria-label="Toggle theme"
      onClick={toggleTheme}
      className="gap-2"
    >
      {isDark ? (
        <MoonStar className="h-4 w-4" />
      ) : (
        <SunMedium className="h-4 w-4" />
      )}
      <span className="text-xs font-semibold uppercase tracking-wide">
        {isDark ? "Dark" : "Light"}
      </span>
    </Button>
  );
};

export default ThemeToggle;
