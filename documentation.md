# E6Data - Technical Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Component Details](#component-details)
   - [Frontend](#frontend)
   - [Backend](#backend)
   - [Infrastructure](#infrastructure)
4. [Data Flow](#data-flow)
5. [Technical Implementation](#technical-implementation)
   - [Resource Management](#resource-management)
   - [Docker Integration](#docker-integration)
   - [Multi-Language Support](#multi-language-support)
   - [Real-Time Monitoring](#real-time-monitoring)
6. [GCP Integration](#gcp-integration)
7. [Current Status](#current-status)
8. [Future Improvements](#future-improvements)
9. [Setup and Installation](#setup-and-installation)
10. [API Reference](#api-reference)

## Introduction

E6Data is a cloud-based code execution platform developed during a 2-day hackathon. The platform allows users to run code from GitHub repositories, raw code snippets, or custom Docker images in isolated containers with real-time output streaming.

The primary goal of E6Data is to provide developers with a reliable way to test, run, and deploy code in consistent environments without worrying about dependency conflicts or configuration issues. By leveraging containerization technology, E6Data ensures that code runs exactly the same way every time, regardless of the underlying system.

## System Architecture

E6Data follows a modern microservices architecture with three main components:

![E6Data Architecture](https://via.placeholder.com/800x400?text=E6Data+Architecture)

### Component Details

#### Frontend

The frontend is built using React.js and provides a clean, intuitive user interface for interacting with the platform. Key features include:

- **Job Submission Forms**: Submit code via:
  - GitHub repository URL
  - Raw code input
  - Custom Docker image
- **Language Selection**: Choose from multiple supported programming languages
- **Environment Configuration**: Set environment variables, memory limits, and build commands
- **Real-Time Console**: View execution output as it happens
- **Job History**: Browse past executions and their results
- **Admin Dashboard**: Monitor system resources and active jobs

The frontend communicates with the backend via RESTful API calls for job submission and WebSockets for real-time updates.

#### Backend

The backend is powered by Node.js with Express and handles all the core functionality of the platform. Key components include:

- **API Server**: RESTful endpoints for job submission, status checks, and result retrieval
- **Queue System**: BullMQ with Redis for job processing and prioritization
- **Resource Manager**: Monitors and allocates system resources
- **Docker Controller**: Creates and manages Docker containers
- **WebSocket Server**: Streams real-time output to clients
- **Database Interface**: Handles data persistence with PostgreSQL

The backend is designed to be scalable, with the ability to distribute workloads across multiple instances.

#### Infrastructure

The infrastructure layer provides the foundation for E6Data's operations:

- **Redis**: Used for:
  - Job queues via BullMQ
  - Pub/Sub channels for real-time updates
  - Temporary data storage
- **PostgreSQL**: Persistent storage for:
  - User accounts
  - Job history
  - Execution results
  - System metrics
- **Docker**: Container runtime for isolated code execution
- **Google Cloud Platform**: Intended for dynamic scaling (in development)

## Data Flow

When a user interacts with E6Data, the following data flow occurs:

1. **Job Submission**:
   - User submits job details through the frontend
   - Frontend sends data to the `/api/submit` endpoint
   - Backend validates input and generates a unique job ID
   - Job is added to the Redis queue with status "waiting"
   - User receives immediate confirmation with job ID

2. **Job Processing**:
   - Worker picks up job from the queue
   - Resource manager checks if system has capacity
   - If resources are available, job status changes to "active"
   - If resources are limited, job remains in queue with status "delayed"

3. **Container Execution**:
   - System creates a temporary workspace directory
   - For GitHub repos: Clone repository into workspace
   - For raw code: Create appropriate files in workspace
   - For custom Docker images: Prepare configuration
   - Docker container is launched with appropriate parameters
   - Container executes initial commands and build command

4. **Real-Time Updates**:
   - Container output is captured in real-time
   - Output is sent to Redis pub/sub channels
   - WebSocket server pushes updates to connected clients
   - Frontend displays output as it arrives

5. **Job Completion**:
   - Container exits with status code
   - System updates job status to "completed" or "failed"
   - Final results are stored in PostgreSQL
   - Resources are released (container removed, workspace cleaned)
   - User is notified of completion

## Technical Implementation

### Resource Management

E6Data includes a sophisticated resource management system to ensure stability:

- **Memory Monitoring**: Tracks total and available system memory
- **Container Limits**: Sets memory limits for each container
- **Concurrency Control**: Limits the number of simultaneously running containers
- **Auto-Queuing**: Automatically queues jobs when resources are constrained
- **Timeout Handling**: Gracefully terminates long-running jobs

The resource manager calculates the maximum number of containers based on available memory:

```
maxContainers = (totalMemoryMB * memoryUsageThreshold) / containerMemoryEstimate
```

Where:
- `totalMemoryMB` is the total server memory
- `memoryUsageThreshold` is typically 0.8 (80%)
- `containerMemoryEstimate` is the estimated memory per container (default: 512MB)

### Docker Integration

Docker is the core technology enabling E6Data's isolated execution environments:

- **Container Creation**: Each job runs in its own Docker container
- **Volume Mounting**: Job workspace is mounted into the container
- **Network Configuration**: Containers can be isolated or connected to host network
- **Resource Limits**: Memory and CPU limits are enforced
- **Cleanup**: Containers are automatically removed after execution

The Docker commands are dynamically generated based on job parameters, including:
- Runtime/image selection
- Memory limits
- Environment variables
- Working directory
- Command sequence

### Multi-Language Support

E6Data supports multiple programming languages through a flexible runtime configuration system:

| Language | Docker Image | File Extension | Default Build Command |
|----------|--------------|----------------|----------------------|
| Node.js | node:18 | .js | node code.js |
| Python | python:3.10 | .py | python code.py |
| Java | openjdk:17 | .java | javac Main.java && java Main |
| C++ | gcc:latest | .cpp | g++ -o program code.cpp && ./program |
| Go | golang:latest | .go | go run main.go |
| Rust | rust:latest | .rs | rustc main.rs && ./main |
| Ruby | ruby:latest | .rb | ruby code.rb |
| PHP | php:8-apache | .php | php -S 0.0.0.0:8000 |
| .NET | mcr.microsoft.com/dotnet/sdk:7.0 | .cs | dotnet run |

Users can also provide custom Docker images for specialized environments.

### Real-Time Monitoring

The real-time monitoring system provides immediate feedback during execution:

- **Output Streaming**: Container stdout/stderr is captured and streamed
- **WebSocket Connection**: Clients connect to dedicated channels based on job ID
- **Status Updates**: Job status changes are broadcast to connected clients
- **Resource Metrics**: System resource usage is periodically published

## GCP Integration

We attempted to integrate E6Data with Google Cloud Platform for dynamic scaling:

### Design Goals

- **Auto-Scaling**: Automatically provision new VM instances based on load
- **Resource Optimization**: Scale down when demand decreases
- **Cost Efficiency**: Only pay for resources when needed
- **High Availability**: Distribute workloads across multiple zones

### Implementation Progress

1. **GCP Instance Setup**: Created e2-medium instance (2 vCPUs, 8GB RAM)
2. **Application Deployment**: Deployed E6Data backend to GCP instance
3. **Docker Configuration**: Installed Docker on the VM

### Challenges Encountered

When submitting jobs to the GCP instance, we encountered issues with Docker execution. The logs showed Docker usage information instead of actual execution output, indicating problems with:

1. Docker daemon configuration
2. User permissions for Docker access
3. Docker socket accessibility

These issues would require additional configuration and testing to resolve, which was beyond the scope of the 2-day hackathon.

## Current Status

E6Data is currently running in a development environment with all core features implemented:

- Job submission via multiple methods
- Multi-language support
- Real-time output streaming
- Resource management
- Job history and results

The system is fully functional for local execution but requires additional work for cloud deployment and scaling.

## Future Improvements

Several enhancements are planned for future development:

1. **Complete GCP Integration**: Finish implementing the auto-scaling system
2. **Enhanced Security**: Add container sandboxing and network isolation
3. **Persistent Workspaces**: Allow users to save and return to execution environments
4. **Collaboration Features**: Enable real-time collaboration between multiple users
5. **CI/CD Integration**: Develop plugins for popular CI/CD platforms
6. **Custom Templates**: Let users create and share environment templates
7. **User Authentication**: Add robust user management and access control
8. **API Expansion**: Develop a comprehensive API for third-party integration
9. **Performance Optimization**: Improve resource utilization and job throughput
10. **Advanced Monitoring**: Add detailed metrics and logging

## Setup and Installation

### Prerequisites

- Node.js 16+
- Docker Engine
- Redis 6+
- PostgreSQL 13+

### Backend Setup

1. Clone the repository:
   ```
   git clone https://github.com/your-username/e6data.git
   cd e6data/server
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the backend:
   ```
   npm start
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd ../client
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Configure environment variables:
   ```
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. Start the frontend:
   ```
   npm start
   ```

### Docker Setup

Ensure Docker is properly configured:

1. Verify Docker is running:
   ```
   docker info
   ```

2. Set appropriate permissions:
   ```
   sudo usermod -aG docker $USER
   # Log out and log back in
   ```

3. Test Docker execution:
   ```
   docker run hello-world
   ```

## API Reference

### Job Submission

**Endpoint**: `/api/submit`

**Method**: POST

**Body**:
```json
{
  "submission_type": "git_repo|raw_code|custom_image",
  "git_link": "https://github.com/username/repo.git",
  "raw_code": "console.log('Hello, world!');",
  "docker_image": "custom-image:latest",
  "runtime": "nodejs",
  "memory_limit": "512MB",
  "timeout": 180000,
  "build_cmd": "node index.js",
  "initial_cmds": ["npm install"],
  "start_directory": "",
  "env": {
    "NODE_ENV": "production"
  }
}
```

**Response**:
```json
{
  "success": true,
  "jobId": "job_12345678",
  "message": "Job submitted successfully",
  "status": "queued"
}
```

### Job Status

**Endpoint**: `/api/jobs/:jobId`

**Method**: GET

**Response**:
```json
{
  "jobId": "job_12345678",
  "status": "completed|failed|active|waiting",
  "submitted_at": "2023-09-15T12:34:56.789Z",
  "completed_at": "2023-09-15T12:35:30.123Z",
  "result": {
    "exitCode": 0,
    "output": "Job output..."
  }
}
```

### Job Logs

**Endpoint**: `/api/jobs/:jobId/logs`

**Method**: GET

**Response**:
```json
{
  "jobId": "job_12345678",
  "logs": [
    {
      "type": "stdout",
      "content": "Starting application...",
      "timestamp": "2023-09-15T12:34:58.123Z"
    },
    {
      "type": "stderr",
      "content": "Warning: deprecated feature used",
      "timestamp": "2023-09-15T12:35:01.456Z"
    }
  ]
}
```

### WebSocket Connection

Connect to `/socket.io` and join room `job-{jobId}` to receive real-time updates.

Events:
- `log`: Container output
- `status`: Job status changes
- `result`: Final job result
