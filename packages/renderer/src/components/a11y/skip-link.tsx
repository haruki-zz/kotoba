import { cn } from "../../lib/utils.js";

const SkipLink = () => (
  <a
    href="#main-content"
    className={cn(
      "sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4",
      "z-50 rounded-md bg-surface px-4 py-2 text-sm font-semibold text-foreground",
      "shadow-soft ring-1 ring-border",
    )}
  >
    Skip to main content
  </a>
);

export default SkipLink;
