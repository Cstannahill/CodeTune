export interface FineTuningPreset {
  id: string;
  name: string;
  description: string;
  epochs: number;
  trainingSteps: number;
  learningRate: number;
  quantization: "none" | "int8" | "int4";
}

export const fineTuningPresets: FineTuningPreset[] = [
  {
    id: "fast-summarization",
    name: "Fast Summarization",
    description: "Optimized for quick summarization of short text snippets.",
    epochs: 2,
    trainingSteps: 400,
    learningRate: 0.0001,
    quantization: "int8",
  },
  {
    id: "creative-writing",
    name: "Creative Writing",
    description: "Encourages more imaginative and narrative-driven output.",
    epochs: 4,
    trainingSteps: 1200,
    learningRate: 0.00005,
    quantization: "none",
  },
  {
    id: "technical-qa",
    name: "Technical Q&A",
    description: "Focuses on accurate technical question answering.",
    epochs: 3,
    trainingSteps: 1000,
    learningRate: 0.00005,
    quantization: "none",
  },
];
