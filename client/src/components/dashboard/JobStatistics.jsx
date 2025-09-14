import { useEffect, useRef } from 'react';
import Chart from 'chart.js/auto';

const JobStatistics = ({ queue, overall }) => {
  const queueChartRef = useRef(null);
  const overallChartRef = useRef(null);
  const queueChart = useRef(null);
  const overallChart = useRef(null);

  // Initialize and update charts
  useEffect(() => {
    if (!queue || !overall) return;

    // Queue Chart
    if (queueChartRef.current) {
      if (queueChart.current) {
        queueChart.current.data.datasets[0].data = [
          queue.waiting,
          queue.active,
          queue.completed,
          queue.failed,
          queue.delayed
        ];
        queueChart.current.update();
      } else {
        queueChart.current = new Chart(queueChartRef.current, {
          type: 'pie',
          data: {
            labels: ['Waiting', 'Active', 'Completed', 'Failed', 'Delayed'],
            datasets: [{
              data: [queue.waiting, queue.active, queue.completed, queue.failed, queue.delayed],
              backgroundColor: [
                '#FFCE56', // Waiting - Yellow
                '#36A2EB', // Active - Blue
                '#4BC0C0', // Completed - Green
                '#FF6384', // Failed - Red
                '#9966FF'  // Delayed - Purple
              ]
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              title: {
                display: true,
                text: 'Current Queue Status'
              },
              legend: {
                position: 'right'
              }
            }
          }
        });
      }
    }

    // Overall Chart
    if (overallChartRef.current) {
      if (overallChart.current) {
        overallChart.current.data.datasets[0].data = [
          overall.completed,
          overall.failed,
          overall.active,
          overall.queued
        ];
        overallChart.current.update();
      } else {
        overallChart.current = new Chart(overallChartRef.current, {
          type: 'pie',
          data: {
            labels: ['Completed', 'Failed', 'Active', 'Queued'],
            datasets: [{
              data: [overall.completed, overall.failed, overall.active, overall.queued],
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
                text: 'Overall Job Statistics'
              },
              legend: {
                position: 'right'
              }
            }
          }
        });
      }
    }

    return () => {
      if (queueChart.current) {
        queueChart.current.destroy();
        queueChart.current = null;
      }
      if (overallChart.current) {
        overallChart.current.destroy();
        overallChart.current = null;
      }
    };
  }, [queue, overall]);

  if (!queue || !overall) {
    return <div className="stats-loading">Loading job statistics...</div>;
  }

  const formatDuration = (ms) => {
    if (!ms) return '0s';
    
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
    <div className="job-statistics card">
      <h2>Job Statistics</h2>
      
      <div className="stats-grid">
        <div className="stats-chart">
          <canvas ref={queueChartRef} height="200"></canvas>
          <div className="stats-details">
            <p><strong>Total in Queue:</strong> {queue.total}</p>
            <p><strong>Waiting:</strong> {queue.waiting}</p>
            <p><strong>Active:</strong> {queue.active}</p>
            <p><strong>Delayed:</strong> {queue.delayed}</p>
          </div>
        </div>
        
        <div className="stats-chart">
          <canvas ref={overallChartRef} height="200"></canvas>
          <div className="stats-details">
            <p><strong>Total Jobs:</strong> {overall.total}</p>
            <p><strong>Completed:</strong> {overall.completed}</p>
            <p><strong>Failed:</strong> {overall.failed}</p>
            <p><strong>Avg Duration:</strong> {formatDuration(overall.avgDuration)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobStatistics;
