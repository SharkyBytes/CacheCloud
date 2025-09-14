import { useState, useEffect, useRef } from 'react';
import { API_BASE_URL } from '../../services/api';

const JobStatus = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const logsEndRef = useRef(null);
  const socketRef = useRef(null);
  
  // Fetch job status
  useEffect(() => {
    const fetchJobStatus = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/jobs/${jobId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch job status');
        }
        
        setJob(data);
        setError(null);
      } catch (err) {
        setError(err.message || 'An error occurred');
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobStatus();
    
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobStatus, 5000);
    
    return () => clearInterval(interval);
  }, [jobId]);
  
  // Connect to WebSocket for real-time logs
  useEffect(() => {
    // Since socket.io-client might not be installed yet, we'll use a mock implementation
    // In a real implementation, you would use:
    // import io from 'socket.io-client';
    // socketRef.current = io(API_BASE_URL);
    
    console.log('Would connect to WebSocket here for job:', jobId);
    
    // Mock socket events for demonstration
    const mockSocket = {
      on: (event, callback) => {
        console.log(`Mock socket registered ${event} event`);
        if (event === 'log') {
          // Simulate receiving logs every few seconds
          const interval = setInterval(() => {
            const mockLog = {
              jobId,
              type: Math.random() > 0.8 ? 'stderr' : 'stdout',
              data: `Mock log at ${new Date().toISOString()}`
            };
            callback(mockLog);
          }, 3000);
          
          return () => clearInterval(interval);
        }
      },
      emit: (event, data) => {
        console.log(`Mock socket emitted ${event} with data:`, data);
      },
      disconnect: () => {
        console.log('Mock socket disconnected');
      }
    };
    
    socketRef.current = mockSocket;
    
    // Subscribe to job logs
    socketRef.current.emit('subscribe', jobId);
    
    // Handle incoming logs
    const handleLog = (logData) => {
      if (logData.jobId === jobId) {
        setLogs(prevLogs => [...prevLogs, logData]);
      }
    };
    
    socketRef.current.on('log', handleLog);
    
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('unsubscribe', jobId);
        socketRef.current.disconnect();
      }
    };
  }, [jobId]);
  
  // Auto-scroll logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);
  
  if (loading) {
    return <div className="loading">Loading job status...</div>;
  }
  
  if (error) {
    return (
      <div className="error-container">
        <h2>Error</h2>
        <p>{error}</p>
      </div>
    );
  }
  
  if (!job) {
    return (
      <div className="not-found">
        <h2>Job Not Found</h2>
        <p>The job with ID {jobId} was not found.</p>
      </div>
    );
  }
  
  return (
    <div className="job-status">
      <h2>Job Status</h2>
      
      <div className="job-details">
        <div className="detail-row">
          <span className="label">Job ID:</span>
          <span className="value">{job.jobId}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Status:</span>
          <span className={`value status-${job.status}`}>{job.status}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Repository:</span>
          <span className="value">{job.data.git_link}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Runtime:</span>
          <span className="value">{job.data.runtime}</span>
        </div>
        
        <div className="detail-row">
          <span className="label">Submitted:</span>
          <span className="value">{new Date(job.createdAt).toLocaleString()}</span>
        </div>
        
        {job.processedAt && (
          <div className="detail-row">
            <span className="label">Started:</span>
            <span className="value">{new Date(job.processedAt).toLocaleString()}</span>
          </div>
        )}
        
        {job.finishedAt && (
          <div className="detail-row">
            <span className="label">Finished:</span>
            <span className="value">{new Date(job.finishedAt).toLocaleString()}</span>
          </div>
        )}
      </div>
      
      <div className="logs-container">
        <h3>Execution Logs</h3>
        
        <div className="logs">
          {logs.length === 0 ? (
            <p className="no-logs">No logs available yet...</p>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`log-line ${log.type === 'stderr' ? 'error' : ''}`}
              >
                {log.data}
              </div>
            ))
          )}
          <div ref={logsEndRef} />
        </div>
      </div>
      
      {job.result && (
        <div className="result-container">
          <h3>Result</h3>
          <pre>{JSON.stringify(job.result, null, 2)}</pre>
        </div>
      )}
      
      <div className="actions">
        <button
          onClick={() => window.location.href = '/'}
          className="back-btn"
        >
          Back to Submission Form
        </button>
      </div>
    </div>
  );
};

export default JobStatus;
