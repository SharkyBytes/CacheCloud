import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchJobDetails } from '../services/api';

const JobMonitor = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Initialize socket connection
  useEffect(() => {
    if (!jobId) return;
    
    const socketInstance = io('http://localhost:5000');
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
      socketInstance.emit('subscribe', jobId);
    });

    socketInstance.on('log', (logData) => {
      if (logData.jobId === jobId) {
        setLogs(prevLogs => [...prevLogs, logData]);
      }
    });

    socketInstance.on('status', (statusData) => {
      if (statusData.jobId === jobId) {
        setJob(prevJob => ({
          ...prevJob,
          status: statusData.status,
          exitCode: statusData.exitCode,
          duration: statusData.duration
        }));
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socketInstance.emit('unsubscribe', jobId);
      socketInstance.disconnect();
    };
  }, [jobId]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const logContainer = document.getElementById('log-container');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  // Fetch job details
  useEffect(() => {
    if (!jobId) return;

    const loadJobDetails = async () => {
      try {
        setLoading(true);
        const data = await fetchJobDetails(jobId);
        setJob(data.job);
        setLogs(data.logs || []);
        setError(null);
      } catch (err) {
        console.error(`Error fetching job ${jobId} details:`, err);
        setError(`Failed to load job details: ${err.message}`);
      } finally {
        setLoading(false);
      }
    };

    loadJobDetails();
  }, [jobId]);

  if (!jobId) {
    return <div className="no-job-selected">No job selected</div>;
  }

  if (loading) {
    return <div className="loading">Loading job details...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!job) {
    return <div className="job-not-found">Job not found</div>;
  }

  const formatDuration = (ms) => {
    if (!ms) return 'N/A';
    
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="job-monitor">
      <h2>Job Monitor: {jobId}</h2>
      
      <div className="job-details">
        <div className="job-header">
          <h3>Job Details</h3>
          <span className={`job-status status-${job.status}`}>
            {job.status}
          </span>
        </div>
        
        <div className="job-info-grid">
          <div className="job-info-item">
            <span className="label">Type:</span>
            <span className="value">{job.submission_type}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Runtime:</span>
            <span className="value">{job.runtime}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Memory Limit:</span>
            <span className="value">{job.memory_limit}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Submitted:</span>
            <span className="value">{formatDate(job.submitted_at)}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Started:</span>
            <span className="value">{formatDate(job.start_time)}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Completed:</span>
            <span className="value">{formatDate(job.end_time)}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Duration:</span>
            <span className="value">{formatDuration(job.duration)}</span>
          </div>
          
          <div className="job-info-item">
            <span className="label">Exit Code:</span>
            <span className="value">{job.exitCode !== undefined ? job.exitCode : 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div className="job-logs">
        <div className="logs-header">
          <h3>Logs</h3>
          <div className="logs-controls">
            <label>
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={() => setAutoScroll(!autoScroll)}
              />
              Auto-scroll
            </label>
            <button 
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
            >
              Clear
            </button>
          </div>
        </div>
        
        <div id="log-container" className="log-container">
          {logs.length === 0 ? (
            <p className="no-logs">No logs available</p>
          ) : (
            logs.map((log, index) => (
              <div 
                key={index} 
                className={`log-line ${log.type === 'stderr' ? 'error-log' : ''}`}
              >
                {log.data}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default JobMonitor;
