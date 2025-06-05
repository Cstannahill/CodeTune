import { Textarea } from "@/components/ui/textarea";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function PromptEditor({ value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">System Prompt</label>
      <Textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="min-h-[80px] bg-card border border-border text-primary"
      />
    </div>
  );
}
