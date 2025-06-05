const API_URL = import.meta.env.VITE_API_URL ?? "";

export interface HFModel {
  id: string;
  downloads: number;
}

export async function fetchModels(): Promise<HFModel[]> {
  const res = await fetch(`${API_URL}/api/v1/models/`);
  if (!res.ok) throw new Error("Failed to load models");
  return res.json();
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function assistantChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/assistant/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error("Assistant request failed");
  const data = await res.json();
  return data.response as string;
}

// Saved Models API
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

export async function fetchSavedModels(): Promise<SavedModel[]> {
  const res = await fetch(`${API_URL}/api/v1/saved-models/`);
  if (!res.ok) throw new Error("Failed to load saved models");
  return res.json();
}

export async function getSavedModel(modelId: string): Promise<SavedModel> {
  const res = await fetch(`${API_URL}/api/v1/saved-models/${modelId}`);
  if (!res.ok) throw new Error("Failed to load saved model");
  return res.json();
}

export async function deleteSavedModel(modelId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/saved-models/${modelId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete saved model");
}

export async function getModelLineage(modelId: string): Promise<SavedModel[]> {
  const res = await fetch(`${API_URL}/api/v1/saved-models/${modelId}/lineage`);
  if (!res.ok) throw new Error("Failed to load model lineage");
  return res.json();
}

// Tuning API with iterative training support
export interface TuningRequest {
  base_model_id: string;
  dataset_id: string;
  parameters: Record<string, any>;
  save_model?: boolean;
  model_name?: string;
  model_description?: string;
  parent_model_id?: string; // For iterative training
}

export interface TuningJob {
  id: string;
  base_model_id: string;
  dataset_id: string;
  parameters: Record<string, any>;
  status: string;
  progress: number;
  result?: Record<string, any>;
  saved_model_id?: string;
  save_model: boolean;
  model_name?: string;
  model_description?: string;
  parent_model_id?: string;
  created_at: string;
  updated_at: string;
}

export async function startTuning(data: TuningRequest): Promise<TuningJob> {
  const res = await fetch(`${API_URL}/api/v1/tuning/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Failed to start tuning");
  return res.json();
}

export async function getTuningJob(jobId: string): Promise<TuningJob> {
  const res = await fetch(`${API_URL}/api/v1/tuning/${jobId}`);
  if (!res.ok) throw new Error("Failed to load tuning job");
  return res.json();
}

export async function getTuningProgress(jobId: string): Promise<{
  task_id: string;
  progress: number;
  status: string;
  result?: Record<string, any>;
  updated_at?: string;
  saved_model_id?: string;
}> {
  const res = await fetch(`${API_URL}/api/v1/tuning/${jobId}/progress`);
  if (!res.ok) throw new Error("Failed to load tuning progress");
  return res.json();
}
