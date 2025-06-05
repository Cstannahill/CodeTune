export interface FineTuningRequest {
  campaignStyle: string;
  worldDescription: string;
  keyNPCs: string[];
  campaignThemes: string[];
  customPrompts: string[];
  model: string;
  temperature: number;
  maxTokens: number;
  trainingData: string;
  trainingSteps: number;
  learningRate: number;
  quantization: string;
  sharePublicly: boolean;
}

export async function createFineTunedDM(req: FineTuningRequest): Promise<void> {
  console.debug("createFineTunedDM", req);
  await new Promise((r) => setTimeout(r, 500));
}

export async function testFineTunedDM(_req: FineTuningRequest, message: string): Promise<{ response: string }> {
  await new Promise((r) => setTimeout(r, 300));
  return { response: `Echo: ${message}` };
}
