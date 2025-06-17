import { useState, useEffect } from "react";
import Playground from "./Playground";
import { FineTuningDemo } from "./FineTuningDemo";
import {
  fetchSavedModels,
  type SavedModel,
  pushHFModel,
  createOllamaModel,
  listDatasets,
  type DatasetInfo,
} from "@/services/api";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "react-hot-toast";
import { Pencil, Check, X } from "lucide-react";
import Settings from "./Settings";
import HFModelBrowserPage from "@/components/aicomponent/HFModelBrowserPage";

// Add updateModelName API helper
async function updateModelName(id: string, name: string) {
  const res = await fetch(`/api/v1/user-models/${id}/rename`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  if (!res.ok) throw new Error("Failed to update name");
  return res.json();
}

const MENU = [
  { key: "tuning", label: "Fine-Tuning" },
  { key: "models", label: "Saved Models" },
  { key: "hfmodels", label: "HF Model Browser" },
  { key: "datasets", label: "Datasets" },
  { key: "analytics", label: "Analytics" },
  { key: "playground", label: "Playground" },
  { key: "settings", label: "Settings" },
];

export default function Dashboard() {
  const [active, setActive] = useState("playground");
  // Saved Models state
  const [models, setModels] = useState<SavedModel[]>([]);
  // Model name editing logic
  // Use a map to track edit state for each model
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState<string>("");

  useEffect(() => {
    if (active === "models") {
      fetchSavedModels()
        .then((data) => setModels(data))
        .catch(() => setModels([]));
    }
  }, [active]);

  // Analytics state
  const [analytics, setAnalytics] = useState<{
    total_tasks: number;
    average_progress: number;
  } | null>(null);
  useEffect(() => {
    if (active === "analytics") {
      fetch("/api/v1/analytics/")
        .then((r) => r.json())
        .then(setAnalytics)
        .catch(() => setAnalytics(null));
    }
  }, [active]);

  const [datasets, setDatasets] = useState<DatasetInfo[]>([]);

  useEffect(() => {
    if (active === "datasets") {
      listDatasets()
        .then(setDatasets)
        .catch(() => setDatasets([]));
    }
  }, [active]);

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditName(name);
  };
  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };
  const saveEdit = async (id: string) => {
    try {
      await updateModelName(id, editName.trim());
      setModels((prev) =>
        prev.map((m) => (m.id === id ? { ...m, name: editName.trim() } : m)),
      );
      toast.success("Model name updated");
      cancelEdit();
    } catch {
      toast.error("Failed to update name");
    }
  };

  const pushModel = async (model: SavedModel) => {
    if (!model.local_path) {
      toast.error("Model path unknown");
      return;
    }
    const repoName = prompt("HuggingFace repo name", model.name);
    if (!repoName) return;
    try {
      await pushHFModel(model.local_path, repoName);
      toast.success("Pushed to HuggingFace");
    } catch {
      toast.error("Push failed");
    }
  };

  const loadToOllama = async (model: SavedModel) => {
    if (!model.local_path) {
      toast.error("Model path unknown");
      return;
    }
    const modelfile = prompt("Path to Modelfile", "");
    if (!modelfile) return;
    const gguf = prompt("Path to GGUF file (optional)", "");
    try {
      await createOllamaModel(model.name, modelfile, gguf || undefined);
      toast.success("Loaded into Ollama");
    } catch {
      toast.error("Failed to load model");
    }
  };

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      {/* Side Menu */}
      <aside className="w-56 bg-black/40 border-r border-purple-900/40 flex flex-col py-8 px-4">
        <h2 className="text-xl font-bold text-white mb-8">CodeTune</h2>
        <nav className="flex flex-col gap-2">
          {MENU.map((item) => (
            <button
              key={item.key}
              className={`text-left px-3 py-2 rounded font-medium transition-colors text-white/80 hover:bg-purple-800/40 ${
                active === item.key ? "bg-purple-700/60 text-white" : ""
              }`}
              onClick={() => setActive(item.key)}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </aside>
      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {active === "tuning" && <FineTuningDemo />}
        {active === "models" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Saved Models</h2>
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Models</CardTitle>
              </CardHeader>
              <CardContent>
                {models.length === 0 ? (
                  <div className="text-gray-300">No saved models.</div>
                ) : (
                  <div className="space-y-4">
                    {models.map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center gap-4 bg-black/30 rounded p-3"
                      >
                        {editingId === m.id ? (
                          <>
                            <Input
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-64 bg-card border border-border text-primary"
                              maxLength={64}
                            />
                            <Button
                              size="icon"
                              onClick={() => saveEdit(m.id)}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Check className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              onClick={cancelEdit}
                              className="bg-red-600 hover:bg-red-700"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-white text-lg">
                              {m.name}
                            </span>
                            <Button
                              size="icon"
                              onClick={() => startEdit(m.id, m.name)}
                              className="bg-secondary hover:bg-secondary/80"
                            >
                              <Pencil className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        <div className="ml-auto text-xs text-gray-400">
                          {Object.entries(m.parameters || {}).map(([k, v]) => (
                            <span key={k} className="mr-2">
                              <strong>{k}:</strong> {String(v)}
                            </span>
                          ))}
                          {m.result && "loss" in m.result && (
                            <span className="ml-2 text-purple-300">
                              Loss: {String(m.result?.loss)}
                            </span>
                          )}
                          {m.local_path && (
                            <>
                              <Button
                                size="sm"
                                className="ml-2 bg-primary hover:bg-primary/80"
                                onClick={() => pushModel(m)}
                              >
                                Push to HF
                              </Button>
                              <Button
                                size="sm"
                                className="ml-2 bg-secondary hover:bg-secondary/80"
                                onClick={() => loadToOllama(m)}
                              >
                                Load to Ollama
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {active === "hfmodels" && <HFModelBrowserPage />}
        {active === "datasets" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Datasets</h2>
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Uploaded Datasets</CardTitle>
              </CardHeader>
              <CardContent>
                <table className="w-full text-left text-gray-300">
                  <thead>
                    <tr>
                      <th className="py-2">Name</th>
                      <th>Size</th>
                    </tr>
                  </thead>
                  <tbody>
                    {datasets.map((d) => (
                      <tr key={d.path}>
                        <td className="py-2">{d.name}</td>
                        <td>{(d.size / 1024).toFixed(1)} KB</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
        {active === "analytics" && (
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Analytics</h2>
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">System Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                {analytics ? (
                  <div className="space-y-2 text-gray-300">
                    <div>
                      Total Tuning Tasks:{" "}
                      <span className="font-bold text-white">
                        {analytics.total_tasks}
                      </span>
                    </div>
                    <div>
                      Average Progress:{" "}
                      <span className="font-bold text-white">
                        {analytics.average_progress?.toFixed(2)}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-gray-400">
                    No analytics data available.
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}
        {active === "playground" && <Playground />}
        {active === "settings" && <Settings />}
      </main>
    </div>
  );
}
