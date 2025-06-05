import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Trash2, Download, FileText, Calendar } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export interface Dataset {
  id: string;
  name: string;
  size: number;
  format: "json" | "csv" | "txt";
  uploadDate: string;
  samplesCount: number;
  description?: string;
}

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

interface DatasetManagerProps {
  datasets: Dataset[];
  onDatasetUpload: (
    file: File,
    name: string,
    description?: string
  ) => Promise<void>;
  onDatasetRemove: (id: string) => void;
}

export function DatasetManager({
  datasets,
  onDatasetUpload,
  onDatasetRemove,
}: DatasetManagerProps) {
  const [isUploading, setIsUploading] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      await onDatasetUpload(file, file.name.replace(/\.[^/.]+$/, ""));
    } catch (error) {
      console.error("Failed to upload dataset:", error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Dataset Manager
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,.csv,.txt"
              onChange={handleFileUpload}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
            >
              {isUploading ? "Uploading..." : "Upload Dataset"}
            </Button>
          </div>

          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Samples</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {datasets.map((dataset) => (
                  <TableRow key={dataset.id}>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="font-medium">{dataset.name}</div>
                        {dataset.description && (
                          <div className="text-sm text-muted-foreground">
                            {dataset.description}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {dataset.format.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatFileSize(dataset.size)}</TableCell>
                    <TableCell>
                      {dataset.samplesCount.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {new Date(dataset.uploadDate).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDatasetRemove(dataset.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {datasets.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-muted-foreground py-8"
                    >
                      No datasets uploaded yet. Upload a dataset to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface TrainingJobsProps {
  jobs: FineTuningJob[];
  onJobCancel: (id: string) => void;
}

export function TrainingJobs({ jobs, onJobCancel }: TrainingJobsProps) {
  const getStatusColor = (status: FineTuningJob["status"]) => {
    switch (status) {
      case "pending":
        return "secondary";
      case "running":
        return "default";
      case "completed":
        return "default";
      case "failed":
        return "destructive";
      default:
        return "secondary";
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Training Jobs</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {jobs.map((job) => (
            <div key={job.id} className="border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <div className="font-medium">Model: {job.modelId}</div>
                  <div className="text-sm text-muted-foreground">
                    Dataset: {job.datasetId} • {job.epochs} epochs • LR:{" "}
                    {job.learningRate}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusColor(job.status)}>
                    {job.status}
                  </Badge>
                  {job.status === "running" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onJobCancel(job.id)}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </div>

              {job.status === "running" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Progress</span>
                    <span>{job.progress}%</span>
                  </div>
                  <Progress value={job.progress} className="h-2" />
                </div>
              )}

              {job.metrics && (
                <div className="grid grid-cols-3 gap-4 text-sm">
                  <div>
                    <div className="text-muted-foreground">Loss</div>
                    <div className="font-medium">
                      {job.metrics.loss.toFixed(4)}
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Accuracy</div>
                    <div className="font-medium">
                      {(job.metrics.accuracy * 100).toFixed(2)}%
                    </div>
                  </div>
                  <div>
                    <div className="text-muted-foreground">Perplexity</div>
                    <div className="font-medium">
                      {job.metrics.perplexity.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              <div className="text-xs text-muted-foreground">
                Started: {new Date(job.createdAt).toLocaleString()}
                {job.completedAt && (
                  <>
                    {" "}
                    • Completed: {new Date(job.completedAt).toLocaleString()}
                  </>
                )}
              </div>
            </div>
          ))}

          {jobs.length === 0 && (
            <div className="text-center text-muted-foreground py-8">
              No training jobs yet. Start a fine-tuning job to see it here.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
