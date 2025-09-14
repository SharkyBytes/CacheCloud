import { useState } from 'react';
import { submitJob } from '../services/api';

// Modern SVG Icons
const GitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
  </svg>
);

const CodeIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const DockerIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
  </svg>
);

const CheckIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
  </svg>
);

const SpinnerIcon = () => (
  <svg className="animate-spin w-5 h-5" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

// Modern Form Input Component
const FormInput = ({ label, error, helpText, required, className = "", ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input
      className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm ${
        error
          ? 'ring-rose-300 focus:ring-rose-500 bg-rose-50'
          : 'ring-slate-300 focus:ring-indigo-600 bg-white hover:ring-slate-400'
      } ${className}`}
      {...props}
    />
    {error && (
      <p className="text-sm text-rose-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
    {helpText && !error && <p className="text-xs text-slate-500">{helpText}</p>}
  </div>
);

const FormSelect = ({ label, error, required, children, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <select
      className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm ring-1 ring-inset transition-all duration-200 focus:ring-2 focus:ring-inset sm:text-sm ${
        error
          ? 'ring-rose-300 focus:ring-rose-500 bg-rose-50'
          : 'ring-slate-300 focus:ring-indigo-600 bg-white hover:ring-slate-400'
      }`}
      {...props}
    >
      {children}
    </select>
    {error && (
      <p className="text-sm text-rose-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const FormTextarea = ({ label, error, required, ...props }) => (
  <div className="space-y-2">
    <label className="block text-sm font-semibold text-slate-700">
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <textarea
      className={`w-full px-4 py-3 rounded-xl border-0 shadow-sm ring-1 ring-inset transition-all duration-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset sm:text-sm font-mono ${
        error
          ? 'ring-rose-300 focus:ring-rose-500 bg-rose-50'
          : 'ring-slate-300 focus:ring-indigo-600 bg-slate-50 hover:ring-slate-400'
      }`}
      {...props}
    />
    {error && (
      <p className="text-sm text-rose-600 flex items-center">
        <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
        {error}
      </p>
    )}
  </div>
);

const JobSubmissionForm = ({ onJobSubmitted }) => {
  const [formType, setFormType] = useState('git_repo');
  const [formData, setFormData] = useState({
    git_link: '',
    raw_code: '',
    docker_image: '',
    runtime: 'nodejs',
    memory_limit: '512MB',
    timeout: 180,
    dependencies: '',
    start_directory: '',
    build_cmd: '',
    env_vars: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const submissionData = {
        submission_type: formType,
        memory_limit: formData.memory_limit,
        timeout: parseInt(formData.timeout) * 1000,
      };

      if (formType === 'git_repo') {
        submissionData.git_link = formData.git_link;
        submissionData.runtime = formData.runtime;
      } else if (formType === 'raw_code') {
        submissionData.raw_code = formData.raw_code;
        submissionData.runtime = formData.runtime;
        submissionData.dependencies = formData.dependencies
          .split(',')
          .map(dep => dep.trim())
          .filter(dep => dep);
      } else if (formType === 'docker_image') {
        submissionData.docker_image = formData.docker_image;
      }

      if (formData.start_directory) {
        submissionData.start_directory = formData.start_directory;
      }

      if (formData.build_cmd) {
        submissionData.build_cmd = formData.build_cmd;
      }

      if (formData.env_vars) {
        try {
          submissionData.env = JSON.parse(formData.env_vars);
        } catch (err) {
          throw new Error('Invalid environment variables format. Please use valid JSON.');
        }
      }

      const result = await submitJob(submissionData);
      setSuccess(`Job submitted successfully! Job ID: ${result.jobId}`);
      
      if (onJobSubmitted) {
        onJobSubmitted(result.jobId);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit job');
    } finally {
      setLoading(false);
    }
  };

  const formTypes = [
    { id: 'git_repo', label: 'Git Repository', icon: <GitIcon /> },
    { id: 'raw_code', label: 'Raw Code', icon: <CodeIcon /> },
    { id: 'docker_image', label: 'Docker Image', icon: <DockerIcon /> },
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden">
      <div className="p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mb-4 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Submit New Job</h2>
          <p className="text-slate-600">Choose your submission method and configure your job</p>
        </div>
        
        {/* Form Type Selector */}
        <div className="mb-8">
          <div className="flex w-full bg-slate-100/50 p-2 rounded-xl backdrop-blur-sm border border-slate-200/50">
            {formTypes.map(type => (
              <button
                key={type.id}
                type="button"
                onClick={() => setFormType(type.id)}
                className={`flex-1 flex items-center justify-center text-sm font-semibold py-3 px-4 rounded-lg transition-all duration-300 transform ${
                  formType === type.id
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105 shadow-indigo-500/25'
                    : 'text-slate-600 hover:bg-white/60 hover:text-slate-800 hover:scale-102'
                }`}
              >
                <div className="mr-2">{type.icon}</div>
                {type.label}
              </button>
            ))}
          </div>
        </div>
        
        {/* Status Messages */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="text-red-800 font-medium">{error}</span>
            </div>
          </div>
        )}
        
        {success && (
          <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
            <div className="flex items-center">
              <CheckIcon />
              <span className="text-emerald-800 font-medium ml-2">{success}</span>
            </div>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Main Form Fields */}
          <div className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-xl p-6 border border-slate-200/50 backdrop-blur-sm">
            {formType === 'git_repo' && (
              <FormInput
                label="Git Repository URL"
                name="git_link"
                value={formData.git_link}
                onChange={handleChange}
                placeholder="https://github.com/username/repository"
                required
              />
            )}
            
            {formType === 'raw_code' && (
              <div className="space-y-6">
                <FormTextarea
                  label="Code"
                  name="raw_code"
                  value={formData.raw_code}
                  onChange={handleChange}
                  placeholder="Paste your code here..."
                  rows="12"
                  required
                />
                <FormInput
                  label="Dependencies"
                  name="dependencies"
                  value={formData.dependencies}
                  onChange={handleChange}
                  placeholder="express, axios, dotenv"
                  helpText="Comma-separated list of dependencies"
                />
              </div>
            )}
            
            {formType === 'docker_image' && (
              <div className="space-y-6">
                <FormInput
                  label="Docker Image"
                  name="docker_image"
                  value={formData.docker_image}
                  onChange={handleChange}
                  placeholder="tensorflow/tensorflow:latest-gpu"
                  helpText="Docker image to use for execution"
                  required
                />
              </div>
            )}
          </div>
          
          {/* Configuration Fields */}
          <div className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-xl p-6 border border-slate-200/50 backdrop-blur-sm">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {formType !== 'docker_image' && (
                <FormSelect
                  label="Runtime"
                  name="runtime"
                  value={formData.runtime}
                  onChange={handleChange}
                  required
                >
                  <optgroup label="JavaScript/Node.js">
                    <option value="nodejs">Node.js 18 (default)</option>
                    <option value="nodejs-16">Node.js 16 LTS</option>
                    <option value="nodejs-14">Node.js 14 LTS</option>
                    <option value="typescript">TypeScript</option>
                    <option value="deno">Deno</option>
                  </optgroup>
                  
                  <optgroup label="Python">
                    <option value="python">Python 3.10</option>
                    <option value="python-3.9">Python 3.9</option>
                    <option value="python-3.8">Python 3.8</option>
                    <option value="python-django">Python + Django</option>
                    <option value="python-flask">Python + Flask</option>
                  </optgroup>
                  
                  <optgroup label="Java">
                    <option value="java">Java 17</option>
                    <option value="java-11">Java 11</option>
                    <option value="java-spring">Java + Spring</option>
                  </optgroup>
                  
                  <optgroup label="Other Languages">
                    <option value="cpp">C++</option>
                    <option value="c">C</option>
                    <option value="go">Go</option>
                    <option value="rust">Rust</option>
                    <option value="ruby">Ruby</option>
                    <option value="php">PHP</option>
                    <option value="dotnet">.NET (C#)</option>
                  </optgroup>
                </FormSelect>
              )}
              
              <FormSelect
                label="Memory Limit"
                name="memory_limit"
                value={formData.memory_limit}
                onChange={handleChange}
                required
              >
                <option value="128MB">128 MB</option>
                <option value="256MB">256 MB</option>
                <option value="512MB">512 MB</option>
                <option value="1GB">1 GB</option>
                <option value="2GB">2 GB</option>
                <option value="4GB">4 GB</option>
                <option value="8GB">8 GB</option>
              </FormSelect>
              
              <FormInput
                label="Timeout (seconds)"
                name="timeout"
                type="number"
                value={formData.timeout}
                onChange={handleChange}
                min="1"
                max="300"
                required
              />
            </div>
          </div>
          
          {/* Advanced Options */}
          <div className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-xl border border-slate-200/50 backdrop-blur-sm">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full p-6 text-left flex items-center justify-between hover:bg-white/30 transition-colors duration-200 rounded-xl"
            >
              <h3 className="text-lg font-semibold text-slate-800">Advanced Options</h3>
              <svg
                className={`w-5 h-5 text-slate-600 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            
            {showAdvanced && (
              <div className="px-6 pb-6 space-y-6 border-t border-slate-200/50">
                <div className="pt-6 space-y-6">
                  <FormInput
                    label="Start Directory"
                    name="start_directory"
                    value={formData.start_directory}
                    onChange={handleChange}
                    placeholder="src"
                    helpText="Optional: Directory to start execution from"
                  />
                  
                  <FormInput
                    label="Build Command"
                    name="build_cmd"
                    value={formData.build_cmd}
                    onChange={handleChange}
                    placeholder="npm start"
                    helpText="Optional: Command to run your application"
                  />
                  
                  <FormTextarea
                    label="Environment Variables"
                    name="env_vars"
                    value={formData.env_vars}
                    onChange={handleChange}
                    placeholder='{"NODE_ENV": "development", "PORT": "3000"}'
                    rows="4"
                    helpText="Optional: JSON format environment variables"
                  />
                </div>
              </div>
            )}
          </div>
          
          {/* Submit Button */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={loading}
              className={`w-full flex justify-center items-center px-8 py-4 border-0 text-lg font-semibold rounded-xl shadow-lg text-white transition-all duration-300 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-indigo-500/50 transform ${
                loading
                  ? 'bg-slate-400 cursor-not-allowed'
                  : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:scale-105'
              }`}
            >
              {loading ? (
                <>
                  <SpinnerIcon />
                  <span className="ml-2">Submitting Job...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Submit Job
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JobSubmissionForm;
