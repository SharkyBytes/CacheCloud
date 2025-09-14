import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import SystemMetrics from './dashboard/SystemMetrics';
import JobStatistics from './dashboard/JobStatistics';
import ActiveJobs from './dashboard/ActiveJobs';
import { fetchDashboardData, API_BASE_URL } from '../services/api';

// Modern Loading Component
const LoadingSpinner = () => (
  <div className="flex items-center justify-center min-h-96">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full animate-pulse"></div>
      </div>
    </div>
    <div className="ml-4">
      <p className="text-lg font-semibold text-slate-700">Loading Dashboard</p>
      <p className="text-sm text-slate-500">Fetching real-time data...</p>
    </div>
  </div>
);

// Modern Error Component
const ErrorMessage = ({ message }) => (
  <div className="bg-red-50 border border-red-200 rounded-2xl p-8 text-center">
    <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mx-auto mb-4">
      <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-red-800 mb-2">Dashboard Error</h3>
    <p className="text-red-600">{message}</p>
  </div>
);

// Modern No Data Component
const NoDataMessage = () => (
  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-8 text-center">
    <div className="flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mx-auto mb-4">
      <svg className="w-8 h-8 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
      </svg>
    </div>
    <h3 className="text-lg font-semibold text-slate-700 mb-2">No Data Available</h3>
    <p className="text-slate-500">Dashboard data is not available at the moment</p>
  </div>
);

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    const socketInstance = io(API_BASE_URL);
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      console.log('Connected to WebSocket server');
    });

    socketInstance.on('metrics', (data) => {
      console.log('Received metrics update:', data);
      setDashboardData(prevData => ({
        ...prevData,
        ...data
      }));
      setLastUpdated(new Date());
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
        setLastUpdated(new Date());
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
    const interval = setInterval(loadDashboardData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <LoadingSpinner />
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <ErrorMessage message={error} />
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8">
        <NoDataMessage />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Dashboard Header */}
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl mb-4 shadow-lg">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
          </svg>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-slate-900 to-slate-700 bg-clip-text text-transparent mb-2">
          System Dashboard
        </h1>
        <p className="text-slate-600">Real-time monitoring and analytics</p>
      </div>
      
      {/* Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-8">
        <SystemMetrics 
          cpu={dashboardData.system?.cpu} 
          memory={dashboardData.system?.memory} 
          containers={dashboardData.system?.containers} 
        />
        
        <JobStatistics 
          queue={dashboardData.jobs?.queue} 
          overall={dashboardData.jobs?.overall} 
        />
        
        <ActiveJobs 
          activeJobs={dashboardData.jobs?.queue?.active || 0} 
          socket={socket} 
        />
      </div>
      
      {/* Dashboard Footer */}
      <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 border border-white/20 text-center">
        <div className="flex items-center justify-center text-sm text-slate-500">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Last updated: {lastUpdated ? lastUpdated.toLocaleString() : 'Never'}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
