const API_URL = import.meta.env.VITE_API_URL ?? '';

export interface HFModel { id: string; downloads: number }

export async function fetchModels(): Promise<HFModel[]> {
  const res = await fetch(`${API_URL}/api/v1/models/`);
  if (!res.ok) throw new Error('Failed to load models');
  return res.json();
}

export interface ChatMessage { role: 'user' | 'assistant' | 'system'; content: string }

export async function assistantChat(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/assistant/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages }),
  });
  if (!res.ok) throw new Error('Assistant request failed');
  const data = await res.json();
  return data.response as string;
}

export interface SavedModel {
  id: string;
  name: string;
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
}

export interface Tuning {
  id: string;
  dataset_id: string;
  parameters: Record<string, unknown>;
  status: string;
  progress: number;
  result: Record<string, unknown> | null;
}

export interface TuningProgress {
  task_id: string;
  progress: number;
  status: string;
  result: Record<string, unknown> | null;
  updated_at?: string;
}

export async function fetchSavedModels(): Promise<SavedModel[]> {
  const res = await fetch(`${API_URL}/api/v1/user-models/`);
  if (!res.ok) throw new Error('Failed to load saved models');
  return res.json();
}

export async function saveModel(payload: {
  name: string;
  dataset_id?: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
}): Promise<SavedModel> {
  const res = await fetch(`${API_URL}/api/v1/user-models/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Save model failed');
  return res.json();
}

export async function importModel(modelId: string) {
  const res = await fetch(`${API_URL}/api/v1/user-models/import/${modelId}`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error('Import failed');
  return res.json();
}

export async function deleteModel(modelId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/user-models/${modelId}`, {
    method: 'DELETE',
  });
  if (!res.ok) throw new Error('Delete failed');
}

// Tuning endpoints
export async function createTuning(payload: {
  dataset_id: string;
  parameters: Record<string, unknown>;
}): Promise<Tuning> {
  const res = await fetch(`${API_URL}/api/v1/tuning/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Start tuning failed');
  return res.json();
}

export async function getTuningProgress(taskId: string): Promise<TuningProgress> {
  const res = await fetch(`${API_URL}/api/v1/tuning/${taskId}/progress`);
  if (!res.ok) throw new Error('Progress request failed');
  return res.json();
}

// Ollama endpoints
export async function fetchOllamaModels(): Promise<string[]> {
  const res = await fetch(`${API_URL}/api/v1/ollama/models`);
  if (!res.ok) throw new Error('Failed to list models');
  return res.json();
}

export async function pullOllamaModel(model: string) {
  const res = await fetch(`${API_URL}/api/v1/ollama/pull`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) throw new Error('Pull failed');
  return res.json();
}

export async function ollamaChat(
  messages: ChatMessage[],
  model: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/ollama/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messages, model }),
  });
  if (!res.ok) throw new Error('Ollama chat failed');
  const data = await res.json();
  return data.response as string;
}
