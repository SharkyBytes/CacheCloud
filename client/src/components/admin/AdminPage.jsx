import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import { fetchSystemMetrics, fetchJobStatistics, API_BASE_URL } from '../../services/api';
import SystemOverview from './SystemOverview';
import UsageCharts from './UsageCharts';
import JobStatistics from './JobStatistics';
import ResourceHistory from './ResourceHistory';

const AdminPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // History data
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io(API_BASE_URL);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('metrics', (data) => {
      setMetrics(prevMetrics => {
        if (!prevMetrics) return data;
        
        // Update metrics
        const updatedMetrics = {
          ...prevMetrics,
          ...data
        };
        
        // Update history data
        const now = new Date().toLocaleTimeString();
        setCpuHistory(prev => [...prev.slice(-19), data.cpu.usage]);
        setMemoryHistory(prev => [...prev.slice(-19), data.memory.percentUsed]);
        setTimeLabels(prev => [...prev.slice(-19), now]);
        
        return updatedMetrics;
      });
    });

    socketInstance.on('job_status', () => {
      // Refresh job statistics when job status changes
      fetchJobStatistics()
        .then(data => setStatistics(data))
        .catch(err => console.error('Error fetching job statistics:', err));
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch initial data
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Fetch metrics and statistics in parallel
        const [metricsData, statsData] = await Promise.all([
          fetchSystemMetrics(),
          fetchJobStatistics()
        ]);
        
        setMetrics(metricsData);
        setStatistics(statsData);
        
        // Initialize history data
        const now = new Date().toLocaleTimeString();
        setCpuHistory([metricsData.cpu.usage]);
        setMemoryHistory([metricsData.memory.percentUsed]);
        setTimeLabels([now]);
        
        setError(null);
      } catch (err) {
        console.error('Error fetching admin data:', err);
        setError('Failed to load system data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadData, 30000);

    return () => clearInterval(interval);
  }, []);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

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

  if (loading && !metrics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="flex items-center justify-center min-h-96">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
            </div>
          </div>
          <div className="ml-4">
            <p className="text-lg font-semibold text-slate-700">Loading System Data</p>
            <p className="text-sm text-slate-500">Fetching real-time metrics...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-red-800 mb-2">Error Loading Data</h2>
          <p className="text-red-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all duration-300 transform hover:scale-105"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!metrics || !statistics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <div className="text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
            <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data Available</h3>
          <p className="text-slate-500">System data is not available at the moment</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Modern Header */}
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/20">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div className="mb-4 lg:mb-0">
            <div className="flex items-center mb-2">
              <div className="flex items-center justify-center w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-4 shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent">
                  System Administration
                </h1>
                <p className="text-slate-600">Monitor and manage your system resources and job queue</p>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <div className="flex items-center text-sm text-slate-600">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Last updated: {new Date().toLocaleString()}
            </div>
            
            <div className="flex items-center">
              <div className={`w-3 h-3 rounded-full mr-2 ${socket?.connected ? 'bg-emerald-500' : 'bg-red-500'}`}></div>
              <span className={`text-sm font-medium ${socket?.connected ? 'text-emerald-600' : 'text-red-600'}`}>
                {socket?.connected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        <SystemOverview 
          metrics={metrics} 
          formatBytes={formatBytes} 
          formatDuration={formatDuration} 
        />

        <UsageCharts 
          metrics={metrics} 
          formatBytes={formatBytes} 
        />

        <JobStatistics 
          statistics={statistics} 
          formatDuration={formatDuration} 
        />

        <ResourceHistory 
          cpuHistory={cpuHistory}
          memoryHistory={memoryHistory}
          timeLabels={timeLabels}
        />
      </div>
    </div>
  );
};

export default AdminPage;
