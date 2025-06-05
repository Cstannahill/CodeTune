import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Brain, Database, BarChart3, Cpu, Activity, Save } from "lucide-react";
import { ModelManager, type HuggingFaceModel } from "../models/ModelManager";
import { DatasetManager, type Dataset } from "./DatasetManager";
import { TrainingJobs, type FineTuningJob } from "./TrainingJobs";
import { AnalyticsDashboard } from "./AnalyticsDashboard";
import { SavedModelsManager, type SavedModel } from "./SavedModelsManager";
import {
  fetchSavedModels,
  startTuning,
  getTuningProgress,
  type TuningRequest,
  type TuningJob,
} from "@/services/api";

interface DashboardProps {
  onNavigateToFineTuning?: () => void;
}

export function Dashboard({ onNavigateToFineTuning }: DashboardProps) {
  const [activeTab, setActiveTab] = useState("models");

  // Models state
  const [models, setModels] = useState<HuggingFaceModel[]>([
    {
      id: "gpt2",
      name: "GPT-2",
      downloads: 125000,
      task: "text-generation",
      library: "transformers",
      lastModified: "2023-12-01",
      status: "available",
    },
    {
      id: "bert-base-uncased",
      name: "BERT Base Uncased",
      downloads: 890000,
      task: "fill-mask",
      library: "transformers",
      lastModified: "2023-11-15",
      status: "available",
    },
  ]);
  const [selectedModel, setSelectedModel] = useState<string>("gpt2");

  // Datasets state
  const [datasets, setDatasets] = useState<Dataset[]>([
    {
      id: "ds1",
      name: "Customer Reviews",
      size: 15600000,
      format: "json",
      uploadDate: "2023-12-15",
      samplesCount: 50000,
      description: "Product review sentiment analysis dataset",
    },
    {
      id: "ds2",
      name: "Legal Documents",
      size: 32400000,
      format: "txt",
      uploadDate: "2023-12-10",
      samplesCount: 25000,
      description: "Legal document classification dataset",
    },
  ]);

  // Training jobs state
  const [trainingJobs, setTrainingJobs] = useState<FineTuningJob[]>([
    {
      id: "job1",
      modelId: "gpt2",
      datasetId: "ds1",
      status: "completed",
      progress: 100,
      createdAt: "2023-12-14",
      completedAt: "2023-12-15",
      epochs: 3,
      learningRate: 0.00005,
      metrics: {
        loss: 0.245,
        accuracy: 0.892,
        perplexity: 1.278,
      },
    },
    {
      id: "job2",
      modelId: "bert-base-uncased",
      datasetId: "ds2",
      status: "running",
      progress: 65,
      createdAt: "2023-12-15",
      epochs: 5,
      learningRate: 0.0001,
    },
  ]);

  // Saved models state
  const [savedModels, setSavedModels] = useState<SavedModel[]>([
    {
      id: "saved1",
      name: "Customer Sentiment Model",
      description: "Fine-tuned GPT-2 for customer sentiment analysis",
      base_model_id: "gpt2",
      training_job_id: "job1",
      version: 1,
      status: "available",
      metrics: {
        loss: 0.245,
        accuracy: 0.892,
        perplexity: 1.278,
      },
      created_at: "2023-12-15T10:30:00Z",
      model_path: "./saved_models/customer_sentiment_v1",
    },
  ]);

  // Load saved models on component mount
  useEffect(() => {
    const loadSavedModels = async () => {
      try {
        const models = await fetchSavedModels();
        setSavedModels(models);
      } catch (error) {
        console.error("Failed to load saved models:", error);
        // Keep using mock data if API fails
      }
    };

    loadSavedModels();
  }, []);

  // Model management functions
  const handleModelAdd = async (modelId: string): Promise<void> => {
    console.log("Adding model:", modelId);
    // TODO: Implement actual HuggingFace API integration
    const newModel: HuggingFaceModel = {
      id: modelId,
      name: modelId,
      downloads: 0,
      task: "unknown",
      library: "transformers",
      lastModified: new Date().toISOString().split("T")[0],
      status: "downloading",
    };
    setModels((prev) => [...prev, newModel]);

    // Simulate download
    setTimeout(() => {
      setModels((prev) =>
        prev.map((m) =>
          m.id === modelId ? { ...m, status: "available" as const } : m
        )
      );
    }, 2000);
  };

  const handleModelRemove = (modelId: string): void => {
    setModels((prev) => prev.filter((m) => m.id !== modelId));
    if (selectedModel === modelId) {
      setSelectedModel("");
    }
  };

  const handleModelSelect = (modelId: string): void => {
    setSelectedModel(modelId);
  };

  // Dataset management functions
  const handleDatasetUpload = async (
    file: File,
    name: string,
    description?: string
  ): Promise<void> => {
    console.log("Uploading dataset:", name);
    // TODO: Implement actual dataset upload
    const newDataset: Dataset = {
      id: `ds_${Date.now()}`,
      name,
      size: file.size,
      format: file.name.endsWith(".json")
        ? "json"
        : file.name.endsWith(".csv")
        ? "csv"
        : "txt",
      uploadDate: new Date().toISOString().split("T")[0],
      samplesCount: Math.floor(Math.random() * 100000) + 1000,
      description,
    };
    setDatasets((prev) => [...prev, newDataset]);
  };

  const handleDatasetRemove = (id: string): void => {
    setDatasets((prev) => prev.filter((d) => d.id !== id));
  };

  // Training job management functions
  const handleStartTraining = async (
    modelId: string,
    datasetId: string,
    config: {
      epochs?: number;
      learningRate?: number;
      batchSize?: number;
      warmupSteps?: number;
      saveModel?: boolean;
      modelName?: string;
      modelDescription?: string;
      parentModelId?: string;
    }
  ): Promise<void> => {
    try {
      console.log("Starting training:", { modelId, datasetId, config });

      // Prepare the tuning request
      const tuningRequest: TuningRequest = {
        base_model_id: modelId,
        dataset_id: datasetId,
        parameters: {
          epochs: config.epochs || 3,
          learning_rate: config.learningRate || 0.00005,
          batch_size: config.batchSize || 8,
          warmup_steps: config.warmupSteps || 100,
        },
        save_model: config.saveModel || false,
        model_name: config.modelName,
        model_description: config.modelDescription,
        parent_model_id: config.parentModelId,
      };

      // Start the tuning job via API
      const tuningJob = await startTuning(tuningRequest);

      // Convert API job to UI job format
      const newJob: FineTuningJob = {
        id: tuningJob.id,
        modelId: tuningJob.base_model_id,
        datasetId: tuningJob.dataset_id,
        status: tuningJob.status as FineTuningJob["status"],
        progress: tuningJob.progress,
        createdAt: new Date(tuningJob.created_at).toISOString().split("T")[0],
        epochs: tuningJob.parameters.epochs || 3,
        learningRate: tuningJob.parameters.learning_rate || 0.00005,
      };

      setTrainingJobs((prev) => [...prev, newJob]);

      // Start polling for progress updates
      pollTrainingProgress(tuningJob.id);
    } catch (error) {
      console.error("Failed to start training:", error);
      // Could add error state handling here
    }
  };

  // Poll training progress from backend
  const pollTrainingProgress = async (jobId: string): Promise<void> => {
    const pollInterval = setInterval(async () => {
      try {
        const progress = await getTuningProgress(jobId);

        setTrainingJobs((prev) =>
          prev.map((job) =>
            job.id === jobId
              ? {
                  ...job,
                  status: progress.status as FineTuningJob["status"],
                  progress: progress.progress,
                  completedAt:
                    progress.status === "completed"
                      ? new Date().toISOString().split("T")[0]
                      : undefined,
                  metrics: progress.result
                    ? {
                        loss: progress.result.loss || 0,
                        accuracy: progress.result.accuracy || 0,
                        perplexity: progress.result.perplexity || 0,
                      }
                    : undefined,
                }
              : job
          )
        );

        // If training is complete or failed, stop polling
        if (progress.status === "completed" || progress.status === "failed") {
          clearInterval(pollInterval);

          // If a model was saved, refresh the saved models list
          if (progress.status === "completed" && progress.saved_model_id) {
            try {
              const updatedModels = await fetchSavedModels();
              setSavedModels(updatedModels);
            } catch (error) {
              console.error("Failed to refresh saved models:", error);
            }
          }
        }
      } catch (error) {
        console.error("Failed to get training progress:", error);
        clearInterval(pollInterval);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleStopTraining = async (jobId: string): Promise<void> => {
    try {
      // TODO: Implement stop training API endpoint in backend
      // await stopTuning(jobId);

      // For now, just update the UI state
      setTrainingJobs((prev) =>
        prev.map((job) =>
          job.id === jobId ? { ...job, status: "failed" as const } : job
        )
      );
    } catch (error) {
      console.error("Failed to stop training:", error);
    }
  };

  // Saved models management functions
  const handleSavedModelSelect = (modelId: string): void => {
    console.log("Selected saved model:", modelId);
  };

  const handleSavedModelDelete = async (modelId: string): Promise<void> => {
    try {
      // TODO: Uncomment when backend is ready
      // await deleteSavedModel(modelId);
      setSavedModels((prev) => prev.filter((m) => m.id !== modelId));
    } catch (error) {
      console.error("Failed to delete saved model:", error);
    }
  };

  const handleSavedModelDownload = (modelId: string): void => {
    console.log("Downloading model:", modelId);
    // TODO: Implement actual download functionality
  };

  const handleSavedModelUseForTraining = (modelId: string): void => {
    console.log("Using saved model for training:", modelId);
    // Navigate to training tab and pre-select this model
    setActiveTab("training");
    // TODO: Pass the selected saved model to training component
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-4">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Brain className="w-8 h-8" />
            CodeTune Dashboard
          </h1>
          <div className="flex gap-2">
            {onNavigateToFineTuning && (
              <button
                onClick={onNavigateToFineTuning}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Quick Fine-Tune
              </button>
            )}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="bg-black/20 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Models</p>
                  <p className="text-2xl font-bold text-white">
                    {models.length}
                  </p>
                </div>
                <Cpu className="w-8 h-8 text-purple-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Datasets</p>
                  <p className="text-2xl font-bold text-white">
                    {datasets.length}
                  </p>
                </div>
                <Database className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Saved Models</p>
                  <p className="text-2xl font-bold text-white">
                    {savedModels.length}
                  </p>
                </div>
                <Save className="w-8 h-8 text-indigo-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Training Jobs</p>
                  <p className="text-2xl font-bold text-white">
                    {trainingJobs.length}
                  </p>
                </div>
                <Activity className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-black/20 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Active Jobs</p>
                  <p className="text-2xl font-bold text-white">
                    {trainingJobs.filter((j) => j.status === "running").length}
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-orange-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Dashboard */}
        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="models" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              Models
            </TabsTrigger>
            <TabsTrigger value="datasets" className="flex items-center gap-2">
              <Database className="w-4 h-4" />
              Datasets
            </TabsTrigger>
            <TabsTrigger
              value="saved-models"
              className="flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              Saved Models
            </TabsTrigger>
            <TabsTrigger value="training" className="flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Training
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-6">
            <ModelManager
              models={models}
              onModelAdd={handleModelAdd}
              onModelRemove={handleModelRemove}
              selectedModel={selectedModel}
              onModelSelect={handleModelSelect}
            />
          </TabsContent>

          <TabsContent value="datasets" className="space-y-6">
            <DatasetManager
              datasets={datasets}
              onDatasetUpload={handleDatasetUpload}
              onDatasetRemove={handleDatasetRemove}
            />
          </TabsContent>

          <TabsContent value="saved-models" className="space-y-6">
            <SavedModelsManager
              models={savedModels}
              onModelSelect={handleSavedModelSelect}
              onModelDelete={handleSavedModelDelete}
              onModelDownload={handleSavedModelDownload}
              onModelUseForTraining={handleSavedModelUseForTraining}
            />
          </TabsContent>

          <TabsContent value="training" className="space-y-6">
            <TrainingJobs
              jobs={trainingJobs}
              models={models}
              datasets={datasets}
              savedModels={savedModels}
              onStartTraining={handleStartTraining}
              onStopTraining={handleStopTraining}
            />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard
              models={models}
              datasets={datasets}
              trainingJobs={trainingJobs}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
