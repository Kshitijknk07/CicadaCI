# CicadaCI

CicadaCI — A self-hosted, Docker-based CI/CD platform where each pipeline step runs inside isolated Docker containers.

## Overview

CicadaCI is designed to provide a robust and flexible CI/CD solution that leverages Docker containers for isolation and scalability. Each step in the pipeline runs in its own Docker container, ensuring that processes are isolated and can be easily managed.

## Features

- **Self-hosted**: Run CicadaCI on your own infrastructure, giving you full control over your CI/CD environment.
- **Docker-based**: Utilize Docker containers to ensure each pipeline step is isolated, reproducible, and scalable.
- **Express API**: The platform includes an Express-based API for managing webhooks and triggering pipeline runs.
- **Git Integration**: Automatically clone repositories using webhooks to initiate CI/CD processes.
- **Docker Runner**: Execute commands within Docker containers using the Docker CLI through Node.js (with plans to integrate `dockerode`).

## Current Implementation

- **API Endpoints**:
  - `/webhook`: Accepts POST requests to trigger repository cloning and pipeline execution.
  - `/test-run`: A test endpoint to demonstrate running commands inside a Docker container.

- **Docker Integration**:
  - Uses Node.js `child_process.exec` to run Docker CLI commands for container management.

- **Git Operations**:
  - Utilizes `simple-git` to clone repositories based on webhook payloads.

## Future Enhancements

- **Pipeline Configuration**: Implement a configuration system to define complex pipelines with multiple steps.
- **User Interface**: Develop a web-based UI for easier management and monitoring of pipelines.
- **Authentication and Authorization**: Add security features to manage access to the API and pipelines.
- **Advanced Logging and Monitoring**: Integrate logging and monitoring solutions for better visibility into pipeline executions.

## Getting Started

### Prerequisites

- Docker installed on your server.
- Node.js installed.
- (Optional) pnpm installed for package management.

### Installation

1. Clone the repository:

   ```bash
   git clone <repository-url>
   ```
2. Install dependencies:
    ```bash 
    pnpm install
    # or
    npm install
    ```
3. Start the development server:
    ```bash 
    pnpm run dev
    # or
    npm run dev
    ```
## Usage

1. **Configure Webhooks**  
   Set up a webhook in your Git repository to point to the `/webhook` endpoint of your CicadaCI instance:
    ```bash 
    curl -X POST http://localhost:3000/webhook \
     -H "Content-Type: application/json" \
     -d '{"repository":{"clone_url":"https://github.com/your/repo.git","name":"repo"}}'
    ```
2. **Test Docker Integration**  
Use the `/test-run` endpoint to verify that Docker containers are being executed correctly.

3. **Example Webhook POST Request (using curl)** 
    You can manually trigger the webhook for testing using the following `curl` command:
    ```bash
    curl -X POST http://localhost:3000/webhook \
    -H "Content-Type: application/json" \
    -d '{
    "repository": {
      "clone_url": "https://github.com/your-username/your-repo.git",
      "name": "your-repo"
    }
     }'
     ```
## More Updates Coming 🚧

CicadaCI is actively under development. Here's what i am working on next:

- 🎛️ **Pipeline Configuration File** (e.g., `.cicadaci.yml`) for defining multi-step builds  
- 🧑‍💻 **Web UI Dashboard** to visualize pipeline status, logs, and run history  
- 🔐 **Authentication & RBAC** to control access  
- 📊 **Advanced Logging and Monitoring** with timestamps and real-time logs  
- 📦 **Pluggable Runners** and support for custom build images  

Thank_you! :)
