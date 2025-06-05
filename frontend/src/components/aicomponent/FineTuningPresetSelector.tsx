import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { fineTuningPresets, type FineTuningPreset } from "@/presets";

interface Props {
  value: string | null;
  onValueChange: (preset: FineTuningPreset) => void;
}

export function FineTuningPresetSelector({ value, onValueChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">Preset</label>
      <Select
        value={value ?? ""}
        onValueChange={(id) => {
          const p = fineTuningPresets.find((pr) => pr.id === id);
          if (p) onValueChange(p);
        }}
      >
        <SelectTrigger className="w-56 bg-card border border-border">
          <SelectValue placeholder="Choose a preset" />
        </SelectTrigger>
        <SelectContent>
          {fineTuningPresets.map((p) => (
            <SelectItem key={p.id} value={p.id}>
              {p.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
