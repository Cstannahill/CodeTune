import { useEffect, useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fetchModels, fetchOllamaModels } from "@/services/api";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export function AIModelSelector({ value, onValueChange }: Props) {
  const [models, setModels] = useState<string[]>([]);

  useEffect(() => {
    Promise.all([fetchModels(), fetchOllamaModels()])
      .then(([hf, local]) => setModels([...hf.map((m) => m.id), ...local]))
      .catch(() => setModels([]));
  }, []);

  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">Base Model</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-48 bg-card border border-border">
          <SelectValue placeholder="Select model" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
          {models.map((m) => (
            <SelectItem key={m} value={m}>{m}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
