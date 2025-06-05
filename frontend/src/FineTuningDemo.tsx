import { useState } from "react";
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
    for (let i = 1; i <= epochs; i++) {
      await new Promise((r) => setTimeout(r, 500));
      setTrainingProgress(Math.round((i / epochs) * 100));
    }
    setTraining(false);
    setAnalysis("Training complete");
    setQualityLoss(Number((Math.random() * 5).toFixed(2)));
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
                    More epochs can improve quality but may overfit.
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
                    Higher values take longer but yield better results.
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
                    Lower values train steadily; high values risk divergence.
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
                    Reduces model size and speeds inference but may lower quality.
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
                <p>Datasets should be provided in JSONL format with an <code>input</code> and <code>output</code> for each example.</p>
                <p>Example:</p>
                <pre className="bg-black/50 p-2 rounded-md whitespace-pre-wrap">{`{"input": "Question", "output": "Answer"}`}</pre>
                <p>Include varied samples that reflect the tasks you want the model to learn.</p>
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
                      <TableCell>Step size for weight updates. Lower values train more steadily.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>batch_size</code></TableCell>
                      <TableCell>Number of samples processed before the model updates.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>num_train_epochs</code></TableCell>
                      <TableCell>How many times the dataset is iterated during training.</TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell><code>warmup_steps</code></TableCell>
                      <TableCell>Number of steps to gradually ramp up the learning rate.</TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
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
