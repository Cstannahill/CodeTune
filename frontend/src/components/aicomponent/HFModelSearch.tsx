import { useEffect, useState, useMemo } from "react";
import {
  fetchModels,
  type HFModel,
  pullHFModel,
  pushHFModel,
} from "@/services/api";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { SiHuggingface } from "react-icons/si";
import { toast } from "react-hot-toast";

const TASKS = [
  "text-generation",
  "text-classification",
  "token-classification",
  "question-answering",
  "summarization",
  "translation",
  "conversational",
  "other",
];

export function HFModelSearch() {
  const [models, setModels] = useState<HFModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"downloads" | "id">("downloads");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [task, setTask] = useState<string>("");
  const [tag, setTag] = useState<string>("");

  useEffect(() => {
    setLoading(true);
    fetchModels()
      .then(setModels)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Collect all tags from models for tag filter
  const allTags = useMemo(() => {
    const tags = new Set<string>();
    models.forEach((m) => (m.tags || []).forEach((t) => tags.add(t)));
    return Array.from(tags).sort();
  }, [models]);

  const filtered = useMemo(() => {
    let filtered = models;
    if (search.trim()) {
      filtered = filtered.filter((m) =>
        m.id.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (task) {
      filtered = filtered.filter((m) => (m.task || "other") === task);
    }
    if (tag) {
      filtered = filtered.filter((m) => (m.tags || []).includes(tag));
    }
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "downloads") {
        return sortDir === "desc"
          ? b.downloads - a.downloads
          : a.downloads - b.downloads;
      } else {
        return sortDir === "desc"
          ? b.id.localeCompare(a.id)
          : a.id.localeCompare(b.id);
      }
    });
    return filtered;
  }, [models, search, sortBy, sortDir, task, tag]);

  const handlePull = async (repo_id: string) => {
    try {
      const res = await pullHFModel(repo_id);
      toast.success(`Model pulled to: ${res.local_dir}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pull failed");
    }
  };
  const handlePush = async (repo_id: string) => {
    // For demo: prompt for local_dir and repo_name
    const local_dir = prompt("Local directory to push:");
    if (!local_dir) return;
    try {
      const res = await pushHFModel(local_dir, repo_id);
      toast.success(`Model pushed to: ${res.repo_id}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Push failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center gap-2">
        <Input
          placeholder="Search model name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-64 bg-card border border-border"
        />
        <select
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="bg-card border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">All Tasks</option>
          {TASKS.map((t) => (
            <option key={t} value={t}>
              {t.replace(/-/g, " ")}
            </option>
          ))}
        </select>
        <select
          value={tag}
          onChange={(e) => setTag(e.target.value)}
          className="bg-card border border-border rounded px-2 py-1 text-sm"
        >
          <option value="">All Categories</option>
          {allTags.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <div className="flex gap-2">
          <Button
            variant={sortBy === "downloads" ? "default" : "secondary"}
            onClick={() => setSortBy("downloads")}
            size="sm"
          >
            Sort by Downloads
          </Button>
          <Button
            variant={sortBy === "id" ? "default" : "secondary"}
            onClick={() => setSortBy("id")}
            size="sm"
          >
            Sort by Name
          </Button>
          <Button
            variant="ghost"
            onClick={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
            size="sm"
          >
            {sortDir === "asc" ? "Asc" : "Desc"}
          </Button>
        </div>
      </div>
      {loading ? (
        <div className="text-gray-400">Loading models...</div>
      ) : error ? (
        <div className="text-red-500">{error}</div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Model</TableHead>
              <TableHead>Task</TableHead>
              <TableHead>Categories</TableHead>
              <TableHead>Downloads</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-gray-400">
                  No models found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((m) => (
                <TableRow key={m.id}>
                  <TableCell>
                    <span className="inline-flex items-center gap-2">
                      <SiHuggingface className="inline w-4 h-4 text-yellow-400" />
                      {m.id}
                    </span>
                  </TableCell>
                  <TableCell>{m.task || "other"}</TableCell>
                  <TableCell>
                    {(m.tags || []).slice(0, 4).join(", ")}
                    {m.tags && m.tags.length > 4 && " ..."}
                  </TableCell>
                  <TableCell>{m.downloads.toLocaleString()}</TableCell>
                  <TableCell>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => handlePull(m.id)}
                    >
                      Pull
                    </Button>
                    <Button
                      size="sm"
                      variant="secondary"
                      className="ml-2"
                      onClick={() => handlePush(m.id)}
                    >
                      Push
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
