import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { Download, Trash2, GitBranch, Eye, Play } from "lucide-react";

export interface SavedModel {
  id: string;
  name: string;
  description?: string;
  base_model_id: string;
  training_job_id: string;
  version: number;
  parent_model_id?: string;
  status: "available" | "uploading" | "error";
  metrics?: {
    loss: number;
    accuracy: number;
    perplexity?: number;
  };
  created_at: string;
  model_path: string;
}

export interface SavedModelsManagerProps {
  models: SavedModel[];
  onModelSelect: (modelId: string) => void;
  onModelDelete: (modelId: string) => void;
  onModelDownload: (modelId: string) => void;
  onModelUseForTraining: (modelId: string) => void;
  selectedModelId?: string;
}

export function SavedModelsManager({
  models,
  onModelSelect,
  onModelDelete,
  onModelDownload,
  onModelUseForTraining,
  selectedModelId,
}: SavedModelsManagerProps) {
  const [selectedModel, setSelectedModel] = React.useState<SavedModel | null>(
    null
  );

  const getStatusBadge = (status: SavedModel["status"]) => {
    switch (status) {
      case "available":
        return <Badge variant="default">Available</Badge>;
      case "uploading":
        return <Badge variant="secondary">Uploading</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return <Badge variant="outline">Unknown</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getModelLineage = (modelId: string): SavedModel[] => {
    const lineage: SavedModel[] = [];
    let currentModel = models.find((m) => m.id === modelId);

    while (currentModel) {
      lineage.push(currentModel);
      if (currentModel.parent_model_id) {
        currentModel = models.find(
          (m) => m.id === currentModel?.parent_model_id
        );
      } else {
        break;
      }
    }

    return lineage;
  };

  const ModelDetailsDialog = ({ model }: { model: SavedModel }) => {
    const lineage = getModelLineage(model.id);

    return (
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{model.name}</DialogTitle>
          <DialogDescription>
            Model version {model.version} • {formatDate(model.created_at)}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="details" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="details">Details</TabsTrigger>
            <TabsTrigger value="metrics">Metrics</TabsTrigger>
            <TabsTrigger value="lineage">Training Lineage</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-medium mb-2">Basic Information</h4>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">Name:</span> {model.name}
                  </div>
                  <div>
                    <span className="font-medium">Version:</span>{" "}
                    {model.version}
                  </div>
                  <div>
                    <span className="font-medium">Base Model:</span>{" "}
                    {model.base_model_id}
                  </div>
                  <div>
                    <span className="font-medium">Status:</span>{" "}
                    {getStatusBadge(model.status)}
                  </div>
                </div>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {model.description || "No description provided"}
                </p>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="metrics" className="space-y-4">
            {model.metrics ? (
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Loss</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {model.metrics.loss.toFixed(4)}
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm">Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {(model.metrics.accuracy * 100).toFixed(1)}%
                    </div>
                  </CardContent>
                </Card>
                {model.metrics.perplexity && (
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Perplexity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {model.metrics.perplexity.toFixed(3)}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <p className="text-muted-foreground">No metrics available</p>
            )}
          </TabsContent>

          <TabsContent value="lineage" className="space-y-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Training History</h4>
              {lineage.map((ancestorModel, index) => (
                <div
                  key={ancestorModel.id}
                  className="flex items-center space-x-2 p-2 border rounded"
                >
                  <GitBranch className="h-4 w-4" />
                  <div className="flex-1">
                    <div className="font-medium">{ancestorModel.name}</div>
                    <div className="text-sm text-muted-foreground">
                      Version {ancestorModel.version} •{" "}
                      {formatDate(ancestorModel.created_at)}
                    </div>
                  </div>
                  {index === 0 && <Badge variant="secondary">Current</Badge>}
                </div>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2 pt-4">
          <Button
            variant="outline"
            onClick={() => onModelDownload(model.id)}
            disabled={model.status !== "available"}
          >
            <Download className="h-4 w-4 mr-2" />
            Download
          </Button>
          <Button
            onClick={() => onModelUseForTraining(model.id)}
            disabled={model.status !== "available"}
          >
            <Play className="h-4 w-4 mr-2" />
            Use for Training
          </Button>
        </div>
      </DialogContent>
    );
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Saved Models</CardTitle>
          <CardDescription>
            Manage your fine-tuned models and use them for iterative training
          </CardDescription>
        </CardHeader>
        <CardContent>
          {models.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No saved models yet. Complete a training job with "Save Model"
                enabled to see models here.
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Version</TableHead>
                  <TableHead>Base Model</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((model) => (
                  <TableRow
                    key={model.id}
                    className={
                      selectedModelId === model.id ? "bg-muted/50" : ""
                    }
                  >
                    <TableCell className="font-medium">{model.name}</TableCell>
                    <TableCell>v{model.version}</TableCell>
                    <TableCell>{model.base_model_id}</TableCell>
                    <TableCell>{getStatusBadge(model.status)}</TableCell>
                    <TableCell>{formatDate(model.created_at)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-1">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedModel(model)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          {selectedModel && (
                            <ModelDetailsDialog model={selectedModel} />
                          )}
                        </Dialog>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onModelDownload(model.id)}
                          disabled={model.status !== "available"}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onModelUseForTraining(model.id)}
                          disabled={model.status !== "available"}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onModelDelete(model.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
