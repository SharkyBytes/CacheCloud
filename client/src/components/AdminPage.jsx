import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import Chart from 'chart.js/auto';
import { fetchSystemMetrics, fetchJobStatistics } from '../services/api';

const AdminPage = () => {
  const [metrics, setMetrics] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [socket, setSocket] = useState(null);
  
  // Chart references
  const cpuChartRef = useRef(null);
  const memoryChartRef = useRef(null);
  const jobsChartRef = useRef(null);
  const cpuHistoryRef = useRef(null);
  const memoryHistoryRef = useRef(null);
  
  // Chart instances
  const cpuChart = useRef(null);
  const memoryChart = useRef(null);
  const jobsChart = useRef(null);
  const cpuHistoryChart = useRef(null);
  const memoryHistoryChart = useRef(null);
  
  // History data
  const [cpuHistory, setCpuHistory] = useState([]);
  const [memoryHistory, setMemoryHistory] = useState([]);
  const [timeLabels, setTimeLabels] = useState([]);

  // Initialize socket connection
  useEffect(() => {
    const socketInstance = io('http://localhost:5000');
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

  // Initialize and update charts
  useEffect(() => {
    if (!metrics || !statistics) return;

    // CPU Chart
    if (cpuChartRef.current) {
      if (cpuChart.current) {
        cpuChart.current.data.datasets[0].data = [metrics.cpu.usage, 100 - metrics.cpu.usage];
        cpuChart.current.update();
      } else {
        cpuChart.current = new Chart(cpuChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Used', 'Free'],
            datasets: [{
              data: [metrics.cpu.usage, 100 - metrics.cpu.usage],
              backgroundColor: ['#FF6384', '#36A2EB'],
              hoverBackgroundColor: ['#FF6384', '#36A2EB']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'CPU Usage'
              }
            }
          }
        });
      }
    }

    // Memory Chart
    if (memoryChartRef.current) {
      if (memoryChart.current) {
        memoryChart.current.data.datasets[0].data = [metrics.memory.percentUsed, 100 - metrics.memory.percentUsed];
        memoryChart.current.update();
      } else {
        memoryChart.current = new Chart(memoryChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Used', 'Free'],
            datasets: [{
              data: [metrics.memory.percentUsed, 100 - metrics.memory.percentUsed],
              backgroundColor: ['#FFCE56', '#4BC0C0'],
              hoverBackgroundColor: ['#FFCE56', '#4BC0C0']
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Memory Usage'
              }
            }
          }
        });
      }
    }

    // Jobs Chart
    if (jobsChartRef.current) {
      if (jobsChart.current) {
        jobsChart.current.data.datasets[0].data = [
          statistics.overall.completed,
          statistics.overall.failed,
          statistics.overall.active,
          statistics.overall.queued
        ];
        jobsChart.current.update();
      } else {
        jobsChart.current = new Chart(jobsChartRef.current, {
          type: 'pie',
          data: {
            labels: ['Completed', 'Failed', 'Active', 'Queued'],
            datasets: [{
              data: [
                statistics.overall.completed,
                statistics.overall.failed,
                statistics.overall.active,
                statistics.overall.queued
              ],
              backgroundColor: [
                '#4BC0C0', // Completed - Green
                '#FF6384', // Failed - Red
                '#36A2EB', // Active - Blue
                '#FFCE56'  // Queued - Yellow
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Job Distribution'
              }
            }
          }
        });
      }
    }

    return () => {
      if (cpuChart.current) {
        cpuChart.current.destroy();
        cpuChart.current = null;
      }
      if (memoryChart.current) {
        memoryChart.current.destroy();
        memoryChart.current = null;
      }
      if (jobsChart.current) {
        jobsChart.current.destroy();
        jobsChart.current = null;
      }
    };
  }, [metrics, statistics]);

  // Update history charts
  useEffect(() => {
    if (cpuHistory.length === 0 || timeLabels.length === 0) return;

    // CPU History Chart
    if (cpuHistoryRef.current) {
      if (cpuHistoryChart.current) {
        cpuHistoryChart.current.data.labels = timeLabels;
        cpuHistoryChart.current.data.datasets[0].data = cpuHistory;
        cpuHistoryChart.current.update();
      } else {
        cpuHistoryChart.current = new Chart(cpuHistoryRef.current, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: 'CPU Usage %',
              data: cpuHistory,
              fill: false,
              borderColor: '#FF6384',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'CPU Usage History'
              }
            }
          }
        });
      }
    }

    // Memory History Chart
    if (memoryHistoryRef.current) {
      if (memoryHistoryChart.current) {
        memoryHistoryChart.current.data.labels = timeLabels;
        memoryHistoryChart.current.data.datasets[0].data = memoryHistory;
        memoryHistoryChart.current.update();
      } else {
        memoryHistoryChart.current = new Chart(memoryHistoryRef.current, {
          type: 'line',
          data: {
            labels: timeLabels,
            datasets: [{
              label: 'Memory Usage %',
              data: memoryHistory,
              fill: false,
              borderColor: '#4BC0C0',
              tension: 0.1
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: {
                beginAtZero: true,
                max: 100
              }
            },
            plugins: {
              title: {
                display: true,
                text: 'Memory Usage History'
              }
            }
          }
        });
      }
    }

    return () => {
      if (cpuHistoryChart.current) {
        cpuHistoryChart.current.destroy();
        cpuHistoryChart.current = null;
      }
      if (memoryHistoryChart.current) {
        memoryHistoryChart.current.destroy();
        memoryHistoryChart.current = null;
      }
    };
  }, [cpuHistory, memoryHistory, timeLabels]);

  if (loading && !metrics) {
    return <div className="loading">Loading system data...</div>;
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  if (!metrics || !statistics) {
    return <div className="no-data">No system data available</div>;
  }

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

  return (
    <div className="admin-page">
      <h1>System Administration</h1>
      
      <div className="admin-grid">
        {/* System Overview */}
        <div className="admin-card system-overview">
          <h2>System Overview</h2>
          <div className="overview-stats">
            <div className="stat-item">
              <div className="stat-label">CPU Cores</div>
              <div className="stat-value">{metrics.cpu.cores}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Total Memory</div>
              <div className="stat-value">{formatBytes(metrics.memory.total)}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Active Containers</div>
              <div className="stat-value">{metrics.containers.active} / {metrics.containers.max}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Platform</div>
              <div className="stat-value">{metrics.system?.platform || 'N/A'}</div>
            </div>
            <div className="stat-item">
              <div className="stat-label">Uptime</div>
              <div className="stat-value">{formatDuration(metrics.system?.uptime * 1000 || 0)}</div>
            </div>
          </div>
        </div>
        
        {/* Current Usage */}
        <div className="admin-card current-usage">
          <h2>Current Usage</h2>
          <div className="charts-grid">
            <div className="chart-container">
              <canvas ref={cpuChartRef} height="200"></canvas>
              <div className="chart-details">
                <p><strong>CPU Usage:</strong> {metrics.cpu.usage}%</p>
              </div>
            </div>
            <div className="chart-container">
              <canvas ref={memoryChartRef} height="200"></canvas>
              <div className="chart-details">
                <p><strong>Memory Used:</strong> {metrics.memory.percentUsed}%</p>
                <p><strong>Free:</strong> {formatBytes(metrics.memory.free)}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Job Statistics */}
        <div className="admin-card job-statistics">
          <h2>Job Statistics</h2>
          <div className="stats-grid">
            <div className="chart-container">
              <canvas ref={jobsChartRef} height="200"></canvas>
            </div>
            <div className="stats-details">
              <div className="stat-item">
                <div className="stat-label">Total Jobs</div>
                <div className="stat-value">{statistics.overall.total}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Completed</div>
                <div className="stat-value">{statistics.overall.completed}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Failed</div>
                <div className="stat-value">{statistics.overall.failed}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Active</div>
                <div className="stat-value">{statistics.overall.active}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Queued</div>
                <div className="stat-value">{statistics.overall.queued}</div>
              </div>
              <div className="stat-item">
                <div className="stat-label">Avg Duration</div>
                <div className="stat-value">{formatDuration(statistics.overall.avgDuration)}</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Resource History */}
        <div className="admin-card resource-history">
          <h2>Resource History</h2>
          <div className="history-charts">
            <div className="chart-container">
              <canvas ref={cpuHistoryRef} height="150"></canvas>
            </div>
            <div className="chart-container">
              <canvas ref={memoryHistoryRef} height="150"></canvas>
            </div>
          </div>
        </div>
      </div>
      
      <div className="admin-footer">
        <p>Last updated: {new Date().toLocaleString()}</p>
      </div>
    </div>
  );
};

export default AdminPage;
