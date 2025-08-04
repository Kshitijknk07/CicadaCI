import yaml from "js-yaml";
import fs from "fs";
import path from "path";
import { PipelineConfig, PipelineStep } from "../types/pipeline";

export class PipelineParser {
  static parseConfig(configPath: string): PipelineConfig {
    try {
      const configContent = fs.readFileSync(configPath, "utf8");
      const config = yaml.load(configContent) as PipelineConfig;

      // Validate configuration
      this.validateConfig(config);

      return config;
    } catch (error) {
      throw new Error(`Failed to parse pipeline config: ${error}`);
    }
  }

  static validateConfig(config: PipelineConfig): void {
    if (!config.version) {
      throw new Error("Pipeline version is required");
    }

    if (!config.name) {
      throw new Error("Pipeline name is required");
    }

    if (!config.steps || config.steps.length === 0) {
      throw new Error("At least one step is required");
    }

    // Validate each step
    config.steps.forEach((step, index) => {
      this.validateStep(step, index, config.steps);
    });

    // Check for circular dependencies
    this.checkCircularDependencies(config.steps);
  }

  private static validateStep(
    step: PipelineStep,
    index: number,
    allSteps: PipelineStep[]
  ): void {
    if (!step.name) {
      throw new Error(`Step ${index}: name is required`);
    }

    if (!step.image) {
      throw new Error(`Step ${index}: image is required`);
    }

    if (!step.commands || step.commands.length === 0) {
      throw new Error(`Step ${index}: at least one command is required`);
    }

    // Validate dependencies exist
    if (step.dependsOn) {
      step.dependsOn.forEach((dep) => {
        if (!allSteps.find((s) => s.name === dep)) {
          throw new Error(
            `Step ${step.name}: depends on non-existent step '${dep}'`
          );
        }
      });
    }
  }

  private static checkCircularDependencies(steps: PipelineStep[]): void {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();

    const hasCycle = (stepName: string): boolean => {
      if (recursionStack.has(stepName)) {
        return true;
      }

      if (visited.has(stepName)) {
        return false;
      }

      visited.add(stepName);
      recursionStack.add(stepName);

      const step = steps.find((s) => s.name === stepName);
      if (step?.dependsOn) {
        for (const dep of step.dependsOn) {
          if (hasCycle(dep)) {
            return true;
          }
        }
      }

      recursionStack.delete(stepName);
      return false;
    };

    for (const step of steps) {
      if (hasCycle(step.name)) {
        throw new Error(
          `Circular dependency detected involving step '${step.name}'`
        );
      }
    }
  }

  static findConfigFile(repoPath: string): string | null {
    const possiblePaths = [
      ".cicadaci.yml",
      ".cicadaci.yaml",
      "cicadaci.yml",
      "cicadaci.yaml",
    ];

    for (const configPath of possiblePaths) {
      const fullPath = path.join(repoPath, configPath);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }

    return null;
  }
}
