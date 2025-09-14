import { useState } from 'react';
import { submitJob } from '../services/api';

const JobSubmissionForm = ({ onJobSubmitted }) => {
  const [formType, setFormType] = useState('git_repo'); // git_repo or raw_code
  const [formData, setFormData] = useState({
    git_link: '',
    raw_code: '',
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

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevData => ({
      ...prevData,
      [name]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Prepare submission data
      const submissionData = {
        submission_type: formType,
        runtime: formData.runtime,
        memory_limit: formData.memory_limit,
        timeout: parseInt(formData.timeout) * 1000, // Convert to milliseconds
      };

      // Add type-specific fields
      if (formType === 'git_repo') {
        submissionData.git_link = formData.git_link;
      } else {
        submissionData.raw_code = formData.raw_code;
        submissionData.dependencies = formData.dependencies
          .split(',')
          .map(dep => dep.trim())
          .filter(dep => dep);
      }

      // Add optional fields if provided
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

      // Submit the job
      const result = await submitJob(submissionData);
      
      setSuccess(`Job submitted successfully! Job ID: ${result.jobId}`);
      
      // Call the parent component's callback
      if (onJobSubmitted) {
        onJobSubmitted(result.jobId);
      }
    } catch (err) {
      setError(err.message || 'Failed to submit job');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-submission-form">
      <h2>Submit New Job</h2>
      
      <div className="form-type-selector">
        <button 
          className={formType === 'git_repo' ? 'active' : ''} 
          onClick={() => setFormType('git_repo')}
        >
          Git Repository
        </button>
        <button 
          className={formType === 'raw_code' ? 'active' : ''} 
          onClick={() => setFormType('raw_code')}
        >
          Raw Code
        </button>
      </div>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <form onSubmit={handleSubmit}>
        {/* Git Repository or Raw Code Input */}
        {formType === 'git_repo' ? (
          <div className="form-group">
            <label htmlFor="git_link">Git Repository URL</label>
            <input
              type="text"
              id="git_link"
              name="git_link"
              value={formData.git_link}
              onChange={handleChange}
              placeholder="https://github.com/username/repository"
              required
            />
          </div>
        ) : (
          <>
            <div className="form-group">
              <label htmlFor="raw_code">Code</label>
              <textarea
                id="raw_code"
                name="raw_code"
                value={formData.raw_code}
                onChange={handleChange}
                placeholder="Paste your code here..."
                rows="10"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="dependencies">Dependencies (comma-separated)</label>
              <input
                type="text"
                id="dependencies"
                name="dependencies"
                value={formData.dependencies}
                onChange={handleChange}
                placeholder="express, axios, dotenv"
              />
            </div>
          </>
        )}
        
        {/* Common Fields */}
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="runtime">Runtime</label>
            <select
              id="runtime"
              name="runtime"
              value={formData.runtime}
              onChange={handleChange}
              required
            >
              <option value="nodejs">Node.js</option>
              <option value="python">Python</option>
              <option value="java">Java</option>
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="memory_limit">Memory Limit</label>
            <select
              id="memory_limit"
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
            </select>
          </div>
          
          <div className="form-group">
            <label htmlFor="timeout">Timeout (seconds)</label>
            <input
              type="number"
              id="timeout"
              name="timeout"
              value={formData.timeout}
              onChange={handleChange}
              min="1"
              max="180"
              required
            />
          </div>
        </div>
        
        {/* Advanced Options (collapsible) */}
        <details>
          <summary>Advanced Options</summary>
          
          <div className="form-group">
            <label htmlFor="start_directory">Start Directory (optional)</label>
            <input
              type="text"
              id="start_directory"
              name="start_directory"
              value={formData.start_directory}
              onChange={handleChange}
              placeholder="src"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="build_cmd">Build Command (optional)</label>
            <input
              type="text"
              id="build_cmd"
              name="build_cmd"
              value={formData.build_cmd}
              onChange={handleChange}
              placeholder="npm start"
            />
          </div>
          
          <div className="form-group">
            <label htmlFor="env_vars">Environment Variables (JSON format, optional)</label>
            <textarea
              id="env_vars"
              name="env_vars"
              value={formData.env_vars}
              onChange={handleChange}
              placeholder='{"NODE_ENV": "development", "PORT": "3000"}'
              rows="3"
            />
          </div>
        </details>
        
        <div className="form-actions">
          <button 
            type="submit" 
            className="submit-button" 
            disabled={loading}
          >
            {loading ? 'Submitting...' : 'Submit Job'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobSubmissionForm;
