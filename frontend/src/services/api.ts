const API_URL = import.meta.env.VITE_API_URL ?? "";

console.log("API_URL configured as:", API_URL);

async function handleApiError(res: Response): Promise<never> {
  const text = await res.text();
  let detail = text;
  try {
    const obj = JSON.parse(text);
    detail = obj.detail || obj.error?.message || text;
  } catch {
    // ignore
  }
  throw new Error(detail);
}

export interface HFModel {
  id: string;
  downloads: number;
  task?: string | null;
  tags?: string[];
}

export async function fetchModels(): Promise<HFModel[]> {
  const url = `${API_URL}/api/v1/models/`;
  console.log("Fetching Huggingface models from:", url);

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch Huggingface models:", res.status);
    await handleApiError(res);
  }

  const data = await res.json();
  console.log("Huggingface models response:", data);
  return data;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export async function assistantChat(
  messages: ChatMessage[],
  model?: string,
): Promise<string> {
  const url = `${API_URL}/api/v1/assistant/chat`;
  // Ensure CORS fetch with no credentials
  console.log("Calling assistantChat:", url, { messages, model });
  const res = await fetch(url, {
    method: "POST",
    mode: "cors",
    credentials: "omit",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  });
  console.log("assistantChat response status:", res.status, res.statusText);
  if (!res.ok) {
    console.error("assistantChat error status:", res.status);
    await handleApiError(res);
  }
  const data = await res.json();
  console.log("assistantChat response data:", data);
  return data.response as string;
}

export interface SavedModel {
  id: string;
  name: string;
  parameters: Record<string, unknown> | null;
  result: Record<string, unknown> | null;
  local_path?: string | null; // Add this for save location feedback
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
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function saveModel(payload: {
  name: string;
  dataset_id?: string;
  parameters?: Record<string, unknown>;
  result?: Record<string, unknown>;
}): Promise<SavedModel> {
  const res = await fetch(`${API_URL}/api/v1/user-models/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function importModel(modelId: string) {
  const res = await fetch(`${API_URL}/api/v1/user-models/import/${modelId}`, {
    method: "POST",
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function deleteModel(modelId: string): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/user-models/${modelId}`, {
    method: "DELETE",
  });
  if (!res.ok) await handleApiError(res);
}

// Tuning endpoints
export async function createTuning(payload: {
  dataset_id: string;
  parameters: Record<string, unknown>;
}): Promise<Tuning> {
  const res = await fetch(`${API_URL}/api/v1/tuning/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function getTuningProgress(
  taskId: string,
): Promise<TuningProgress> {
  const res = await fetch(`${API_URL}/api/v1/tuning/${taskId}/progress`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

// Ollama endpoints
export async function fetchOllamaModels(): Promise<string[]> {
  const url = `${API_URL}/api/v1/ollama/models`;
  console.log("Fetching Ollama models from:", url);

  const res = await fetch(url);
  if (!res.ok) {
    console.error("Failed to fetch Ollama models:", res.status);
    await handleApiError(res);
  }

  const data = await res.json();
  console.log("Ollama models response:", data);
  return data;
}

export async function pullOllamaModel(model: string) {
  const res = await fetch(`${API_URL}/api/v1/ollama/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model }),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function ollamaChat(
  messages: ChatMessage[],
  model: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/api/v1/ollama/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ messages, model }),
  });
  if (!res.ok) await handleApiError(res);
  const data = await res.json();
  return data.response as string;
}

// HuggingFace model pull and push
export async function pullHFModel(repo_id: string, local_dir?: string) {
  const res = await fetch(`${API_URL}/api/v1/models/pull`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ repo_id, local_dir }),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function pushHFModel(
  local_dir: string,
  repo_name: string,
  isPrivate = true,
) {
  const res = await fetch(`${API_URL}/api/v1/models/push`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ local_dir, repo_name, private: isPrivate }),
  });
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export interface UserSettings {
  local_model_dir?: string;
  dataset_dir?: string;
  hf_token?: string;
  hf_user?: string;
}

export async function getSettings(): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings`);
  if (!res.ok) throw new Error("Failed to load settings");
  return res.json();
}

export async function updateSettings(
  settings: UserSettings,
): Promise<UserSettings> {
  const res = await fetch(`${API_URL}/api/v1/settings`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
  return res.json();
}

// Dataset endpoints
export async function uploadDataset(
  file: File,
  onProgress?: (pct: number) => void,
): Promise<{ dataset_id: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${API_URL}/api/v1/datasets/upload`);
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve(JSON.parse(xhr.responseText));
      } else {
        reject(new Error("Upload failed"));
      }
    };
    xhr.onerror = () => reject(new Error("Upload failed"));
    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress((e.loaded / e.total) * 100);
        }
      };
    }
    const data = new FormData();
    data.append("file", file);
    xhr.send(data);
  });
}

export interface DatasetInfo {
  name: string;
  path: string;
  size: number;
}

export async function listDatasets(): Promise<DatasetInfo[]> {
  const res = await fetch(`${API_URL}/api/v1/datasets/`);
  if (!res.ok) await handleApiError(res);
  return res.json();
}

export async function createOllamaModel(
  name: string,
  modelfile: string,
  gguf_path?: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/api/v1/ollama/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, modelfile, gguf_path }),
  });
  if (!res.ok) await handleApiError(res);
}
