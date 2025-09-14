import { useState, useEffect } from 'react';
import { fetchActiveJobs } from '../../services/api';

const ActiveJobs = ({ activeJobs, socket }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [jobLogs, setJobLogs] = useState({});

  // Fetch active jobs
  useEffect(() => {
    const loadActiveJobs = async () => {
      try {
        setLoading(true);
        const data = await fetchActiveJobs();
        setJobs(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching active jobs:', err);
        setError('Failed to load active jobs');
      } finally {
        setLoading(false);
      }
    };

    loadActiveJobs();

    // Refresh active jobs every 10 seconds
    const interval = setInterval(loadActiveJobs, 10000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to job logs via WebSocket
  useEffect(() => {
    if (!socket) return;

    // Subscribe to all active jobs
    jobs.forEach(job => {
      socket.emit('subscribe', job.jobId);
    });

    // Listen for log updates
    socket.on('log', (logData) => {
      setJobLogs(prev => ({
        ...prev,
        [logData.jobId]: [
          ...(prev[logData.jobId] || []).slice(-50), // Keep only last 50 logs
          logData
        ]
      }));
    });

    return () => {
      // Unsubscribe from all jobs
      jobs.forEach(job => {
        socket.emit('unsubscribe', job.jobId);
      });
    };
  }, [socket, jobs]);

  if (loading && jobs.length === 0) {
    return <div className="active-jobs-loading">Loading active jobs...</div>;
  }

  if (error) {
    return <div className="active-jobs-error">{error}</div>;
  }

  if (jobs.length === 0) {
    return (
      <div className="active-jobs card">
        <h2>Active Jobs ({activeJobs})</h2>
        <p className="no-active-jobs">No active jobs at the moment</p>
      </div>
    );
  }

  return (
    <div className="active-jobs card">
      <h2>Active Jobs ({activeJobs})</h2>
      
      <div className="jobs-list">
        {jobs.map(job => (
          <div key={job.jobId} className="job-item">
            <div className="job-header">
              <h3>Job {job.jobId}</h3>
              <span className={`job-status status-${job.status}`}>
                {job.status}
              </span>
            </div>
            
            <div className="job-details">
              <p><strong>Runtime:</strong> {job.data.runtime}</p>
              <p><strong>Type:</strong> {job.data.submission_type}</p>
              <p><strong>Started:</strong> {new Date(job.processedAt).toLocaleString()}</p>
            </div>
            
            <div className="job-logs">
              <h4>Live Logs</h4>
              <div className="log-container">
                {jobLogs[job.jobId]?.map((log, index) => (
                  <div 
                    key={index} 
                    className={`log-line ${log.type === 'stderr' ? 'error-log' : ''}`}
                  >
                    {log.data}
                  </div>
                )) || <p>No logs available</p>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveJobs;
