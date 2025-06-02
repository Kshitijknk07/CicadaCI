import Docker from "dockerode";

const docker = new Docker();

export async function runCommandInContainer(
  image: string,
  cmd: string[]
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

      await container.wait();

      await container.remove();

      resolve({ output, error: "" });
    } catch (error: any) {
      reject({ output: "", error: error.message });
    }
  });
}
