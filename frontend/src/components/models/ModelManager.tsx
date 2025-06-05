import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Trash2, Download, ExternalLink } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface HuggingFaceModel {
  id: string;
  name: string;
  downloads: number;
  task: string;
  library: string;
  lastModified: string;
  status: "available" | "downloading" | "error";
}

interface ModelManagerProps {
  models: HuggingFaceModel[];
  onModelAdd: (modelId: string) => Promise<void>;
  onModelRemove: (modelId: string) => void;
  selectedModel?: string;
  onModelSelect: (modelId: string) => void;
}

export function ModelManager({
  models,
  onModelAdd,
  onModelRemove,
  selectedModel,
  onModelSelect,
}: ModelManagerProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [newModelId, setNewModelId] = React.useState("");
  const [isLoading, setIsLoading] = React.useState(false);

  const handleAddModel = async () => {
    if (!newModelId.trim()) return;

    setIsLoading(true);
    try {
      await onModelAdd(newModelId.trim());
      setNewModelId("");
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to add model:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDownloads = (downloads: number) => {
    if (downloads >= 1000000) return `${(downloads / 1000000).toFixed(1)}M`;
    if (downloads >= 1000) return `${(downloads / 1000).toFixed(1)}K`;
    return downloads.toString();
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Manage Models</Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Hugging Face Model Manager</DialogTitle>
          <DialogDescription>
            Add, remove, and manage your Hugging Face models for fine-tuning
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          <div className="flex gap-2">
            <Input
              placeholder="Enter Hugging Face model ID (e.g., microsoft/DialoGPT-small)"
              value={newModelId}
              onChange={(e) => setNewModelId(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddModel()}
            />
            <Button
              onClick={handleAddModel}
              disabled={isLoading || !newModelId.trim()}
            >
              {isLoading ? "Adding..." : "Add Model"}
            </Button>
          </div>

          <div className="flex-1 overflow-auto border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Model</TableHead>
                  <TableHead>Task</TableHead>
                  <TableHead>Downloads</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow
                    key={model.id}
                    className={selectedModel === model.id ? "bg-muted" : ""}
                  >
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{model.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {model.id}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{model.task}</Badge>
                    </TableCell>
                    <TableCell>{formatDownloads(model.downloads)}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          model.status === "available"
                            ? "default"
                            : model.status === "downloading"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {model.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant={
                            selectedModel === model.id ? "default" : "outline"
                          }
                          onClick={() => onModelSelect(model.id)}
                        >
                          {selectedModel === model.id ? "Selected" : "Select"}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            window.open(
                              `https://huggingface.co/${model.id}`,
                              "_blank"
                            )
                          }
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onModelRemove(model.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {models.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center text-muted-foreground py-8"
                    >
                      No models added yet. Add a model to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
