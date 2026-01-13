import AddWordForm from "./components/AddWordForm";
import ActivityOverview from "./components/ActivityOverview";
import DataTransferPanel from "./components/DataTransferPanel";
import ReviewSession from "./components/ReviewSession";
import SettingsPanel from "./components/SettingsPanel";

const App = () => (
  <main className="app-shell space-y-8">
    <ActivityOverview />
    <ReviewSession />
    <AddWordForm />
    <DataTransferPanel />
    <SettingsPanel />
  </main>
);

export default App;
