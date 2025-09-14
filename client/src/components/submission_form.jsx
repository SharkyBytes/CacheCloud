import { useState } from 'react';
import { API_BASE_URL } from '../../services/api';

const SubmissionForm = (props) => {
  const [formData, setFormData] = useState({
    git_link: '',
    start_directory: '',
    initial_cmds: ['npm install'],
    env_file: '.env',
    build_cmd: 'node index.js',
    memory_limit: '512MB',
    timeout: 300000,
    runtime: 'nodejs',
    env: {}
  });
  
  const [envVars, setEnvVars] = useState([{ key: '', value: '' }]);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const [error, setError] = useState(null);
  
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleArrayInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value.split(',').map(item => item.trim())
    });
  };
  
  const handleEnvChange = (index, field, value) => {
    const newEnvVars = [...envVars];
    newEnvVars[index][field] = value;
    setEnvVars(newEnvVars);
    
    // Update formData.env
    const env = {};
    newEnvVars.forEach(item => {
      if (item.key && item.key.trim() !== '') {
        env[item.key] = item.value;
      }
    });
    setFormData({
      ...formData,
      env
    });
  };
  
  const addEnvVar = () => {
    setEnvVars([...envVars, { key: '', value: '' }]);
  };
  
  const removeEnvVar = (index) => {
    const newEnvVars = [...envVars];
    newEnvVars.splice(index, 1);
    setEnvVars(newEnvVars);
    
    // Update formData.env
    const env = {};
    newEnvVars.forEach(item => {
      if (item.key && item.key.trim() !== '') {
        env[item.key] = item.value;
      }
    });
    setFormData({
      ...formData,
      env
    });
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      // Use fetch instead of axios since we haven't installed axios yet
      const response = await fetch(`${API_BASE_URL}/api/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit job');
      }
      
      setResponse(data);
    } catch (err) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="submission-form">
      <h2>Submit Repository</h2>
      
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label>GitHub Repository URL *</label>
          <input
            type="text"
            name="git_link"
            value={formData.git_link}
            onChange={handleInputChange}
            required
            placeholder="https://github.com/username/repository"
          />
        </div>
        
        <div className="form-group">
          <label>Start Directory</label>
          <input
            type="text"
            name="start_directory"
            value={formData.start_directory}
            onChange={handleInputChange}
            placeholder="Leave empty for root directory"
          />
        </div>
        
        <div className="form-group">
          <label>Initial Commands (comma-separated)</label>
          <input
            type="text"
            name="initial_cmds"
            value={formData.initial_cmds.join(', ')}
            onChange={handleArrayInputChange}
            placeholder="npm install, npm run build"
          />
        </div>
        
        <div className="form-group">
          <label>Environment File</label>
          <input
            type="text"
            name="env_file"
            value={formData.env_file}
            onChange={handleInputChange}
            placeholder=".env"
          />
        </div>
        
        <div className="form-group">
          <label>Build Command</label>
          <input
            type="text"
            name="build_cmd"
            value={formData.build_cmd}
            onChange={handleInputChange}
            placeholder="node index.js"
          />
        </div>
        
        <div className="form-group">
          <label>Memory Limit</label>
          <input
            type="text"
            name="memory_limit"
            value={formData.memory_limit}
            onChange={handleInputChange}
            placeholder="512MB"
          />
        </div>
        
        <div className="form-group">
          <label>Timeout (ms)</label>
          <input
            type="number"
            name="timeout"
            value={formData.timeout}
            onChange={handleInputChange}
            placeholder="300000"
          />
        </div>
        
        <div className="form-group">
          <label>Runtime</label>
          <select
            name="runtime"
            value={formData.runtime}
            onChange={handleInputChange}
          >
            <option value="nodejs">Node.js</option>
            <option value="python">Python</option>
            <option value="java">Java</option>
          </select>
        </div>
        
        <div className="form-group">
          <label>Environment Variables</label>
          {envVars.map((env, index) => (
            <div key={index} className="env-var-row">
              <input
                type="text"
                placeholder="Key"
                value={env.key}
                onChange={(e) => handleEnvChange(index, 'key', e.target.value)}
              />
              <input
                type="text"
                placeholder="Value"
                value={env.value}
                onChange={(e) => handleEnvChange(index, 'value', e.target.value)}
              />
              <button
                type="button"
                onClick={() => removeEnvVar(index)}
                className="remove-btn"
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addEnvVar}
            className="add-btn"
          >
            Add Environment Variable
          </button>
        </div>
        
        <button
          type="submit"
          disabled={loading}
          className="submit-btn"
        >
          {loading ? 'Submitting...' : 'Submit Repository'}
        </button>
      </form>
      
      {error && (
        <div className="error-message">
          <p>Error: {error}</p>
        </div>
      )}
      
      {response && (
        <div className="success-message">
          <h3>Job Submitted Successfully!</h3>
          <p>Job ID: {response.jobId}</p>
          <p>Status: {response.status}</p>
          <button
            onClick={() => props.onJobSubmitted && props.onJobSubmitted(response.jobId)}
            className="view-btn"
          >
            View Job Status
          </button>
        </div>
      )}
    </div>
  );
};

export default SubmissionForm;
