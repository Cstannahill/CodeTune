import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Play, Square, MoreHorizontal, Brain } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { type HuggingFaceModel } from "../models/ModelManager";
import { type Dataset } from "./DatasetManager";
import { type SavedModel } from "./SavedModelsManager";

export interface FineTuningJob {
  id: string;
  modelId: string;
  datasetId: string;
  status: "pending" | "running" | "completed" | "failed";
  progress: number;
  createdAt: string;
  completedAt?: string;
  epochs: number;
  learningRate: number;
  metrics?: {
    loss: number;
    accuracy: number;
    perplexity: number;
  };
}

interface TrainingJobsProps {
  jobs: FineTuningJob[];
  models: HuggingFaceModel[];
  datasets: Dataset[];
  savedModels?: SavedModel[];
  onStartTraining: (
    modelId: string,
    datasetId: string,
    config: TrainingConfig
  ) => void;
  onStopTraining: (jobId: string) => void;
}

interface TrainingConfig {
  epochs: number;
  learningRate: number;
  batchSize: number;
  warmupSteps: number;
  saveModel?: boolean;
  modelName?: string;
  modelDescription?: string;
  parentModelId?: string; // For iterative training from saved model
}

export function TrainingJobs({
  jobs,
  models,
  datasets,
  savedModels = [],
  onStartTraining,
  onStopTraining,
}: TrainingJobsProps) {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [selectedDataset, setSelectedDataset] = useState<string>("");
  const [modelType, setModelType] = useState<"huggingface" | "saved">(
    "huggingface"
  );
  const [config, setConfig] = useState<TrainingConfig>({
    epochs: 3,
    learningRate: 0.00005,
    batchSize: 8,
    warmupSteps: 100,
    saveModel: true,
    modelName: "",
    modelDescription: "",
  });

  const getStatusColor = (status: FineTuningJob["status"]) => {
    switch (status) {
      case "completed":
        return "default";
      case "running":
        return "secondary";
      case "failed":
        return "destructive";
      case "pending":
        return "outline";
      default:
        return "outline";
    }
  };

  const getStatusIcon = (status: FineTuningJob["status"]) => {
    switch (status) {
      case "running":
        return <Play className="w-4 h-4" />;
      case "completed":
        return <span className="w-4 h-4 bg-green-500 rounded-full" />;
      case "failed":
        return <span className="w-4 h-4 bg-red-500 rounded-full" />;
      default:
        return <span className="w-4 h-4 bg-gray-500 rounded-full" />;
    }
  };

  const handleStartTraining = () => {
    if (selectedModel && selectedDataset) {
      const configWithParent = {
        ...config,
        parentModelId: modelType === "saved" ? selectedModel : undefined,
      };
      onStartTraining(selectedModel, selectedDataset, configWithParent);
      setIsCreateDialogOpen(false);
      setSelectedModel("");
      setSelectedDataset("");
      setModelType("huggingface");
      setConfig({
        epochs: 3,
        learningRate: 0.00005,
        batchSize: 8,
        warmupSteps: 100,
        saveModel: true,
        modelName: "",
        modelDescription: "",
      });
    }
  };

  const formatDuration = (startDate: string, endDate?: string) => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (diffHours > 0) {
      return `${diffHours}h ${diffMinutes}m`;
    }
    return `${diffMinutes}m`;
  };

  return (
    <div className="space-y-6">
      <Card className="bg-black/20 border-purple-500/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Brain className="h-5 w-5" />
              Training Jobs
            </CardTitle>
            <Dialog
              open={isCreateDialogOpen}
              onOpenChange={setIsCreateDialogOpen}
            >
              <DialogTrigger asChild>
                <Button className="bg-purple-600 hover:bg-purple-700">
                  Start New Training
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 border-purple-500/30 text-white">
                <DialogHeader>
                  <DialogTitle>Create New Training Job</DialogTitle>
                  <DialogDescription className="text-gray-400">
                    Configure and start a new fine-tuning job
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Model Type</Label>
                    <div className="flex gap-4">
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modelType"
                          value="huggingface"
                          checked={modelType === "huggingface"}
                          onChange={() => {
                            setModelType("huggingface");
                            setSelectedModel("");
                          }}
                          className="text-purple-600"
                        />
                        <span>HuggingFace Model</span>
                      </label>
                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="radio"
                          name="modelType"
                          value="saved"
                          checked={modelType === "saved"}
                          onChange={() => {
                            setModelType("saved");
                            setSelectedModel("");
                          }}
                          className="text-purple-600"
                        />
                        <span>Saved Model (Iterative Training)</span>
                      </label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="model">
                      {modelType === "huggingface"
                        ? "Select HuggingFace Model"
                        : "Select Saved Model"}
                    </Label>
                    <Select
                      value={selectedModel}
                      onValueChange={setSelectedModel}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            modelType === "huggingface"
                              ? "Choose a HuggingFace model"
                              : "Choose a saved model"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {modelType === "huggingface"
                          ? models
                              .filter((m) => m.status === "available")
                              .map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name}
                                </SelectItem>
                              ))
                          : savedModels
                              .filter((m) => m.status === "available")
                              .map((model) => (
                                <SelectItem key={model.id} value={model.id}>
                                  {model.name} (v{model.version})
                                </SelectItem>
                              ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="dataset">Select Dataset</Label>
                    <Select
                      value={selectedDataset}
                      onValueChange={setSelectedDataset}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a dataset" />
                      </SelectTrigger>
                      <SelectContent>
                        {datasets.map((dataset) => (
                          <SelectItem key={dataset.id} value={dataset.id}>
                            {dataset.name} (
                            {dataset.samplesCount.toLocaleString()} samples)
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="epochs">Epochs</Label>
                      <Input
                        id="epochs"
                        type="number"
                        min="1"
                        max="10"
                        value={config.epochs}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            epochs: parseInt(e.target.value) || 1,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="learningRate">Learning Rate</Label>
                      <Input
                        id="learningRate"
                        type="number"
                        step="0.00001"
                        min="0.00001"
                        max="0.001"
                        value={config.learningRate}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            learningRate: parseFloat(e.target.value) || 0.00005,
                          }))
                        }
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="batchSize">Batch Size</Label>
                      <Input
                        id="batchSize"
                        type="number"
                        min="1"
                        max="32"
                        value={config.batchSize}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            batchSize: parseInt(e.target.value) || 8,
                          }))
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="warmupSteps">Warmup Steps</Label>
                      <Input
                        id="warmupSteps"
                        type="number"
                        min="0"
                        max="1000"
                        value={config.warmupSteps}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            warmupSteps: parseInt(e.target.value) || 100,
                          }))
                        }
                      />
                    </div>
                  </div>

                  {/* Model Saving Configuration */}
                  <div className="space-y-4 border-t border-purple-500/20 pt-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="saveModel"
                        checked={config.saveModel || false}
                        onChange={(e) =>
                          setConfig((prev) => ({
                            ...prev,
                            saveModel: e.target.checked,
                            modelName: e.target.checked ? prev.modelName : "",
                            modelDescription: e.target.checked
                              ? prev.modelDescription
                              : "",
                          }))
                        }
                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                      />
                      <Label
                        htmlFor="saveModel"
                        className="text-sm font-medium"
                      >
                        Save trained model for future use
                      </Label>
                    </div>

                    {config.saveModel && (
                      <div className="space-y-4 ml-6 border-l-2 border-purple-500/30 pl-4">
                        <div className="space-y-2">
                          <Label htmlFor="modelName">Model Name</Label>
                          <Input
                            id="modelName"
                            type="text"
                            placeholder="Enter a name for your model (optional)"
                            value={config.modelName || ""}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                modelName: e.target.value,
                              }))
                            }
                          />
                          <p className="text-xs text-gray-400">
                            If not provided, a unique name will be generated
                            automatically
                          </p>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="modelDescription">Description</Label>
                          <Textarea
                            id="modelDescription"
                            placeholder="Describe what this model is trained for (optional)"
                            value={config.modelDescription || ""}
                            onChange={(e) =>
                              setConfig((prev) => ({
                                ...prev,
                                modelDescription: e.target.value,
                              }))
                            }
                            rows={3}
                          />
                          <p className="text-xs text-gray-400">
                            Help others understand the purpose of this model
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsCreateDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleStartTraining}
                    disabled={!selectedModel || !selectedDataset}
                    className="bg-purple-600 hover:bg-purple-700"
                  >
                    Start Training
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-2">No training jobs yet</p>
              <p className="text-sm text-gray-500">
                Start your first fine-tuning job to train a model on your custom
                dataset
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Model</TableHead>
                  <TableHead>Dataset</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Progress</TableHead>
                  <TableHead>Duration</TableHead>
                  <TableHead>Metrics</TableHead>
                  <TableHead className="w-[100px]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => {
                  const model = models.find((m) => m.id === job.modelId);
                  const dataset = datasets.find((d) => d.id === job.datasetId);

                  return (
                    <TableRow key={job.id}>
                      <TableCell className="font-mono text-sm">
                        {job.id.substring(0, 8)}...
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {model?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400">{model?.task}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {dataset?.name || "Unknown"}
                          </p>
                          <p className="text-xs text-gray-400">
                            {dataset?.samplesCount.toLocaleString()} samples
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={getStatusColor(job.status)}
                          className="flex items-center gap-1 w-fit"
                        >
                          {getStatusIcon(job.status)}
                          {job.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {job.status === "running" ? (
                          <div className="space-y-1">
                            <Progress value={job.progress} className="w-20" />
                            <p className="text-xs text-gray-400">
                              {job.progress}%
                            </p>
                          </div>
                        ) : (
                          <span className="text-gray-400">
                            {job.status === "completed" ? "100%" : "-"}
                          </span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm">
                        {formatDuration(job.createdAt, job.completedAt)}
                      </TableCell>
                      <TableCell>
                        {job.metrics ? (
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-green-400">Acc:</span>
                              <span>
                                {(job.metrics.accuracy * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-blue-400">Loss:</span>
                              <span>{job.metrics.loss.toFixed(3)}</span>
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {job.status === "running" && (
                              <DropdownMenuItem
                                onClick={() => onStopTraining(job.id)}
                                className="text-red-400"
                              >
                                <Square className="mr-2 h-4 w-4" />
                                Stop Training
                              </DropdownMenuItem>
                            )}
                            {job.status === "completed" && (
                              <>
                                <DropdownMenuItem>
                                  View Details
                                </DropdownMenuItem>
                                <DropdownMenuItem>
                                  Download Model
                                </DropdownMenuItem>
                              </>
                            )}
                            <DropdownMenuItem className="text-red-400">
                              Delete Job
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Active Jobs Summary */}
      {jobs.some((job) => job.status === "running") && (
        <Card className="bg-black/20 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white text-lg">
              Active Training Jobs
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {jobs
                .filter((job) => job.status === "running")
                .map((job) => {
                  const model = models.find((m) => m.id === job.modelId);
                  const dataset = datasets.find((d) => d.id === job.datasetId);

                  return (
                    <div
                      key={job.id}
                      className="flex items-center justify-between p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        <div>
                          <p className="font-medium text-white">
                            {model?.name} + {dataset?.name}
                          </p>
                          <p className="text-sm text-gray-400">
                            Epoch {Math.ceil((job.progress / 100) * job.epochs)}
                            /{job.epochs} • Started{" "}
                            {formatDuration(job.createdAt)} ago
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <p className="text-sm font-medium text-blue-400">
                            {job.progress}%
                          </p>
                          <Progress value={job.progress} className="w-24" />
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onStopTraining(job.id)}
                          className="border-red-500/50 text-red-400 hover:bg-red-500/10"
                        >
                          <Square className="w-4 h-4 mr-1" />
                          Stop
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
