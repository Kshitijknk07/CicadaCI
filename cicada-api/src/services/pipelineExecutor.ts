import {
  PipelineConfig,
  PipelineStep,
  PipelineRun,
  PipelineStepRun,
  LogEntry,
} from "../types/pipeline";
import { runCommandInContainer } from "../dockerRunner";
import { v4 as uuidv4 } from "uuid";

export class PipelineExecutor {
  private runs: Map<string, PipelineRun> = new Map();

  async executePipeline(
    config: PipelineConfig,
    repoPath: string,
    trigger: { type: string; payload: any }
  ): Promise<string> {
    const runId = uuidv4();
    const run: PipelineRun = {
      id: runId,
      pipelineName: config.name,
      status: "pending",
      startTime: new Date(),
      steps: config.steps.map((step) => ({
        name: step.name,
        status: "pending",
        startTime: new Date(),
        output: "",
        error: undefined,
        exitCode: undefined,
      })),
      logs: [],
      trigger,
    };

    this.runs.set(runId, run);
    this.addLog(runId, "info", `Pipeline '${config.name}' started`);

    // Execute pipeline asynchronously
    this.executePipelineAsync(runId, config, repoPath);

    return runId;
  }

  private async executePipelineAsync(
    runId: string,
    config: PipelineConfig,
    repoPath: string
  ): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    try {
      run.status = "running";
      this.addLog(runId, "info", "Pipeline execution started");

      // Create execution order based on dependencies
      const executionOrder = this.createExecutionOrder(config.steps);

      for (const stepGroup of executionOrder) {
        // Execute steps in parallel within each group
        const stepPromises = stepGroup.map((step) =>
          this.executeStep(runId, step, repoPath, config.environment || {})
        );

        await Promise.all(stepPromises);
      }

      // Check if all steps completed successfully
      const failedSteps = run.steps.filter((s) => s.status === "failed");
      if (failedSteps.length > 0) {
        run.status = "failed";
        this.addLog(
          runId,
          "error",
          `Pipeline failed: ${failedSteps.length} step(s) failed`
        );
      } else {
        run.status = "completed";
        this.addLog(runId, "info", "Pipeline completed successfully");
      }
    } catch (error) {
      run.status = "failed";
      this.addLog(runId, "error", `Pipeline execution error: ${error}`);
    } finally {
      run.endTime = new Date();
    }
  }

  private createExecutionOrder(steps: PipelineStep[]): PipelineStep[][] {
    const executionOrder: PipelineStep[][] = [];
    const completed = new Set<string>();
    const stepMap = new Map(steps.map((s) => [s.name, s]));

    while (completed.size < steps.length) {
      const currentGroup: PipelineStep[] = [];

      for (const step of steps) {
        if (completed.has(step.name)) continue;

        const dependencies = step.dependsOn || [];
        const allDependenciesMet = dependencies.every((dep) =>
          completed.has(dep)
        );

        if (allDependenciesMet) {
          currentGroup.push(step);
        }
      }

      if (currentGroup.length === 0) {
        throw new Error(
          "Circular dependency detected or invalid step configuration"
        );
      }

      executionOrder.push(currentGroup);
      currentGroup.forEach((step) => completed.add(step.name));
    }

    return executionOrder;
  }

  private async executeStep(
    runId: string,
    step: PipelineStep,
    repoPath: string,
    globalEnv: Record<string, string>
  ): Promise<void> {
    const run = this.runs.get(runId);
    if (!run) return;

    const stepRun = run.steps.find((s) => s.name === step.name);
    if (!stepRun) return;

    try {
      stepRun.status = "running";
      stepRun.startTime = new Date();
      this.addLog(runId, "info", `Step '${step.name}' started`, {
        step: step.name,
      });

      // Merge environment variables
      const env = { ...globalEnv, ...step.environment };

      // Execute commands in sequence
      for (const command of step.commands) {
        const { output, error } = await runCommandInContainer(
          step.image,
          command.split(" "),
          {
            workingDir: step.workingDir || repoPath,
            environment: env,
            timeout: step.timeout || 300000, // 5 minutes default
          }
        );

        stepRun.output += output;
        if (error) {
          stepRun.error = error;
          stepRun.status = "failed";
          this.addLog(runId, "error", `Step '${step.name}' failed: ${error}`, {
            step: step.name,
          });
          return;
        }
      }

      stepRun.status = "completed";
      stepRun.endTime = new Date();
      this.addLog(runId, "info", `Step '${step.name}' completed successfully`, {
        step: step.name,
      });
    } catch (error) {
      stepRun.status = "failed";
      stepRun.error = error instanceof Error ? error.message : String(error);
      stepRun.endTime = new Date();
      this.addLog(runId, "error", `Step '${step.name}' failed: ${error}`, {
        step: step.name,
      });
    }
  }

  private addLog(
    runId: string,
    level: LogEntry["level"],
    message: string,
    data?: any
  ): void {
    const run = this.runs.get(runId);
    if (!run) return;

    const logEntry: LogEntry = {
      timestamp: new Date(),
      level,
      message,
      data,
    };

    run.logs.push(logEntry);
    console.log(`[${runId}] ${level.toUpperCase()}: ${message}`);
  }

  getRun(runId: string): PipelineRun | undefined {
    return this.runs.get(runId);
  }

  getAllRuns(): PipelineRun[] {
    return Array.from(this.runs.values());
  }

  cancelRun(runId: string): boolean {
    const run = this.runs.get(runId);
    if (!run || run.status === "completed" || run.status === "failed") {
      return false;
    }

    run.status = "cancelled";
    run.endTime = new Date();
    this.addLog(runId, "info", "Pipeline cancelled by user");
    return true;
  }
}
