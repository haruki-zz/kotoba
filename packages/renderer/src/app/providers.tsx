import type { ReactNode } from "react";

import AppToaster from "../components/feedback/toaster.js";
import ThemeProvider from "../theme/theme-provider.js";

const AppProviders = ({ children }: { children: ReactNode }) => (
  <ThemeProvider>
    {children}
    <AppToaster />
  </ThemeProvider>
);

export default AppProviders;
