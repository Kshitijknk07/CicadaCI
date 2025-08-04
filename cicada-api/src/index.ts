import express, { Request, Response, NextFunction } from "express";
import simpleGit from "simple-git";
import path from "path";
import fs from "fs";
import { runCommandInContainer } from "./dockerRunner";
import { PipelineParser } from "./services/pipelineParser";
import { PipelineExecutor } from "./services/pipelineExecutor";
import { AuthService } from "./services/authService";
import { UserRole } from "./types/auth";

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// Services
const pipelineExecutor = new PipelineExecutor();
const authService = new AuthService();

// Authentication middleware
const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    res.status(401).json({ error: "No token provided" });
    return;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = authService.verifyToken(token);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

// Authorization middleware
const authorize = (resource: string, action: string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: "Authentication required" });
      return;
    }

    if (!authService.hasPermission(req.user.role, resource, action)) {
      res.status(403).json({ error: "Insufficient permissions" });
      return;
    }

    next();
  };
};

// Routes

// Serve the dashboard
app.get("/", (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Authentication routes
app.post("/api/auth/login", async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;
    const result = await authService.login({ username, password });
    res.json(result);
  } catch (error) {
    res
      .status(401)
      .json({ error: error instanceof Error ? error.message : "Login failed" });
  }
});

app.post("/api/auth/register", async (req: Request, res: Response) => {
  try {
    const user = await authService.register(req.body);
    res.json({ user });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : "Registration failed",
    });
  }
});

app.get("/api/auth/me", authenticate, (req: Request, res: Response) => {
  const user = authService.getUserById(req.user!.userId);
  if (!user) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user });
});

// Pipeline runs API
app.get(
  "/api/runs",
  authenticate,
  authorize("run", "read"),
  (req: Request, res: Response) => {
    const runs = pipelineExecutor.getAllRuns();
    res.json({ runs });
  }
);

app.get(
  "/api/runs/:runId",
  authenticate,
  authorize("run", "read"),
  (req: Request, res: Response) => {
    const run = pipelineExecutor.getRun(req.params.runId);
    if (!run) {
      res.status(404).json({ error: "Run not found" });
      return;
    }
    res.json({ run });
  }
);

app.post(
  "/api/runs/:runId/cancel",
  authenticate,
  authorize("run", "cancel"),
  (req: Request, res: Response) => {
    const success = pipelineExecutor.cancelRun(req.params.runId);
    if (!success) {
      res.status(400).json({ error: "Cannot cancel run" });
      return;
    }
    res.json({ message: "Run cancelled successfully" });
  }
);

// Webhook endpoint (enhanced with pipeline execution)
app.post(
  "/webhook",
  async (req: Request, res: Response, next: NextFunction) => {
    const handleRequest = async () => {
      try {
        const payload = req.body;
        const repoUrl = payload?.repository?.clone_url;
        const repoName = payload?.repository?.name;

        if (!repoUrl || !repoName) {
          res.status(400).json({ error: "Invalid payload" });
          return;
        }

        const workspaceDir = path.join(__dirname, "..", "workspace", repoName);

        if (fs.existsSync(workspaceDir)) {
          fs.rmSync(workspaceDir, { recursive: true, force: true });
        }

        const git = simpleGit();
        await git.clone(repoUrl, workspaceDir);
        console.log(`✅ Repo ${repoName} cloned at ${workspaceDir}`);

        // Look for pipeline configuration
        const configPath = PipelineParser.findConfigFile(workspaceDir);
        if (configPath) {
          try {
            const config = PipelineParser.parseConfig(configPath);
            console.log(`📋 Found pipeline config: ${config.name}`);

            // Execute pipeline
            const runId = await pipelineExecutor.executePipeline(
              config,
              workspaceDir,
              {
                type: "webhook",
                payload: payload,
              }
            );

            console.log(`🚀 Pipeline execution started: ${runId}`);
            res.status(200).json({
              message: "Repo cloned and pipeline started",
              runId,
              pipeline: config.name,
            });
          } catch (error) {
            console.error("❌ Pipeline execution failed:", error);
            res.status(500).json({
              error: "Pipeline execution failed",
              details: error instanceof Error ? error.message : "Unknown error",
            });
          }
        } else {
          console.log(`⚠️ No pipeline config found in ${repoName}`);
          res.status(200).json({
            message: "Repo cloned successfully (no pipeline config found)",
          });
        }
      } catch (err) {
        console.error("❌ Clone failed:", err);
        res.status(500).json({ error: "Failed to clone repo" });
        next(err);
      }
    };

    handleRequest();
  }
);

// Test endpoint
app.get("/test-run", async (req: Request, res: Response) => {
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

// Health check
app.get("/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Error handling middleware
app.use((error: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", error);
  res.status(500).json({ error: "Internal server error" });
});

app.listen(port, () => {
  console.log(`🚀 CicadaCI API running at http://localhost:${port}`);
  console.log(`📊 Dashboard available at http://localhost:${port}`);
  console.log(`🔐 Default admin credentials: admin / admin123`);
  console.log(`👤 Default user credentials: user / user123`);
});
