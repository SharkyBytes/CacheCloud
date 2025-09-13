import os from 'os';

// Docker configuration
export const DOCKER_CONFIG = {
  // Runtime configurations for different languages
  runtimes: {
    nodejs: {
      image: 'node:18',
      fileExtension: 'js',
      fileName: 'code.js',
      defaultBuildCmd: 'node code.js',
      dependencyInstallCmd: (deps) => `npm install ${deps.join(' ')}`
    },
    python: {
      image: 'python:3.10',
      fileExtension: 'py',
      fileName: 'code.py',
      defaultBuildCmd: 'python code.py',
      dependencyInstallCmd: (deps) => `pip install ${deps.join(' ')}`
    },
    java: {
      image: 'openjdk:17',
      fileExtension: 'java',
      fileName: 'Main.java',
      defaultBuildCmd: 'javac Main.java && java Main',
      dependencyInstallCmd: () => ''
    },
    cpp: {
      image: 'gcc:latest',
      fileExtension: 'cpp',
      fileName: 'code.cpp',
      defaultBuildCmd: 'g++ -o program code.cpp && ./program',
      dependencyInstallCmd: () => ''
    }
  },
  
  // Default container settings
  defaults: {
    memoryLimit: '512MB',
    timeout: 180000
  }
};

// Get runtime configuration
export function getRuntimeConfig(runtime) {
  return DOCKER_CONFIG.runtimes[runtime.toLowerCase()] || DOCKER_CONFIG.runtimes.nodejs;
}

// Platform detection
export const isWindows = os.platform() === 'win32';
