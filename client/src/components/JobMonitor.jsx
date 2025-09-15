import { useState, useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';
import { fetchJobDetails, fetchJobLogs, API_BASE_URL } from '../services/api';

const JobMonitor = ({ jobId }) => {
  const [job, setJob] = useState(null);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [autoScroll, setAutoScroll] = useState(true);

  // Use refs to prevent duplicate requests
  const isLoadingRef = useRef(false);
  const currentJobIdRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Fetch job details and logs with proper cleanup and duplicate prevention
  const loadJobDetails = useCallback(async (targetJobId) => {
    // Prevent duplicate requests for the same job
    if (isLoadingRef.current && currentJobIdRef.current === targetJobId) {
      console.log('Request already in progress for job:', targetJobId);
      return;
    }

    // Cancel any existing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();
    isLoadingRef.current = true;
    currentJobIdRef.current = targetJobId;

    try {
      setLoading(true);
      setError(null);

      console.log('Fetching job details for:', targetJobId);
      
      // Fetch both job details and logs in parallel
      const [jobData, logsData] = await Promise.all([
        fetchJobDetails(targetJobId),
        fetchJobLogs(targetJobId).catch(err => {
          console.warn(`Error fetching logs for job ${targetJobId}:`, err);
          return [];
        })
      ]);

      // Only update state if this is still the current job
      if (currentJobIdRef.current === targetJobId && !abortControllerRef.current.signal.aborted) {
        setJob(jobData);
        setLogs(Array.isArray(logsData) ? logsData : []);
      }
    } catch (err) {
      // Only handle error if request wasn't aborted and it's still the current job
      if (err.name !== 'AbortError' && currentJobIdRef.current === targetJobId) {
        console.error(`Error fetching job ${targetJobId} details:`, err);
        setError(`Failed to load job details: ${err.message}`);
      }
    } finally {
      if (currentJobIdRef.current === targetJobId) {
        setLoading(false);
      }
      isLoadingRef.current = false;
    }
  }, []);

  // Initialize socket connection and fetch job details
  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setLogs([]);
      setLoading(false);
      setError(null);
      return;
    }

    // Reset state when jobId changes
    if (currentJobIdRef.current !== jobId) {
      setJob(null);
      setLogs([]);
      setError(null);
    }

    // Make sure we're connecting to the WebSocket endpoint correctly
    const socketInstance = io(API_BASE_URL, {
      path: '/socket.io'
    });
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server for job:', jobId);
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
          result: {
            ...prevJob?.result,
            exitCode: statusData.exitCode,
            duration: statusData.duration
          }
        }));
      }
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    // Load job details only once per jobId
    loadJobDetails(jobId);

    return () => {
      console.log('Cleaning up socket connection for job:', jobId);
      socketInstance.emit('unsubscribe', jobId);
      socketInstance.disconnect();

      // Cancel any pending request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [jobId, loadJobDetails]);

  // Auto-scroll logs
  useEffect(() => {
    if (autoScroll && logs.length > 0) {
      const logContainer = document.getElementById('log-container');
      if (logContainer) {
        logContainer.scrollTop = logContainer.scrollHeight;
      }
    }
  }, [logs, autoScroll]);

  if (!jobId) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Job Selected</h3>
          <p className="text-slate-500">Please select a job to monitor</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="flex items-center justify-center min-h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-lg font-semibold text-slate-700">Loading Job Details</p>
            <p className="text-sm text-slate-500">Fetching job {jobId}...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-red-800 mb-2">Error Loading Job</h3>
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-amber-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-amber-800 mb-2">Job Not Found</h3>
          <p className="text-amber-600">Job {jobId} could not be found</p>
        </div>
      </div>
    );
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
    if (!dateString || dateString === 'N/A') return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Invalid Date';
      }
      return date.toLocaleString();
    } catch (err) {
      console.warn('Error formatting date:', err);
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'failed': return 'bg-red-100 text-red-800 border-red-200';
      case 'waiting': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'delayed': return 'bg-purple-100 text-purple-800 border-purple-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  // Extract values from job data with fallbacks
  const getJobValue = (path, defaultValue = 'N/A') => {
    try {
      const parts = path.split('.');
      let value = job;
      
      for (const part of parts) {
        if (value === null || value === undefined) return defaultValue;
        value = value[part];
      }
      
      return value !== null && value !== undefined ? value : defaultValue;
    } catch (err) {
      console.warn(`Error getting job value for ${path}:`, err);
      return defaultValue;
    }
  };

  // Calculate duration from result or timestamps if available
  const getDuration = () => {
    // First try to get duration from result
    const resultDuration = getJobValue('result.duration');
    if (resultDuration && resultDuration !== 'N/A') {
      return resultDuration;
    }
    
    // Try to calculate from timestamps
    const processedAt = getJobValue('processedAt');
    const finishedAt = getJobValue('finishedAt');
    
    if (processedAt && processedAt !== 'N/A' && finishedAt && finishedAt !== 'N/A') {
      try {
        const start = new Date(processedAt).getTime();
        const end = new Date(finishedAt).getTime();
        if (!isNaN(start) && !isNaN(end)) {
          return end - start;
        }
      } catch (err) {
        console.warn('Error calculating duration from timestamps:', err);
      }
    }
    
    return null;
  };

  const jobDetails = [
    { label: 'Type', value: getJobValue('data.submission_type'), icon: '📋' },
    { label: 'Runtime', value: getJobValue('data.runtime'), icon: '⚙️' },
    { label: 'Memory Limit', value: getJobValue('data.memory_limit'), icon: '💾' },
    { label: 'Submitted', value: formatDate(getJobValue('data.submitted_at') || getJobValue('createdAt')), icon: '📤' },
    { label: 'Started', value: formatDate(getJobValue('processedAt')), icon: '▶️' },
    { label: 'Completed', value: formatDate(getJobValue('finishedAt')), icon: '✅' },
    { label: 'Duration', value: formatDuration(getDuration()), icon: '⏱️' },
    { label: 'Exit Code', value: getJobValue('result.exitCode', 'N/A'), icon: '🔢' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-4 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-slate-800">Job Monitor</h2>
              <p className="text-slate-600">Job ID: {jobId}</p>
            </div>
          </div>
          <span className={`px-4 py-2 rounded-full text-sm font-semibold border ${getStatusColor(job.status)}`}>
            {job.status.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Job Details */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <h3 className="text-xl font-semibold text-slate-800 mb-6">Job Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {jobDetails.map((detail, index) => (
            <div key={index} className="bg-gradient-to-br from-slate-50/50 to-white/50 rounded-xl p-4 border border-slate-200/50 backdrop-blur-sm">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-sm text-slate-600 mb-1">{detail.label}</div>
                  <div className="text-sm font-semibold text-slate-800 break-all">{detail.value}</div>
                </div>
                <div className="text-lg ml-2">{detail.icon}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Job Logs */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <svg className="w-6 h-6 text-slate-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <h3 className="text-xl font-semibold text-slate-800">Live Logs</h3>
          </div>

          <div className="flex items-center space-x-4">
            <label className="flex items-center text-sm text-slate-600">
              <input
                type="checkbox"
                checked={autoScroll}
                onChange={() => setAutoScroll(!autoScroll)}
                className="mr-2 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              Auto-scroll
            </label>
            <button
              onClick={() => setLogs([])}
              disabled={logs.length === 0}
              className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              Clear Logs
            </button>
          </div>
        </div>

        <div
          id="log-container"
          className="bg-slate-900 rounded-xl p-4 h-96 overflow-y-auto font-mono text-sm"
        >
          {logs.length === 0 ? (
            <div className="flex items-center justify-center h-full text-slate-500 italic">
              No logs available
            </div>
          ) : (
            logs.map((log, index) => (
              <div
                key={index}
                className={`mb-1 ${log.type === 'stderr' ? 'text-red-400' : 'text-green-400'}`}
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
