import { HFModelSearch } from "@/components/aicomponent/HFModelSearch";

export default function HFModelBrowserPage() {
  return (
    <div className="max-w-4xl mx-auto py-8">
      <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
        HuggingFace Model Browser
      </h2>
      <HFModelSearch />
    </div>
  );
}
