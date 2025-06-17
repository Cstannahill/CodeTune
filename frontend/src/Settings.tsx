import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "react-hot-toast";
import { getSettings, updateSettings } from "@/services/api";

export default function Settings() {
  const [localDir, setLocalDir] = useState("");
  const [datasetDir, setDatasetDir] = useState("");
  const [hfToken, setHfToken] = useState("");
  const [hfUser, setHfUser] = useState("");
  const [showHfDialog, setShowHfDialog] = useState(false);

  // Load settings from backend/localStorage on mount
  useEffect(() => {
    const ld = localStorage.getItem("codetune_local_dir");
    const dd = localStorage.getItem("codetune_dataset_dir");
    const ht = localStorage.getItem("codetune_hf_token");
    const hu = localStorage.getItem("codetune_hf_user");
    if (ld) setLocalDir(ld);
    if (dd) setDatasetDir(dd);
    if (ht) setHfToken(ht);
    if (hu) setHfUser(hu);
    getSettings()
      .then((settings) => {
        if (settings.local_model_dir) setLocalDir(settings.local_model_dir);
        if (settings.dataset_dir) setDatasetDir(settings.dataset_dir);
        if (settings.hf_token) setHfToken(settings.hf_token);
        if (settings.hf_user) setHfUser(settings.hf_user);
      })
      .catch(() => {
        toast.error("Failed to load settings");
      });
  }, []);

  const handleSaveDirectory = async () => {
    try {
      await updateSettings({
        local_model_dir: localDir,
        dataset_dir: datasetDir,
        hf_token: hfToken,
        hf_user: hfUser,
      });
      toast.success("Model directory saved!");
      localStorage.setItem("codetune_local_dir", localDir);
      localStorage.setItem("codetune_dataset_dir", datasetDir);
    } catch {
      toast.error("Failed to save directory");
    }
  };

  const handleSaveHf = async () => {
    try {
      await updateSettings({
        local_model_dir: localDir,
        dataset_dir: datasetDir,
        hf_token: hfToken,
        hf_user: hfUser,
      });
      toast.success("HuggingFace credentials saved!");
      setShowHfDialog(false);
      localStorage.setItem("codetune_hf_token", hfToken);
      localStorage.setItem("codetune_hf_user", hfUser);
    } catch {
      toast.error("Failed to save HuggingFace credentials");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h2 className="text-2xl font-bold text-white mb-4">Settings</h2>
      <Card className="bg-black/20 border-purple-500/20 mb-6">
        <CardHeader>
          <CardTitle className="text-white text-lg">Model Storage</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label className="block text-sm text-muted-foreground mb-1">
              Local Model Directory
            </label>
            <Input
              value={localDir}
              onChange={(e) => setLocalDir(e.target.value)}
              placeholder="e.g. C:\\models or /home/user/models"
              className="bg-card border border-border text-primary"
            />
            <label className="block text-sm text-muted-foreground mb-1 mt-4">
              Dataset Directory
            </label>
            <Input
              value={datasetDir}
              onChange={(e) => setDatasetDir(e.target.value)}
              placeholder="e.g. ./datasets"
              className="bg-card border border-border text-primary"
            />
            <Button
              className="mt-2"
              variant="outline"
              onClick={handleSaveDirectory}
              disabled={!localDir.trim() || !datasetDir.trim()}
            >
              Save Directory
            </Button>
          </div>
          <div>
            <Dialog open={showHfDialog} onOpenChange={setShowHfDialog}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  Configure HuggingFace Integration
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>HuggingFace Integration</DialogTitle>
                </DialogHeader>
                <div className="space-y-2">
                  <label className="block text-sm text-muted-foreground mb-1">
                    HuggingFace Username/Org
                  </label>
                  <Input
                    value={hfUser}
                    onChange={(e) => setHfUser(e.target.value)}
                    placeholder="e.g. myusername or myorg"
                  />
                  <label className="block text-sm text-muted-foreground mb-1">
                    HuggingFace API Token
                  </label>
                  <Input
                    value={hfToken}
                    onChange={(e) => setHfToken(e.target.value)}
                    placeholder="hf_xxx..."
                    type="password"
                  />
                </div>
                <DialogFooter>
                  <Button onClick={handleSaveHf} type="button" autoFocus>
                    Save
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
