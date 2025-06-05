import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Props {
  value: string;
  onChange: (value: string) => void;
}

export function AIPersonalitySelector({ value, onChange }: Props) {
  return (
    <div className="space-y-1">
      <label className="text-sm font-medium text-muted-foreground">Personality</label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="w-40 bg-card border border-border">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="classic">Classic</SelectItem>
          <SelectItem value="humorous">Humorous</SelectItem>
          <SelectItem value="dark">Dark</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
