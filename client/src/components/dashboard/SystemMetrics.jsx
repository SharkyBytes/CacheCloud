import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const SystemMetrics = ({ cpu, memory, containers }) => {
  const cpuChartRef = useRef(null);
  const memoryChartRef = useRef(null);
  const cpuChart = useRef(null);
  const memoryChart = useRef(null);

  // Initialize and update charts
  useEffect(() => {
    if (!cpu || !memory) return;

    // CPU Chart
    if (cpuChartRef.current) {
      if (cpuChart.current) {
        cpuChart.current.data.datasets[0].data = [cpu.usage, 100 - cpu.usage];
        cpuChart.current.update();
      } else {
        cpuChart.current = new Chart(cpuChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Used', 'Free'],
            datasets: [{
              data: [cpu.usage, 100 - cpu.usage],
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
        memoryChart.current.data.datasets[0].data = [memory.percentUsed, 100 - memory.percentUsed];
        memoryChart.current.update();
      } else {
        memoryChart.current = new Chart(memoryChartRef.current, {
          type: 'doughnut',
          data: {
            labels: ['Used', 'Free'],
            datasets: [{
              data: [memory.percentUsed, 100 - memory.percentUsed],
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

    return () => {
      if (cpuChart.current) {
        cpuChart.current.destroy();
        cpuChart.current = null;
      }
      if (memoryChart.current) {
        memoryChart.current.destroy();
        memoryChart.current = null;
      }
    };
  }, [cpu, memory]);

  if (!cpu || !memory || !containers) {
    return <div className="metrics-loading">Loading system metrics...</div>;
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="system-metrics card">
      <h2>System Metrics</h2>
      
      <div className="metrics-grid">
        <div className="metric-chart">
          <canvas ref={cpuChartRef} height="200"></canvas>
          <div className="metric-details">
            <p><strong>CPU Usage:</strong> {cpu.usage}%</p>
            <p><strong>CPU Cores:</strong> {cpu.cores}</p>
          </div>
        </div>
        
        <div className="metric-chart">
          <canvas ref={memoryChartRef} height="200"></canvas>
          <div className="metric-details">
            <p><strong>Memory Used:</strong> {formatBytes(memory.used)} ({memory.percentUsed}%)</p>
            <p><strong>Memory Free:</strong> {formatBytes(memory.free)}</p>
            <p><strong>Memory Total:</strong> {formatBytes(memory.total)}</p>
          </div>
        </div>
      </div>
      
      <div className="containers-info">
        <h3>Container Usage</h3>
        <div className="container-bar">
          <div 
            className="container-bar-fill" 
            style={{ width: `${(containers.active / containers.max) * 100}%` }}
          ></div>
          <span className="container-bar-text">
            {containers.active} / {containers.max} containers active
          </span>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;
