import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import SystemMetrics from './dashboard/SystemMetrics';
import JobStatistics from './dashboard/JobStatistics';
import ActiveJobs from './dashboard/ActiveJobs';
import { fetchDashboardData } from '../services/api';

const Dashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
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
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from WebSocket server');
    });

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Fetch initial dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true);
        const data = await fetchDashboardData();
        setDashboardData(data);
        setError(null);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Failed to load dashboard data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();

    // Refresh data every 30 seconds
    const interval = setInterval(loadDashboardData, 30000);

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return <div className="loading">Loading dashboard data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!dashboardData) {
    return <div className="no-data">No dashboard data available</div>;
  }

  return (
    <div className="dashboard">
      <h1>System Dashboard</h1>
      
      <div className="dashboard-grid">
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
      
      <div className="dashboard-footer">
        <p>Last updated: {new Date(dashboardData.timestamp).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default Dashboard;
