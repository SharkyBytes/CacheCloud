import { useState, useEffect } from 'react';
import JobSubmissionForm from './JobSubmissionForm';
import JobMonitor from './JobMonitor';

const JobsPage = () => {
  const [activeTab, setActiveTab] = useState('submit'); // submit or monitor
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  // Handle job submission
  const handleJobSubmitted = (jobId) => {
    setSelectedJobId(jobId);
    setActiveTab('monitor');
    
    // Add to recent jobs
    setRecentJobs(prevJobs => {
      const newJobs = [
        { id: jobId, timestamp: new Date().toISOString() },
        ...prevJobs.filter(job => job.id !== jobId)
      ].slice(0, 10); // Keep only 10 most recent jobs
      
      // Save to localStorage
      localStorage.setItem('recentJobs', JSON.stringify(newJobs));
      
      return newJobs;
    });
  };

  // Load recent jobs from localStorage on component mount
  useEffect(() => {
    const savedJobs = localStorage.getItem('recentJobs');
    if (savedJobs) {
      try {
        setRecentJobs(JSON.parse(savedJobs));
      } catch (error) {
        console.error('Failed to parse recent jobs from localStorage:', error);
      }
    }
  }, []);

  return (
    <div className="jobs-page">
      <div className="jobs-tabs">
        <button 
          className={activeTab === 'submit' ? 'active' : ''} 
          onClick={() => setActiveTab('submit')}
        >
          Submit Job
        </button>
        <button 
          className={activeTab === 'monitor' ? 'active' : ''} 
          onClick={() => setActiveTab('monitor')}
          disabled={!selectedJobId}
        >
          Monitor Job
        </button>
      </div>
      
      <div className="jobs-content">
        {activeTab === 'submit' ? (
          <JobSubmissionForm onJobSubmitted={handleJobSubmitted} />
        ) : (
          <JobMonitor jobId={selectedJobId} />
        )}
      </div>
      
      {recentJobs.length > 0 && (
        <div className="recent-jobs">
          <h3>Recent Jobs</h3>
          <ul>
            {recentJobs.map(job => (
              <li key={job.id}>
                <button 
                  onClick={() => {
                    setSelectedJobId(job.id);
                    setActiveTab('monitor');
                  }}
                  className={selectedJobId === job.id ? 'active' : ''}
                >
                  {job.id}
                  <span className="job-time">
                    {new Date(job.timestamp).toLocaleString()}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
