# CicadaCI 🚀

**CicadaCI** — A fully-featured, self-hosted, Docker-based CI/CD platform where each pipeline step runs inside isolated Docker containers with advanced features including authentication, web UI, and comprehensive pipeline management.

## ✨ Features

### 🎛️ **Pipeline Configuration System**
- **YAML-based configuration** (`.cicadaci.yml`) for defining multi-step builds
- **Dependency management** between pipeline steps
- **Parallel execution** of independent steps
- **Timeout controls** and **working directory** configuration
- **Environment variables** support at pipeline and step levels

### 🧑‍💻 **Modern Web UI Dashboard**
- **Real-time pipeline monitoring** with live status updates
- **Beautiful, responsive design** using Tailwind CSS and Vue.js
- **Interactive pipeline run details** with step-by-step logs
- **Statistics dashboard** showing success/failure rates
- **Pipeline cancellation** and management controls

### 🔐 **Authentication & RBAC**
- **JWT-based authentication** with secure token management
- **Role-based access control** (Admin, User, Viewer roles)
- **Permission system** for pipeline and run management
- **Default admin account** for initial setup

### 📊 **Advanced Logging and Monitoring**
- **Structured logging** with timestamps and log levels
- **Real-time log streaming** in the web UI
- **Step-by-step execution tracking**
- **Error handling** with detailed error messages

### 📦 **Pluggable Runners & Custom Images**
- **Docker container execution** with custom images
- **Environment variable injection**
- **Working directory configuration**
- **Timeout management** for long-running tasks

### 🔄 **Git Integration**
- **Webhook support** for automatic pipeline triggering
- **Repository cloning** and management
- **Branch and tag filtering**
- **Event-based triggers** (push, pull request, etc.)

## 🚀 Quick Start

### Prerequisites

- **Docker** installed and running
- **Node.js** (v18 or higher)
- **pnpm** (recommended) or npm

### Installation

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd CicadaCI/cicada-api
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the development server:**
   ```bash
   pnpm run dev
   ```

4. **Access the application:**
   - **API**: http://localhost:3000
   - **Dashboard**: http://localhost:3000
   - **Default credentials**: 
     - Admin: `admin` / `admin123`
     - User: `user` / `user123`

## 📋 Pipeline Configuration

Create a `.cicadaci.yml` file in your repository root:

```yaml
version: "1.0"
name: "My Pipeline"
description: "A sample pipeline configuration"

triggers:
  branches: ["main", "develop"]
  events: ["push", "pull_request"]

environment:
  NODE_ENV: "production"

steps:
  - name: "install-dependencies"
    image: "node:18-alpine"
    commands:
      - "npm ci"
    workingDir: "/workspace"
    timeout: 300000

  - name: "run-tests"
    image: "node:18-alpine"
    commands:
      - "npm test"
    dependsOn: ["install-dependencies"]
    timeout: 300000

  - name: "build"
    image: "node:18-alpine"
    commands:
      - "npm run build"
    dependsOn: ["run-tests"]
    timeout: 300000
```

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/register` - User registration
- `GET /api/auth/me` - Get current user info

### Pipeline Management
- `GET /api/runs` - List all pipeline runs
- `GET /api/runs/:runId` - Get specific run details
- `POST /api/runs/:runId/cancel` - Cancel a running pipeline

### Webhooks
- `POST /webhook` - Trigger pipeline from Git webhook

### Health & Testing
- `GET /health` - Health check endpoint
- `GET /test-run` - Test Docker container execution

## 🎯 Usage Examples

### 1. Trigger Pipeline via Webhook
```bash
curl -X POST http://localhost:3000/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "repository": {
      "clone_url": "https://github.com/your/repo.git",
      "name": "your-repo"
    }
  }'
```

### 2. Login and Get Pipeline Runs
```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "admin123"}'

# Use the returned token
curl -X GET http://localhost:3000/api/runs \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### 3. Cancel a Running Pipeline
```bash
curl -X POST http://localhost:3000/api/runs/RUN_ID/cancel \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 🏗️ Architecture

### Core Components

1. **Pipeline Parser** (`src/services/pipelineParser.ts`)
   - YAML configuration parsing and validation
   - Dependency resolution and circular dependency detection

2. **Pipeline Executor** (`src/services/pipelineExecutor.ts`)
   - Step execution with dependency management
   - Parallel execution of independent steps
   - Real-time logging and status tracking

3. **Authentication Service** (`src/services/authService.ts`)
   - JWT token management
   - Role-based access control
   - User management

4. **Docker Runner** (`src/dockerRunner.ts`)
   - Container execution with custom options
   - Environment variable injection
   - Timeout management

5. **Web UI** (`src/public/index.html`)
   - Vue.js-based dashboard
   - Real-time updates via polling
   - Responsive design with Tailwind CSS

### Data Flow

1. **Webhook Trigger** → Repository Clone → Pipeline Config Detection
2. **Pipeline Execution** → Step Dependency Resolution → Container Execution
3. **Real-time Logging** → Web UI Updates → User Monitoring
4. **Authentication** → Role-based Access → API Endpoints

## 🔒 Security Features

- **JWT Authentication** with configurable expiration
- **Role-based Access Control** with granular permissions
- **Secure token storage** in browser localStorage
- **Input validation** and sanitization
- **Error handling** without sensitive data exposure

## 📈 Monitoring & Observability

- **Real-time pipeline status** updates
- **Step-by-step execution** tracking
- **Comprehensive logging** with structured data
- **Performance metrics** and execution times
- **Error tracking** with detailed stack traces

## 🚧 Development Status

✅ **Completed Features:**
- Pipeline configuration system
- Web UI dashboard
- Authentication & RBAC
- Advanced logging and monitoring
- Pluggable runners and custom images
- Git integration with webhooks
- Real-time pipeline monitoring
- Step dependency management
- Container execution with custom options

## 📄 License

This project is licensed under the ISC License.

---

**CicadaCI** - Making CI/CD simple, powerful, and self-hosted! 🚀
