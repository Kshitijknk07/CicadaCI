import Docker from "dockerode";

const docker = new Docker();

interface ContainerOptions {
  workingDir?: string;
  environment?: Record<string, string>;
  timeout?: number;
}

export async function runCommandInContainer(
  image: string,
  cmd: string[],
  options: ContainerOptions = {}
): Promise<{ output: string; error: string }> {
  return new Promise(async (resolve, reject) => {
    try {
      // Pull image if not exists
      await new Promise((res, rej) => {
        docker.pull(image, (err: any, stream: NodeJS.ReadableStream) => {
          if (err) return rej(err);
          docker.modem.followProgress(stream, onFinished, onProgress);

          function onFinished(err: any, output: any) {
            if (err) rej(err);
            else res(output);
          }
          function onProgress(event: any) {
            // optionally handle progress logs
          }
        });
      });

      // Create container
      const container = await docker.createContainer({
        Image: image,
        Cmd: cmd,
        AttachStdout: true,
        AttachStderr: true,
        Tty: false,
        WorkingDir: options.workingDir,
        Env: options.environment
          ? Object.entries(options.environment).map(([k, v]) => `${k}=${v}`)
          : undefined,
      });

      // Start container
      const stream = await container.attach({
        stream: true,
        stdout: true,
        stderr: true,
      });
      await container.start();

      let output = "";
      stream.on("data", (chunk) => {
        output += chunk.toString();
      });

      // Wait for container with timeout
      const waitPromise = container.wait();
      const timeoutPromise = options.timeout
        ? new Promise((_, reject) =>
            setTimeout(
              () => reject(new Error("Container timeout")),
              options.timeout
            )
          )
        : Promise.resolve();

      await Promise.race([waitPromise, timeoutPromise]);

      await container.remove();

      resolve({ output, error: "" });
    } catch (error: any) {
      reject({ output: "", error: error.message });
    }
  });
}
