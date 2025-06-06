import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChatMessage as ChatMessageComponent } from "@/components/chat/ChatMessage";
import {
  assistantChat,
  fetchModels,
  fetchOllamaModels,
  type ChatMessage,
} from "@/services/api";
import { SiHuggingface, SiOllama } from "react-icons/si";
import { toast } from "react-hot-toast";

interface ModelItem {
  id: string;
  source: "hf" | "ollama" | "saved";
  name?: string;
}

export default function Playground() {
  const [availableModels, setAvailableModels] = useState<ModelItem[]>([]);
  const [modelType, setModelType] = useState<"tuned" | "baseline">("tuned");
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [baselineModel, setBaselineModel] = useState<string>("");
  const [chatInput, setChatInput] = useState("");
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [baselineResponse, setBaselineResponse] = useState<string | null>(null);
  const [tunedResponse, setTunedResponse] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    Promise.all([fetchModels(), fetchOllamaModels()])
      .then(([hf, ollama]) => {
        const items: ModelItem[] = [
          ...hf.map((m) => ({ id: m.id, source: "hf" as const })),
          ...ollama.map((id) => ({ id, source: "ollama" as const })),
        ];
        setAvailableModels(items);
      })
      .catch(() => setAvailableModels([]));
  }, []);

  // Helper to truncate model names
  const truncate = (str: string, n = 32) =>
    str.length > n ? str.slice(0, n - 3) + "..." : str;

  // Filter models for select
  const getModelOptions = () => {
    if (modelType === "tuned") {
      // Only show saved models for tuned
      return availableModels.filter((m) => m.source === "saved");
    } else {
      // Only show base models (hf/ollama)
      return availableModels.filter(
        (m) => m.source === "hf" || m.source === "ollama"
      );
    }
  };

  const handleSend = async () => {
    if (!chatInput.trim() || !selectedModel) return;
    setLoading(true);
    setBaselineResponse(null);
    setTunedResponse(null);
    const userMsg: ChatMessage = { role: "user", content: chatInput };
    setChatHistory((prev) => [...prev, userMsg]);
    try {
      if (
        modelType === "tuned" &&
        baselineModel &&
        baselineModel !== selectedModel
      ) {
        // Compare tuned vs baseline
        const [baseline, tuned] = await Promise.all([
          assistantChat([...chatHistory, userMsg], baselineModel),
          assistantChat([...chatHistory, userMsg], selectedModel),
        ]);
        setBaselineResponse(baseline);
        setTunedResponse(tuned);
      } else {
        const response = await assistantChat(
          [...chatHistory, userMsg],
          selectedModel
        );
        setTunedResponse(response);
      }
      setChatInput("");
    } catch {
      toast.error("Error sending message");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">
        Playground: Model Chat & Analysis
      </h2>
      <Card className="bg-black/20 border-purple-500/20 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-lg">Model Selection</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex gap-2 mb-2">
            <Button
              variant={modelType === "tuned" ? "default" : "outline"}
              onClick={() => setModelType("tuned")}
              className="px-4 py-1"
            >
              Tuned Models
            </Button>
            <Button
              variant={modelType === "baseline" ? "default" : "outline"}
              onClick={() => setModelType("baseline")}
              className="px-4 py-1"
            >
              Baseline Models
            </Button>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-muted-foreground mb-1">
              {modelType === "tuned" ? "Tuned Model" : "Baseline Model"}
            </label>
            <Select value={selectedModel} onValueChange={setSelectedModel}>
              <SelectTrigger className="w-full bg-card border border-border">
                <SelectValue
                  placeholder={`Select ${
                    modelType === "tuned" ? "tuned" : "baseline"
                  } model`}
                />
              </SelectTrigger>
              <SelectContent>
                {getModelOptions().map((model) => (
                  <SelectItem key={model.id} value={model.id}>
                    {model.source === "hf" && (
                      <SiHuggingface className="inline w-4 h-4 mr-2 align-text-bottom" />
                    )}
                    {model.source === "ollama" && (
                      <SiOllama className="inline w-4 h-4 mr-2 align-text-bottom" />
                    )}
                    {truncate(model.name || model.id)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {modelType === "tuned" && (
            <div className="flex-1">
              <label className="block text-sm text-muted-foreground mb-1">
                Baseline Model (optional)
              </label>
              <Select value={baselineModel} onValueChange={setBaselineModel}>
                <SelectTrigger className="w-full bg-card border border-border">
                  <SelectValue placeholder="Select baseline model" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {availableModels
                    .filter((m) => m.source === "hf" || m.source === "ollama")
                    .map((model) => (
                      <SelectItem key={model.id} value={model.id}>
                        {model.source === "hf" && (
                          <SiHuggingface className="inline w-4 h-4 mr-2 align-text-bottom" />
                        )}
                        {model.source === "ollama" && (
                          <SiOllama className="inline w-4 h-4 mr-2 align-text-bottom" />
                        )}
                        {truncate(model.name || model.id)}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>
      <Card className="bg-black/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white text-lg">Chat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 mb-4">
            {chatHistory.map((msg, idx) => (
              <ChatMessageComponent
                key={idx}
                message={{
                  id: String(idx),
                  type: msg.role === "user" ? "player" : "dm",
                  sender: msg.role === "user" ? "You" : "Model",
                  content: msg.content,
                  timestamp: new Date(),
                }}
              />
            ))}
            {baselineResponse && (
              <div className="bg-slate-800/80 rounded p-2 text-sm text-blue-200">
                <span className="font-bold">Baseline:</span> {baselineResponse}
              </div>
            )}
            {tunedResponse && (
              <div className="bg-purple-800/80 rounded p-2 text-sm text-purple-200">
                <span className="font-bold">Tuned:</span> {tunedResponse}
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Type your prompt..."
              className="flex-1 bg-card border border-border text-primary"
              disabled={loading}
            />
            <Button
              onClick={handleSend}
              disabled={loading || !chatInput.trim() || !selectedModel}
              className="bg-primary hover:bg-primary/80"
            >
              Send
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
