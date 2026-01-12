import AddWordForm from "./components/AddWordForm";
import ActivityOverview from "./components/ActivityOverview";
import ReviewSession from "./components/ReviewSession";

const App = () => (
  <main className="app-shell space-y-8">
    <ActivityOverview />
    <ReviewSession />
    <AddWordForm />
  </main>
);

export default App;
