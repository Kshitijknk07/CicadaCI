export interface PipelineStep {
  name: string;
  image: string;
  commands: string[];
  environment?: Record<string, string>;
  workingDir?: string;
  timeout?: number;
  dependsOn?: string[];
}

export interface PipelineConfig {
  version: string;
  name: string;
  description?: string;
  triggers?: {
    branches?: string[];
    tags?: string[];
    events?: string[];
  };
  steps: PipelineStep[];
  environment?: Record<string, string>;
  timeout?: number;
}

export interface PipelineRun {
  id: string;
  pipelineName: string;
  status: "pending" | "running" | "completed" | "failed" | "cancelled";
  startTime: Date;
  endTime?: Date;
  steps: PipelineStepRun[];
  logs: LogEntry[];
  trigger: {
    type: string;
    payload: any;
  };
}

export interface PipelineStepRun {
  name: string;
  status: "pending" | "running" | "completed" | "failed" | "skipped";
  startTime: Date;
  endTime?: Date;
  output: string;
  error?: string;
  exitCode?: number;
}

export interface LogEntry {
  timestamp: Date;
  level: "info" | "warn" | "error" | "debug";
  step?: string;
  message: string;
  data?: any;
}
