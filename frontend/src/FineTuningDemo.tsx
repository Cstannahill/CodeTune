import { useState } from "react";
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
  Legend,
);
import { Brain, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { testFineTunedDM, type FineTuningRequest } from "@/services/api-mock";
import { ChatMessage } from "@/components/chat/ChatMessage";
import { FineTuningPresetSelector } from "@/components/aicomponent/FineTuningPresetSelector";
import { type FineTuningPreset } from "@/presets";

export function FineTuningDemo() {
  const [personality] = useState("classic");
  const [prompt] = useState("You are a helpful dungeon master.");
  const [keywords] = useState("");
  const [model] = useState("gpt-4");
  const [temperature] = useState(0.7);
  const [maxTokens] = useState(300);
  const [trainingData] = useState("");

  const [activeTab, setActiveTab] = useState("tuning");
  const [datasetFile, setDatasetFile] = useState<File | null>(null);
  const [epochs, setEpochs] = useState(3);
  const [trainingSteps, setTrainingSteps] = useState(1000);
  const [learningRate, setLearningRate] = useState(0.00005);
  const [quantization, setQuantization] = useState("none");
  const [trainingProgress, setTrainingProgress] = useState(0);
  const [qualityLoss, setQualityLoss] = useState<number | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [assistantMessages, setAssistantMessages] = useState<SimpleMessage[]>([]);
  const [assistantInput, setAssistantInput] = useState("");
  const [training, setTraining] = useState(false);
  const [preset, setPreset] = useState<FineTuningPreset | null>(null);
  const [trainingHistory, setTrainingHistory] = useState<number[]>([]);


  const buildRequest = (): FineTuningRequest => ({
    campaignStyle: personality,
    worldDescription: prompt,
    keyNPCs: [],
    campaignThemes: keywords
      .split(",")
      .map((k) => k.trim())
      .filter(Boolean),
    customPrompts: trainingData
      .split("\n")
      .map((l) => l.trim())
      .filter(Boolean),
    model,
    temperature,
    maxTokens,
    trainingData,
    trainingSteps,
    learningRate,
    quantization,
    sharePublicly: false,
  });


  const handleDatasetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDatasetFile(e.target.files[0]);
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
    setTraining(true);
    setTrainingProgress(0);
    setAnalysis(null);
    setQualityLoss(null);
    setTrainingHistory([]);
    const losses: number[] = [];
    for (let i = 1; i <= epochs; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const loss = Math.max(0, 5 - (i * (5 / epochs)) + Math.random());
      losses.push(parseFloat(loss.toFixed(2)));
      setTrainingHistory([...losses]);
      setTrainingProgress(Math.round((i / epochs) * 100));
    }
    setTraining(false);
    setAnalysis("Training complete");
    setQualityLoss(losses[losses.length - 1]);
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
    setAssistantInput("");
    const res = await testFineTunedDM(buildRequest(), userMsg.content);
    const aiMsg: SimpleMessage = {
      id: Date.now().toString() + "_assist_ai",
      type: "dm",
      sender: "Helper AI",
      content: res.response,
      timestamp: new Date(),
    };
    setAssistantMessages((prev) => [...prev, aiMsg]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-3xl mx-auto space-y-6">
        <h1 className="text-3xl font-bold text-white flex items-center gap-2">
          <Brain className="w-6 h-6" /> Fine-Tune AI DM
        </h1>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="tuning">Fine-Tuning</TabsTrigger>
            <TabsTrigger value="datasets">Dataset Details</TabsTrigger>
            <TabsTrigger value="params">Training Parameters</TabsTrigger>
            <TabsTrigger value="results">Results</TabsTrigger>
          </TabsList>


          <TabsContent value="tuning" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Training Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Upload Dataset</label>
                  <Input type="file" onChange={handleDatasetChange} />
                  {datasetFile && (
                    <p className="text-xs text-gray-400">{datasetFile.name}</p>
                  )}
                </div>
                <FineTuningPresetSelector value={preset?.id ?? null} onValueChange={applyPreset} />
                {preset && (
                  <p className="text-xs text-gray-400">{preset.description}</p>
                )}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Training Epochs</label>
                  <Input
                    type="number"
                    min="1"
                    value={epochs}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setEpochs(parseInt(e.target.value))}
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    More epochs can improve quality but may overfit. Overfitting
                    happens when the model memorizes the training set and
                    performs poorly on new prompts.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Training Steps</label>
                  <Input
                    type="number"
                    min="1"
                    value={trainingSteps}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTrainingSteps(parseInt(e.target.value))}
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    Higher values take longer but usually yield better results.
                    Too few steps might underfit the data and miss important
                    patterns.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Learning Rate</label>
                  <Input
                    type="number"
                    step="0.00001"
                    min="0"
                    value={learningRate}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setLearningRate(parseFloat(e.target.value))}
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    Lower values train steadily; high values risk divergence,
                    where the loss increases and training becomes unstable.
                  </p>
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Quantization</label>
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
                <Button onClick={startTraining} disabled={training || !datasetFile} className="bg-primary hover:bg-primary/80">
                  <Brain className="w-4 h-4 mr-2" />
                  {training ? "Training..." : "Start Training"}
                </Button>
                {training && (
                  <div className="mt-2">
                    <Progress value={trainingProgress} />
                  </div>
                )}
                {analysis && (
                  <div className="text-sm text-gray-300">
                    {analysis} {qualityLoss !== null && `(Quality loss: ${qualityLoss}%)`}
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
                  Datasets should be provided in JSONL format with an{' '}
                  <code>input</code> and <code>output</code> for each example.
                </p>
                <p>Example:</p>
                <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">{`{"input": "Question", "output": "Answer"}`}</pre>
                <p>Include varied samples that reflect the tasks you want the model to learn.</p>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Dataset Examples</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6 text-sm text-gray-300">
                <div className="space-y-2">
                  <p className="text-white font-semibold">
                    Image Classification: Distinguishing Pneumonia from Chest X-rays
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
                    Thousands of annotated images let detection models locate and
                    classify scratches, dents, or cracks.
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
                <CardTitle className="text-white">Training Parameters</CardTitle>
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
                      <TableCell><code>learning_rate</code></TableCell>
                      <TableCell>
                        Controls how quickly weights are updated. Lower rates
                        lead to steady training while very high rates may cause
                        divergence.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>num_train_epochs</code></TableCell>
                      <TableCell>
                        Number of full passes over the dataset. More epochs can
                        refine quality but too many may overfit and hurt
                        generalization.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>training_steps</code></TableCell>
                      <TableCell>
                        Total optimization steps to run. Higher values yield
                        better results at the cost of longer training time.
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>quantization</code></TableCell>
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
        </Tabs>
      </div>

      {/* Sticky Assistant Chat */}
      <div className="fixed bottom-4 right-4 w-80 z-50 space-y-2">
        <Card className="bg-black/80 border-purple-500/50 flex flex-col max-h-96">
          <CardHeader className="py-2">
            <CardTitle className="text-white text-sm">Fine-tuning Assistant</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-auto space-y-2">
            {assistantMessages.map((m) => (
              <ChatMessage key={m.id} message={m} />
            ))}
          </CardContent>
          <div className="p-2 border-t border-border flex gap-2 bg-black/50">
            <Input
              value={assistantInput}
              onChange={(e) => setAssistantInput(e.target.value)}
              placeholder="Ask for help..."
              className="flex-1 bg-card border border-border"
            />
            <Button onClick={handleAssistantSend} disabled={!assistantInput.trim()} className="bg-primary hover:bg-primary/80">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
