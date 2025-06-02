import express, { Request, Response, NextFunction } from "express";
import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import { runCommandInContainer } from "./dockerRunner";

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.post("/webhook", (req: Request, res: Response, next: NextFunction) => {
  const handleRequest = async () => {
    try {
      const payload = req.body;
      const repoUrl = payload?.repository?.clone_url;
      const repoName = payload?.repository?.name;

      if (!repoUrl || !repoName) {
        return res.status(400).json({ error: "Invalid payload" });
      }

      const workspaceDir = path.join(__dirname, "..", "workspace", repoName);

      if (fs.existsSync(workspaceDir)) {
        fs.rmSync(workspaceDir, { recursive: true, force: true });
      }

      const git = simpleGit();
      await git.clone(repoUrl, workspaceDir);
      console.log(`✅ Repo ${repoName} cloned at ${workspaceDir}`);
      res.status(200).json({ message: "Repo cloned successfully" });
    } catch (err) {
      console.error("❌ Clone failed:", err);
      res.status(500).json({ error: "Failed to clone repo" });
      next(err);
    }
  };

  app.get("/test-run", async (req, res) => {
    try {
      const { output } = await runCommandInContainer("alpine", [
        "echo",
        "Hello from Docker container!",
      ]);
      res.send(output);
    } catch (error) {
      res.status(500).send(error);
    }
  });

  handleRequest();
});

app.listen(port, () => {
  console.log(`CicadaCI API running at http://localhost:${port}`);
});
