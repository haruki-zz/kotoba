import { Toaster } from "sonner";

import { useTheme } from "../../theme/theme-provider.js";

const AppToaster = () => {
  const { resolvedTheme } = useTheme();

  return (
    <Toaster
      position="top-right"
      theme={resolvedTheme === "dark" ? "dark" : "light"}
      closeButton
      richColors
    />
  );
};

export default AppToaster;
