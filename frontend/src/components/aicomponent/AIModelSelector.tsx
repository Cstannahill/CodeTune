import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { fetchModels, fetchOllamaModels } from "@/services/api";
import { SiHuggingface, SiOllama } from "react-icons/si";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

interface ModelItem {
  id: string;
  source: "hf" | "ollama";
}

export function AIModelSelector({ value, onValueChange }: Props) {
  const [models, setModels] = useState<ModelItem[]>([]);

  useEffect(() => {
    Promise.all([fetchModels(), fetchOllamaModels()])
      .then(([hf, local]) => {
        const items: ModelItem[] = [
          ...hf.map((m) => ({ id: m.id, source: "hf" as const })),
          ...local.map((id) => ({ id, source: "ollama" as const })),
        ];
        setModels(items);
      })
      .catch(() => setModels([]));
  }, []);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">
        Base Model
      </label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-48 bg-card border border-border">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          {models.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              {m.source === "hf" ? (
                <SiHuggingface className="inline w-4 h-4 mr-2 align-text-bottom" />
              ) : (
                <SiOllama className="inline w-4 h-4 mr-2 align-text-bottom" />
              )}
              {m.id}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
