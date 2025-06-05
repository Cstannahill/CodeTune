import { useState } from "react";
import { Brain, Save, Send } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AIPersonalitySelector } from "@/components/aicomponent/AIPersonalitySelector";
import { PromptEditor } from "@/components/aicomponent/PromptEditor";
import { AIModelSelector } from "@/components/aicomponent/AIModelSelector";
import { ChatMessage } from "@/components/chat/ChatMessage";
import type { SimpleMessage } from "@/components/chat/ChatMessage";
import { createFineTunedDM, testFineTunedDM, type FineTuningRequest } from "@/services/api-mock";

export function FineTuningDemo() {
  const [personality, setPersonality] = useState("classic");
  const [prompt, setPrompt] = useState("You are a helpful dungeon master.");
  const [keywords, setKeywords] = useState("");
  const [model, setModel] = useState("gpt-4");
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(300);
  const [trainingData, setTrainingData] = useState("");

  const [activeTab, setActiveTab] = useState("basic");
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

  const [saving, setSaving] = useState(false);
  const [currentMessage, setCurrentMessage] = useState("");
  const [messages, setMessages] = useState<SimpleMessage[]>([]);
  const [sharePublicly, setSharePublicly] = useState(false);

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
    sharePublicly,
  });

  const handleSave = async () => {
    setSaving(true);
    try {
      await createFineTunedDM(buildRequest());
    } finally {
      setSaving(false);
    }
  };

  const handleSendTest = async () => {
    if (!currentMessage.trim()) return;
    const userMsg: SimpleMessage = {
      id: Date.now().toString(),
      type: "player",
      sender: "You",
      content: currentMessage,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setCurrentMessage("");
    const res = await testFineTunedDM(buildRequest(), userMsg.content);
    const aiMsg: SimpleMessage = {
      id: Date.now().toString() + "_ai",
      type: "dm",
      sender: "AI DM",
      content: res.response,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, aiMsg]);
  };

  const handleDatasetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setDatasetFile(e.target.files[0]);
    }
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
            <TabsTrigger value="basic">Basic</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          <TabsContent value="basic" className="space-y-6">
            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Base Model & Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AIModelSelector value={model} onValueChange={setModel} />
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Temperature</label>
                  <Input
                    type="range"
                    min="0"
                    max="2"
                    step="0.1"
                    value={temperature}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setTemperature(parseFloat(e.target.value))}
                    className="w-full"
                  />
                  <p className="text-xs text-gray-400">Lower values =&gt; consistent. Higher =&gt; creative.</p>
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-muted-foreground">Max Tokens</label>
                  <Input
                    type="number"
                    min="50"
                    max="2000"
                    value={maxTokens}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setMaxTokens(parseInt(e.target.value))}
                    className="w-24 bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">Controls response length.</p>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Personality & Prompt</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <AIPersonalitySelector value={personality} onChange={setPersonality} />
                <PromptEditor value={prompt} onChange={setPrompt} />
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Keywords</label>
                  <Input
                    value={keywords}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setKeywords(e.target.value)}
                    placeholder="dark, mysterious, undead..."
                    className="bg-card border border-border text-primary"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-muted-foreground mb-1">Training Examples</label>
                  <Textarea
                    value={trainingData}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setTrainingData(e.target.value)}
                    placeholder="Example conversations or descriptions"
                    className="min-h-[100px] bg-card border border-border text-primary"
                  />
                  <p className="text-xs text-gray-400">
                    Provide short samples that capture your world&apos;s tone.
                  </p>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <input
                    id="sharePublicly"
                    type="checkbox"
                    checked={sharePublicly}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setSharePublicly(e.target.checked)}
                    className="size-4 accent-purple-600"
                  />
                  <label htmlFor="sharePublicly" className="text-sm text-muted-foreground">
                    Share publicly in DM library
                  </label>
                </div>
                <Button onClick={handleSave} disabled={saving} className="mt-4 bg-primary hover:bg-primary/80">
                  <Save className="w-4 h-4 mr-2" /> {saving ? "Saving..." : "Save"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-black/20 border-purple-500/20">
              <CardHeader>
                <CardTitle className="text-white">Preview Chat</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <ScrollArea className="h-64 border border-border rounded-md p-2 bg-black/30">
                  <div className="space-y-4">
                    {messages.map((m) => (
                      <ChatMessage key={m.id} message={m} />
                    ))}
                  </div>
                </ScrollArea>
                <div className="flex gap-2">
                  <Input
                    value={currentMessage}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setCurrentMessage(e.target.value)}
                    placeholder="Ask your DM..."
                    className="flex-1 bg-card border border-border"
                  />
                  <Button onClick={handleSendTest} disabled={!currentMessage.trim()} className="bg-primary hover:bg-primary/80">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-gray-400">Send a message to see how the AI responds with current settings.</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="advanced" className="space-y-6">
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
