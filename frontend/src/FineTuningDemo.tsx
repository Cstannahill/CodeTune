import { useState, useEffect, useRef } from "react";
import { Pencil, Check, X } from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Line } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Tooltip,
  Legend
);
import { Brain, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import type { SimpleMessage } from "@/components/chat/ChatMessage";
import {
  assistantChat,
  type ChatMessage,
  fetchSavedModels,
  saveModel,
  type SavedModel,
  createTuning,
  getTuningProgress,
  fetchModels,
  fetchOllamaModels,
} from "@/services/api";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import { FineTuningPresetSelector } from "@/components/aicomponent/FineTuningPresetSelector";
// import { SavedModelList } from "@/components/aicomponent/SavedModelList";
import { type FineTuningPreset } from "@/presets";
import { SiHuggingface, SiOllama } from "react-icons/si";
import { toast, Toaster } from "react-hot-toast";

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

export function FineTuningDemo() {
  interface ModelItem {
    id: string;
    source: "hf" | "ollama";
  }
  const [activeTab, setActiveTab] = useState("tuning");
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [datasetId, setDatasetId] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [uploading, setUploading] = useState(false);
  const [epochs, setEpochs] = useState(3);
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.00005);
  const [quantization, setQuantization] = useState("none");
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [qualityLoss, setQualityLoss] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<SimpleMessage[]>(
    []
  );
  const [assistantLoading, setAssistantLoading] = useState(false);
  const [assistantInput, setAssistantInput] = useState("");
  const [training, setTraining] = useState(false);
  const [preset, setPreset] = useState<FineTuningPreset | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<number[]>([]);
  const [savedModels, setSavedModels] = useState<SavedModel[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null);
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([
    { id: "None Selected", source: "ollama" },
  ]);
  const [trainingModel, setTrainingModel] = useState<string>("gpt-3.5-turbo");
  const [modelSaved, setModelSaved] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [timeRemaining, setTimeRemaining] = useState<string | null>(null);
  const [modelName, setModelName] = useState<string>("No Name");
  const [editingModelName, setEditingModelName] = useState(false);
  const [modelNameEdit, setModelNameEdit] = useState<string | null>(null);
  const [pushToHf, setPushToHf] = useState(false);

  useEffect(() => {
    fetchSavedModels()
      .then(setSavedModels)
      .catch(() => setSavedModels([]));
  }, []);
  useEffect(() => {
    console.log("Loading models...");
    Promise.all([fetchModels(), fetchOllamaModels()])
      .then(([hf, local]) => {
        const items: ModelItem[] = [
          ...hf.map((m) => ({ id: m.id, source: "hf" as const })),
          ...local.map((id) => ({ id, source: "ollama" as const })),
        ];
        setAvailableModels(items);
      })
      .catch((error) => {
        console.error("Error loading models:", error);
        setAvailableModels([]);
      });
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

const handleDatasetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setDatasetFile(file);
      setUploading(true);
      setUploadProgress(0);
      uploadDataset(file, setUploadProgress)
        .then((res) => {
          setDatasetId(res.dataset_id);
          toast.success("Dataset uploaded");
        })
        .catch(() => toast.error("Upload failed"))
        .finally(() => setUploading(false));
  }
};

  const applyPreset = (p: FineTuningPreset) => {
    setPreset(p);
    setEpochs(p.epochs);
    setTrainingSteps(p.trainingSteps);
    setLearningRate(p.learningRate);
    setQuantization(p.quantization);
  };

  const startTraining = async () => {
    if (!datasetId) return;
    setTraining(true);
    setTrainingProgress(0);
    setAnalysis(null);
    setQualityLoss(null);
    setTrainingHistory([]);
    setStartTime(Date.now());
    setTimeRemaining(null);
    const task = await createTuning({
      dataset_id: datasetId,
      parameters: {
        repo_id: trainingModel,
        name: modelName,
        push: pushToHf,
        epochs,
        trainingSteps,
        learningRate,
        quantization,
      },
    });
    if (intervalRef.current) clearInterval(intervalRef.current);
    intervalRef.current = setInterval(async () => {
      try {
        const prog = await getTuningProgress(task.id);
        const pct = prog.progress <= 1 ? prog.progress * 100 : prog.progress;
        setTrainingProgress(Math.round(pct));
        // Estimate time remaining
        if (startTime && pct > 0 && pct < 100) {
          const elapsed = (Date.now() - startTime) / 1000; // seconds
          const estTotal = elapsed / (pct / 100);
          const remaining = estTotal - elapsed;
          setTimeRemaining(
            remaining > 0
              ? `${Math.floor(remaining / 60)}m ${Math.round(
                  remaining % 60
                )}s left`
              : null
          );
        } else if (pct >= 100) {
          setTimeRemaining(null);
        }
        if (prog.result && "loss" in prog.result) {
          setQualityLoss(prog.result.loss as number);
        }
        setAnalysis(prog.status);
        if (prog.status === "completed" || prog.status === "failed") {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setTraining(false);
          setAnalysis(
            prog.status === "completed"
              ? "Training complete"
              : "Training failed"
          );
        }
      } catch {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setTraining(false);
        setAnalysis("Error fetching progress");
      }
    }, 2000);
  };

  const handleSaveModel = async () => {
    if (!datasetId || qualityLoss === null || modelSaved) return;
    const name = modelName.trim() || `model-${Date.now()}`;
    const payload = {
      name,
      dataset_id: datasetId,
      parameters: { epochs, trainingSteps, learningRate, quantization },
      result: { loss: qualityLoss },
    };
    try {
      const saved = await saveModel(payload);
      setSavedModels((prev) => [saved, ...prev]);
      setModelSaved(true);
      if (saved.local_path) {
        toast.success(
          `Model saved successfully!\nLocation: ${saved.local_path}`
        );
      } else {
        toast.success("Model saved successfully, but save path is unknown.");
      }
    } catch {
      toast.error("Failed to save model");
    }
  };

  const handleImportModel = (id: string) => {
    setSelectedModelId(id);
    const model = savedModels.find((m) => m.id === id);
    if (model && model.parameters) {
      const p = model.parameters as {
        epochs?: number;
        trainingSteps?: number;
        learningRate?: number;
        quantization?: string;
      };
      if (p.epochs !== undefined) setEpochs(p.epochs);
      if (p.trainingSteps !== undefined) setTrainingSteps(p.trainingSteps);
      if (p.learningRate !== undefined) setLearningRate(p.learningRate);
      if (p.quantization !== undefined)
        setQuantization(p.quantization as "none" | "int8" | "int4");
    }
  };

  const handleAssistantSend = async () => {
    if (!assistantInput.trim()) return;
    const userMsg: SimpleMessage = {
      id: Date.now().toString() + "_assist_user",
      type: "player",
      sender: "You",
      content: assistantInput,
      timestamp: new Date(),
    };
    setAssistantMessages((prev) => [...prev, userMsg]);
    setAssistantLoading(true);
    setAssistantInput("");
    const chatHistory: ChatMessage[] = [...assistantMessages, userMsg].map(
      (m) => ({
        role: m.type === "dm" ? "assistant" : "user",
        content: m.content,
      })
    );
    try {
      const response = await assistantChat(chatHistory);
      const aiMsg: SimpleMessage = {
        id: Date.now().toString() + "_assist_ai",
        type: "dm",
        sender: "Helper AI",
        content: response,
        timestamp: new Date(),
      };
      setAssistantMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("Assistant error:", err);
    } finally {
      setAssistantLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAssistantSend();
    }
  };

  // Add edit/save/cancel logic for model name after saving
  const handleEditModelName = () => {
    setModelNameEdit(modelName);
    setEditingModelName(true);
  };
  const handleCancelEditModelName = () => {
    setEditingModelName(false);
    setModelNameEdit("");
  };
  const handleSaveModelNameEdit = async () => {
    try {
      await updateModelName(savedModels[0]?.id, modelNameEdit.trim());
      setModelName(modelNameEdit.trim());
      setSavedModels((prev) =>
        prev.map((m, i) => (i === 0 ? { ...m, name: modelNameEdit.trim() } : m))
      );
      toast.success("Model name updated");
      setEditingModelName(false);
    } catch {
      toast.error("Failed to update name");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: "#18181b",
            color: "#fff",
            border: "1px solid #a78bfa",
          },
          success: { iconTheme: { primary: "#34d399", secondary: "#18181b" } },
          error: { iconTheme: { primary: "#f87171", secondary: "#18181b" } },
        }}
      />
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6" /> Fine-Tune AI DM
        </h1>
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList>
            <TabsTrigger value="tuning">Fine-Tuning</TabsTrigger>
            <TabsTrigger value="datasets">Dataset Details</TabsTrigger>
            <TabsTrigger value="params">Training Parameters</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
            <TabsTrigger value="models">Model Management</TabsTrigger>
          </TabsList>

          <TabsContent value="tuning" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-white">
                    Training Configuration
                  </CardTitle>
                  <div className="flex items-center space-x-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Model
                    </label>

                    {
                      <Select
                        value={trainingModel}
                        onValueChange={setTrainingModel}
                      >
                        <SelectTrigger className="w-40 bg-card border border-border">
                          <SelectValue placeholder="Select model" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableModels &&
                            availableModels.map((model) => (
                              <SelectItem
                                key={model?.id || Math.random()}
                                value={model?.id || "None Selected"}
                              >
                                {model.source === "hf" ? (
                                  <SiHuggingface className="inline w-4 h-4 mr-2 align-text-bottom" />
                                ) : (
                                  <SiOllama className="inline w-4 h-4 mr-2 align-text-bottom" />
                                )}
                                {model.id ? model?.id : "No Model Selected"}
                              </SelectItem>
                            ))}
                          {savedModels &&
                            savedModels.map((m) => (
                              <SelectItem
                                key={m.id}
                                value={m.name === "" ? "None Selected" : m.name}
                              >
                                {m.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    }
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Upload Dataset
                  </label>
                  <Input type="file" onChange={handleDatasetChange} />
                  {datasetFile && (
                    <p className="text-xs text-gray-400">{datasetFile.name}</p>
                  )}
                  {uploading && (
                    <Progress value={uploadProgress} className="h-2" />
                  )}
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Model Name
                  </label>
                  <Input
                    value={modelName}
                    onChange={(e) => setModelName(e.target.value)}
                    placeholder="Name for new model"
                    className="w-64 bg-card border border-border text-primary"
                  />
                </div>
                {savedModels.length > 0 && (
                  <div className="space-y-1">
                    <label className="block text-sm font-medium text-muted-foreground">
                      Import Saved Model
                    </label>
                    <Select
                      value={selectedModelId ?? "none"}
                      onValueChange={handleImportModel}
                    >
                      <SelectTrigger className="w-56 bg-card border border-border">
                        <SelectValue placeholder="Select model" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {savedModels.map((m) => (
                          <SelectItem key={m.id} value={m.id}>
                            {m.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <FineTuningPresetSelector
                  value={preset?.id ?? null}
                  onValueChange={applyPreset}
                />
                {preset && (
                  <p className="text-xs text-gray-400">{preset.description}</p>
                )}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Training Epochs
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={epochs}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEpochs(parseInt(e.target.value))
                    }
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    More epochs can improve quality but may overfit. Overfitting
                    happens when the model memorizes the training set and
                    performs poorly on new prompts.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Training Steps
                  </label>
                  <Input
                    type="number"
                    min="1"
                    value={trainingSteps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTrainingSteps(parseInt(e.target.value))
                    }
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    Higher values take longer but usually yield better results.
                    Too few steps might underfit the data and miss important
                    patterns.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Learning Rate
                  </label>
                  <Input
                    type="number"
                    step="0.00001"
                    min="0"
                    value={learningRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLearningRate(parseFloat(e.target.value))
                    }
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    Lower values train steadily; high values risk divergence,
                    where the loss increases and training becomes unstable.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">
                    Quantization
                  </label>
                  <Select value={quantization} onValueChange={setQuantization}>
                    <SelectTrigger className="bg-card border border-border text-primary w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      <SelectItem value="int8">Int8</SelectItem>
                      <SelectItem value="int4">Int4</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Reduces model size and speeds inference but may lower
                    quality. Int8 preserves more accuracy than Int4, which is
                    smaller but less precise.
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    id="pushhf"
                    type="checkbox"
                    className="accent-purple-500"
                    checked={pushToHf}
                    onChange={(e) => setPushToHf(e.target.checked)}
                  />
                  <label htmlFor="pushhf" className="text-sm text-muted-foreground">
                    Push to HuggingFace after training
                  </label>
                </div>
                <Button
                  onClick={startTraining}
                  disabled={training || !datasetId || uploading}
                  className="bg-primary hover:bg-primary/80"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {training ? "Training..." : "Start Training"}
                </Button>
                {!training && analysis && (
                  <Button
                    onClick={handleSaveModel}
                    disabled={
                      training ||
                      !datasetId ||
                      qualityLoss === null ||
                      modelSaved
                    }
                    className="ml-2 bg-secondary hover:bg-secondary/80"
                  >
                    {modelSaved ? "Model Saved" : "Save Model"}
                  </Button>
                )}
                {training && (
                  <div className="w-full flex flex-col items-center gap-2">
                    <div className="w-full relative flex items-center justify-center">
                      <Progress
                        value={trainingProgress}
                        className="h-6 bg-gradient-to-r from-purple-500 via-blue-500 to-green-400 border border-purple-500/40 shadow-lg"
                      />
                      <span
                        className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-white font-mono text-base font-bold drop-shadow"
                        style={{ pointerEvents: "none" }}
                      >
                        {trainingProgress}%
                      </span>
                    </div>
                    {timeRemaining && (
                      <span className="text-xs text-purple-300 tracking-wide animate-pulse">
                        Est. time left: {timeRemaining}
                      </span>
                    )}
                    <span className="text-xs text-purple-300 tracking-wide animate-pulse">
                      {trainingProgress < 100
                        ? `Training in progress...`
                        : analysis || "Training complete!"}
                    </span>
                  </div>
                )}
                {analysis && (
                  <div className="text-sm text-gray-300">
                    {analysis.replace(/_/g, " ")}
                    {qualityLoss !== null && ` (loss: ${qualityLoss})`}
                  </div>
                )}
                {!training &&
                  analysis &&
                  qualityLoss !== null &&
                  !modelSaved && (
                    <div className="flex items-center gap-2 mt-2">
                      <Input
                        value={modelName}
                        onChange={(e) => setModelName(e.target.value)}
                        placeholder="Enter model name"
                        className="w-64 bg-card border border-border text-primary"
                        maxLength={64}
                      />
                      <Button
                        onClick={handleSaveModel}
                        disabled={
                          modelSaved || !datasetFile || qualityLoss === null
                        }
                        className="bg-secondary hover:bg-secondary/80"
                      >
                        Save Model
                      </Button>
                    </div>
                  )}
                {!training && analysis && modelSaved && (
                  <div className="flex items-center gap-2 mt-2">
                    {editingModelName ? (
                      <>
                        <Input
                          value={modelNameEdit}
                          onChange={(e) => setModelNameEdit(e.target.value)}
                          className="w-64 bg-card border border-border text-primary"
                          maxLength={64}
                        />
                        <Button
                          size="icon"
                          onClick={handleSaveModelNameEdit}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          onClick={handleCancelEditModelName}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </>
                    ) : (
                      <>
                        <Input
                          value={modelName}
                          onChange={() => {}}
                          className="w-64 bg-card border border-border text-primary"
                          maxLength={64}
                          disabled
                        />
                        <Button
                          size="icon"
                          onClick={handleEditModelName}
                          className="bg-secondary hover:bg-secondary/80"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </>
                    )}
                    <Button
                      disabled
                      className="bg-secondary/50 cursor-not-allowed"
                    >
                      Model Saved
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Dataset Guidelines</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm text-gray-300">
                <p>
                  Datasets should be provided in JSONL format with an{" "}
                  <code>input</code> and <code>output</code> for each example.
                </p>
                <p>Example:</p>
                <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">{`{"input": "Question", "output": "Answer"}`}</pre>
                <p>
                  Include varied samples that reflect the tasks you want the
                  model to learn.
                </p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Dataset Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-gray-300">
                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Image Classification: Distinguishing Pneumonia from Chest
                    X-rays
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"image_path": "patient001_xray.png", "diagnosis": "pneumonia"}`}
                  </pre>
                  <p>
                    About 5k–10k labeled images help a CNN learn visual patterns
                    of pneumonia and generalize across patients.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Sentiment Analysis: Analyzing Product Reviews
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"review_id": "rev001", "review_text": "Great value!", "sentiment": "positive"}`}
                  </pre>
                  <p>
                    Tens of thousands of reviews teach a language model to map
                    phrases to positive, negative, or neutral sentiment.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Machine Translation: Translating Legal Documents
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"source_text": "This agreement...", "target_text": "Le présent contrat..."}`}
                  </pre>
                  <p>
                    Hundreds of thousands of parallel sentences capture legal
                    terminology so a transformer model produces accurate
                    translations.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Object Detection: Identifying Defects in Manufacturing
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"image_id": "partA_img001.jpg", "defects": [{"label": "scratch", "bbox": [150,300,50,120]}]}`}
                  </pre>
                  <p>
                    Thousands of annotated images let detection models locate
                    and classify scratches, dents, or cracks.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Tabular Data for Fraud Detection
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"transaction_id": "txn_1001", "amount": 125.5, "is_fraud": 0}`}
                  </pre>
                  <p>
                    Millions of transactions highlight rare fraudulent patterns
                    so tree-based or neural models can flag suspicious activity.
                  </p>
                </div>

                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Time Series Forecasting: Predicting Electricity Demand
                  </p>
                  <p>JSONL snippet:</p>
                  <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">
                    {`{"timestamp": "2025-07-01T00:00:00Z", "demand_MW": 1500}`}
                  </pre>
                  <p>
                    Several years of hourly readings let forecasting models
                    capture seasonality, trends, and the impact of weather.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="params" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">
                  Training Parameters
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Parameter</TableHead>
                      <TableHead>Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>
                        <code>learning_rate</code>
                      </TableCell>
                      <TableCell>
                        Controls how quickly weights are updated. Lower rates
                        lead to steady training while very high rates may cause
                        divergence.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>num_train_epochs</code>
                      </TableCell>
                      <TableCell>
                        Number of full passes over the dataset. More epochs can
                        refine quality but too many may overfit and hurt
                        generalization.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>training_steps</code>
                      </TableCell>
                      <TableCell>
                        Total optimization steps to run. Higher values yield
                        better results at the cost of longer training time.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>
                        <code>quantization</code>
                      </TableCell>
                      <TableCell>
                        Precision of the stored weights. Int8 balances size and
                        accuracy, whereas int4 is even smaller but less precise.
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Training Results</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {trainingHistory.length > 0 ? (
                  <Line
                    options={{
                      responsive: true,
                      plugins: { legend: { display: false } },
                      scales: { y: { beginAtZero: true } },
                    }}
                    data={{
                      labels: trainingHistory.map((_, i) => `Epoch ${i + 1}`),
                      datasets: [
                        {
                          label: "Loss",
                          data: trainingHistory,
                          borderColor: "rgb(99,102,241)",
                          backgroundColor: "rgba(99,102,241,0.5)",
                        },
                      ],
                    }}
                  />
                ) : (
                  <p className="text-gray-300">No training results yet.</p>
                )}
                {qualityLoss !== null && (
                  <p className="text-sm text-gray-300">
                    Final loss: {qualityLoss}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="models" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Model Management</CardTitle>
              </CardHeader>
              <CardContent>
                {savedModels.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {savedModels.map((m) => {
                      const params =
                        (m.parameters as Record<string, unknown>) || {};
                      const result =
                        (m.result as Record<string, unknown>) || {};
                      return (
                        <Card
                          key={m.id}
                          className="bg-black/20 border-purple-500/20"
                        >
                          <CardHeader>
                            <CardTitle className="text-white">
                              {m.name}
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="space-y-2 text-sm text-gray-300">
                            {Object.entries(params).map(([k, v]) => (
                              <p key={k}>
                                <strong>{k}:</strong> {String(v)}
                              </p>
                            ))}
                            {"loss" in result && (
                              <p>
                                <strong>Loss:</strong> {String(result["loss"])}
                              </p>
                            )}
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-gray-300">No saved models.</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Sticky Assistant Chat */}
      <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2">
        <Card className="bg-black/80 border-purple-500/50 flex flex-col max-h-96">
          <CardHeader className="py-2">
            <CardTitle className="text-white text-sm">
              Fine-tuning Assistant
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-2">
            <div data-slot="assistant-chat" className="space-y-2">
              {assistantMessages.map((m) => (
                <ChatMessageComponent key={m.id} message={m} />
              ))}
              {assistantLoading && (
                <div className="text-sm italic text-gray-400">
                  Helper AI is thinking...
                </div>
              )}

              <div className="relative">
                <Input
                  value={assistantInput}
                  onChange={(e) => setAssistantInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Ask for help..."
                  className="w-full bg-card border border-border pr-10"
                />
                <Button
                  onClick={handleAssistantSend}
                  disabled={!assistantInput.trim()}
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 bg-primary hover:bg-primary/80 rounded-md"
                >
                  <Send className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
