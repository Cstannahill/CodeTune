import React from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, Activity, Clock } from "lucide-react";
import { type HuggingFaceModel } from "../models/ModelManager";
import { type Dataset } from "./DatasetManager";
import { type FineTuningJob } from "./TrainingJobs";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface AnalyticsDashboardProps {
  models: HuggingFaceModel[];
  datasets: Dataset[];
  trainingJobs: FineTuningJob[];
}

export function AnalyticsDashboard({
  models,
  datasets,
  trainingJobs,
}: AnalyticsDashboardProps) {
  // Training performance over time
  const completedJobs = trainingJobs.filter(
    (job) => job.status === "completed" && job.metrics
  );

  const performanceData = {
    labels: completedJobs.map((_, i) => `Job ${i + 1}`),
    datasets: [
      {
        label: "Loss",
        data: completedJobs.map((job) => job.metrics?.loss || 0),
        borderColor: "rgb(99, 102, 241)",
        backgroundColor: "rgba(99, 102, 241, 0.2)",
        yAxisID: "y",
      },
      {
        label: "Accuracy",
        data: completedJobs.map((job) => job.metrics?.accuracy || 0),
        borderColor: "rgb(34, 197, 94)",
        backgroundColor: "rgba(34, 197, 94, 0.2)",
        yAxisID: "y1",
      },
    ],
  };

  const performanceOptions = {
    responsive: true,
    interaction: {
      mode: "index" as const,
      intersect: false,
    },
    scales: {
      x: {
        display: true,
        title: {
          display: true,
          text: "Training Jobs",
        },
      },
      y: {
        type: "linear" as const,
        display: true,
        position: "left" as const,
        title: {
          display: true,
          text: "Loss",
        },
      },
      y1: {
        type: "linear" as const,
        display: true,
        position: "right" as const,
        title: {
          display: true,
          text: "Accuracy",
        },
        grid: {
          drawOnChartArea: false,
        },
      },
    },
    plugins: {
      legend: {
        position: "top" as const,
      },
      title: {
        display: true,
        text: "Training Performance Trends",
      },
    },
  };

  // Model usage statistics
  const modelUsageData = {
    labels: models.map((m) => m.name),
    datasets: [
      {
        label: "Training Jobs",
        data: models.map(
          (model) =>
            trainingJobs.filter((job) => job.modelId === model.id).length
        ),
        backgroundColor: [
          "rgba(255, 99, 132, 0.8)",
          "rgba(54, 162, 235, 0.8)",
          "rgba(255, 205, 86, 0.8)",
          "rgba(75, 192, 192, 0.8)",
          "rgba(153, 102, 255, 0.8)",
        ],
      },
    ],
  };

  // Dataset size distribution
  const datasetSizeData = {
    labels: datasets.map((d) => d.name),
    datasets: [
      {
        data: datasets.map((d) => d.size),
        backgroundColor: [
          "#FF6384",
          "#36A2EB",
          "#FFCE56",
          "#4BC0C0",
          "#9966FF",
          "#FF9F40",
        ],
      },
    ],
  };

  // Training status distribution
  const statusCounts = trainingJobs.reduce((acc, job) => {
    acc[job.status] = (acc[job.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = {
    labels: Object.keys(statusCounts),
    datasets: [
      {
        data: Object.values(statusCounts),
        backgroundColor: [
          "#10B981", // completed - green
          "#3B82F6", // running - blue
          "#F59E0B", // pending - yellow
          "#EF4444", // failed - red
        ],
      },
    ],
  };

  // Calculate summary metrics
  const avgAccuracy =
    completedJobs.length > 0
      ? completedJobs.reduce(
          (sum, job) => sum + (job.metrics?.accuracy || 0),
          0
        ) / completedJobs.length
      : 0;

  const avgLoss =
    completedJobs.length > 0
      ? completedJobs.reduce((sum, job) => sum + (job.metrics?.loss || 0), 0) /
        completedJobs.length
      : 0;

  const totalDatasetSize = datasets.reduce(
    (sum, dataset) => sum + dataset.size,
    0
  );
  const totalSamples = datasets.reduce(
    (sum, dataset) => sum + dataset.samplesCount,
    0
  );

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-black/20 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Accuracy</p>
                <p className="text-2xl font-bold text-white">
                  {(avgAccuracy * 100).toFixed(1)}%
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  +2.3%
                </div>
              </div>
              <Activity className="w-8 h-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Avg Loss</p>
                <p className="text-2xl font-bold text-white">
                  {avgLoss.toFixed(3)}
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <TrendingDown className="w-4 h-4 mr-1" />
                  -0.05
                </div>
              </div>
              <TrendingDown className="w-8 h-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Total Data</p>
                <p className="text-2xl font-bold text-white">
                  {formatBytes(totalDatasetSize)}
                </p>
                <p className="text-xs text-gray-400">
                  {totalSamples.toLocaleString()} samples
                </p>
              </div>
              <Activity className="w-8 h-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-black/20 border-purple-500/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Completion Rate</p>
                <p className="text-2xl font-bold text-white">
                  {trainingJobs.length > 0
                    ? Math.round(
                        ((statusCounts.completed || 0) / trainingJobs.length) *
                          100
                      )
                    : 0}
                  %
                </p>
                <div className="flex items-center text-green-400 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {statusCounts.completed || 0}/{trainingJobs.length}
                </div>
              </div>
              <Clock className="w-8 h-8 text-orange-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Performance Trends */}
        <Card className="bg-black/20 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Performance Trends</CardTitle>
          </CardHeader>
          <CardContent>
            {completedJobs.length > 0 ? (
              <Line data={performanceData} options={performanceOptions} />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No completed training jobs to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Model Usage */}
        <Card className="bg-black/20 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">Model Usage</CardTitle>
          </CardHeader>
          <CardContent>
            {models.length > 0 ? (
              <Bar
                data={modelUsageData}
                options={{
                  responsive: true,
                  plugins: {
                    legend: {
                      display: false,
                    },
                    title: {
                      display: true,
                      text: "Training Jobs per Model",
                    },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      ticks: {
                        stepSize: 1,
                      },
                    },
                  },
                }}
              />
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No models to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Training Status */}
        <Card className="bg-black/20 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              Training Status Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {trainingJobs.length > 0 ? (
              <div className="h-64">
                <Doughnut
                  data={statusData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No training jobs to display
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dataset Sizes */}
        <Card className="bg-black/20 border-purple-500/20">
          <CardHeader>
            <CardTitle className="text-white">
              Dataset Size Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            {datasets.length > 0 ? (
              <div className="h-64">
                <Doughnut
                  data={datasetSizeData}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: "bottom" as const,
                      },
                      tooltip: {
                        callbacks: {
                          label: function (context) {
                            const label = context.label || "";
                            const value = formatBytes(context.parsed);
                            return `${label}: ${value}`;
                          },
                        },
                      },
                    },
                  }}
                />
              </div>
            ) : (
              <div className="h-64 flex items-center justify-center text-gray-400">
                No datasets to display
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="bg-black/20 border-purple-500/20">
        <CardHeader>
          <CardTitle className="text-white">Recent Training Jobs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {trainingJobs
              .slice(-5)
              .reverse()
              .map((job) => {
                const model = models.find((m) => m.id === job.modelId);
                const dataset = datasets.find((d) => d.id === job.datasetId);
                return (
                  <div
                    key={job.id}
                    className="flex items-center justify-between p-3 bg-black/30 rounded-lg"
                  >
                    <div className="flex items-center gap-3">
                      <Badge
                        variant={
                          job.status === "completed"
                            ? "default"
                            : job.status === "running"
                            ? "secondary"
                            : job.status === "failed"
                            ? "destructive"
                            : "outline"
                        }
                      >
                        {job.status}
                      </Badge>
                      <div>
                        <p className="text-white font-medium">
                          {model?.name} + {dataset?.name}
                        </p>
                        <p className="text-sm text-gray-400">
                          Started {job.createdAt}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      {job.metrics && (
                        <div className="text-sm">
                          <p className="text-green-400">
                            Acc: {(job.metrics.accuracy * 100).toFixed(1)}%
                          </p>
                          <p className="text-blue-400">
                            Loss: {job.metrics.loss.toFixed(3)}
                          </p>
                        </div>
                      )}
                      {job.status === "running" && (
                        <p className="text-sm text-gray-400">
                          {job.progress}% complete
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            {trainingJobs.length === 0 && (
              <p className="text-gray-400 text-center py-8">
                No training jobs yet. Start your first training job to see
                analytics here.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
