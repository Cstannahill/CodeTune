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
