import { useState } from "react";
import { FineTuningPage } from "./FineTuningPage";
import { Dashboard } from "./components/dashboard/Dashboard";

export default function App() {
  const [currentView, setCurrentView] = useState<"dashboard" | "fine-tuning">(
    "dashboard"
  );

  return (
    <>
      {currentView === "dashboard" && (
        <Dashboard
          onNavigateToFineTuning={() => setCurrentView("fine-tuning")}
        />
      )}
      {currentView === "fine-tuning" && (
        <div>
          <div className="fixed top-4 left-4 z-50">
            <button
              onClick={() => setCurrentView("dashboard")}
              className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              ← Back to Dashboard
            </button>
          </div>
          <FineTuningPage />
        </div>
      )}
    </>
  );
}
