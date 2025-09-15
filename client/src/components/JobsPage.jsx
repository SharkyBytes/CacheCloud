import { useState, useEffect } from 'react';
import JobSubmissionForm from './JobSubmissionForm';
import JobMonitor from './JobMonitor';

// Modern SVG Icons
const SubmitIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
  </svg>
);

const MonitorIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const JobsPage = () => {
  const [activeTab, setActiveTab] = useState('submit');
  const [selectedJobId, setSelectedJobId] = useState(null);
  const [recentJobs, setRecentJobs] = useState([]);

  const handleJobSubmitted = (jobId) => {
    // Add a small delay to ensure the job is saved to database before switching tabs
    setTimeout(() => {
      setSelectedJobId(jobId);
      setActiveTab('monitor');
    }, 1000); // 1 second delay
    
    setRecentJobs(prevJobs => {
      const newJobs = [
        { id: jobId, timestamp: new Date().toISOString() },
        ...prevJobs.filter(job => job.id !== jobId)
      ].slice(0, 10);
      
      localStorage.setItem('recentJobs', JSON.stringify(newJobs));
      return newJobs;
    });
  };

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

  const tabs = [
    { id: 'submit', label: 'Submit Job', icon: <SubmitIcon />, disabled: false },
    { id: 'monitor', label: 'Monitor Job', icon: <MonitorIcon />, disabled: !selectedJobId },
  ];

  return (
    <div className="space-y-8">
      {/* Modern Tab Navigation */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-2 shadow-lg border border-white/20">
        <div className="flex space-x-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => !tab.disabled && setActiveTab(tab.id)}
              disabled={tab.disabled}
              className={`flex items-center px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 transform ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg scale-105 shadow-indigo-500/25'
                  : tab.disabled
                  ? 'text-slate-400 cursor-not-allowed'
                  : 'text-slate-600 hover:bg-white/60 hover:text-slate-800 hover:scale-102'
              }`}
            >
              <div className="mr-2">{tab.icon}</div>
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Tab Content */}
      <div className="transition-all duration-500 ease-out">
        {activeTab === 'submit' ? (
          <JobSubmissionForm onJobSubmitted={handleJobSubmitted} />
        ) : (
          <JobMonitor jobId={selectedJobId} />
        )}
      </div>
      
      {/* Recent Jobs Section */}
      {recentJobs.length > 0 && (
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
          <div className="flex items-center mb-6">
            <div className="flex items-center justify-center w-8 h-8 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-lg mr-3">
              <ClockIcon />
            </div>
            <h3 className="text-xl font-semibold text-slate-800">Recent Jobs</h3>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {recentJobs.map(job => (
              <button
                key={job.id}
                onClick={() => {
                  setSelectedJobId(job.id);
                  setActiveTab('monitor');
                }}
                className={`group p-4 rounded-xl border transition-all duration-300 transform hover:scale-105 ${
                  selectedJobId === job.id
                    ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-300 shadow-lg shadow-indigo-500/25'
                    : 'bg-white/60 border-slate-200 hover:bg-white hover:shadow-md hover:border-slate-300'
                }`}
              >
                <div className="text-left">
                  <div className="font-semibold text-slate-800 truncate mb-2">
                    {job.id}
                  </div>
                  <div className="flex items-center text-xs text-slate-500">
                    <ClockIcon />
                    <span className="ml-1">
                      {new Date(job.timestamp).toLocaleString()}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default JobsPage;
