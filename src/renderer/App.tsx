import AddWordForm from "./components/AddWordForm";
import ActivityOverview from "./components/ActivityOverview";
import DataTransferPanel from "./components/DataTransferPanel";
import ReviewSession from "./components/ReviewSession";

const App = () => (
  <main className="app-shell space-y-8">
    <ActivityOverview />
    <ReviewSession />
    <AddWordForm />
    <DataTransferPanel />
  </main>
);

export default App;
