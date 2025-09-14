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
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex items-center">
            <div className="w-8 h-8 bg-indigo-200 rounded-full mr-3"></div>
            <span className="text-slate-600">Loading active jobs...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Jobs</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        {/* Header */}
        <div className="flex items-center mb-6">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mr-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Active Jobs ({activeJobs})</h2>
        </div>
        
        <div className="text-center py-8">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Active Jobs</h3>
          <p className="text-slate-500">No jobs are currently running</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl mr-3 shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Active Jobs ({activeJobs})</h2>
      </div>
      
      {/* Jobs List */}
      <div className="space-y-4 max-h-96 overflow-y-auto">
        {jobs.map(job => (
          <div key={job.jobId} className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-xl p-4 border border-slate-200/50 backdrop-blur-sm">
            {/* Job Header */}
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-slate-800">Job {job.jobId}</h3>
              <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${getStatusColor(job.status)}`}>
                {job.status.toUpperCase()}
              </span>
            </div>
            
            {/* Job Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4 text-sm">
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                </svg>
                <span className="text-slate-600">Runtime:</span>
                <span className="font-semibold text-slate-800 ml-1">{job.data.runtime}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
                </svg>
                <span className="text-slate-600">Type:</span>
                <span className="font-semibold text-slate-800 ml-1">{job.data.submission_type}</span>
              </div>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-slate-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-slate-600">Started:</span>
                <span className="font-semibold text-slate-800 ml-1">{new Date(job.processedAt).toLocaleString()}</span>
              </div>
            </div>
            
            {/* Live Logs */}
            <div className="border-t border-slate-200/50 pt-4">
              <div className="flex items-center mb-3">
                <svg className="w-4 h-4 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-sm font-semibold text-slate-700">Live Logs</h4>
              </div>
              <div className="bg-slate-900 rounded-lg p-3 max-h-32 overflow-y-auto">
                <div className="font-mono text-xs">
                  {jobLogs[job.jobId]?.length > 0 ? (
                    jobLogs[job.jobId].map((log, index) => (
                      <div 
                        key={index} 
                        className={`mb-1 ${log.type === 'stderr' ? 'text-red-400' : 'text-green-400'}`}
                      >
                        {log.data}
                      </div>
                    ))
                  ) : (
                    <div className="text-slate-500 italic">No logs available</div>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveJobs;
