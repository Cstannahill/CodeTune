import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: string;
  onValueChange: (value: string) => void;
}

export function AIModelSelector({ value, onValueChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">Base Model</label>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="w-40 bg-card border border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="gpt-3.5-turbo">GPT-3.5 Turbo</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
