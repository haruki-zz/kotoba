import AppProviders from "./providers.js";
import AppRoutes from "./routes.js";

const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

export default App;
