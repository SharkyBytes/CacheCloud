import { useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

const JobStatistics = ({ queue, overall }) => {
  const queueChartRef = useRef(null);
  const overallChartRef = useRef(null);
  const queueChart = useRef(null);
  const overallChart = useRef(null);
  const isInitialized = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (queueChart.current) {
      queueChart.current.destroy();
      queueChart.current = null;
    }
    if (overallChart.current) {
      overallChart.current.destroy();
      overallChart.current = null;
    }
    isInitialized.current = false;
  }, []);

  // Initialize charts only once
  const initializeCharts = useCallback(() => {
    if (!queue || !overall || !queueChartRef.current || !overallChartRef.current || isInitialized.current) {
      return;
    }

    // Cleanup any existing charts first
    cleanup();

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false
        }
      },
      animation: {
        duration: 0 // Disable animations to prevent infinite loops
      }
    };

    try {
      // Queue Chart
      queueChart.current = new Chart(queueChartRef.current, {
        type: 'pie',
        data: {
          labels: ['Waiting', 'Active', 'Completed', 'Failed', 'Delayed'],
          datasets: [{
            data: [queue.waiting, queue.active, queue.completed, queue.failed, queue.delayed],
            backgroundColor: [
              'rgba(251, 191, 36, 0.8)', // Waiting - Yellow
              'rgba(59, 130, 246, 0.8)', // Active - Blue
              'rgba(16, 185, 129, 0.8)', // Completed - Green
              'rgba(239, 68, 68, 0.8)', // Failed - Red
              'rgba(139, 92, 246, 0.8)'  // Delayed - Purple
            ],
            borderColor: [
              'rgba(251, 191, 36, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(139, 92, 246, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: chartOptions
      });

      // Overall Chart
      overallChart.current = new Chart(overallChartRef.current, {
        type: 'pie',
        data: {
          labels: ['Completed', 'Failed', 'Active', 'Queued'],
          datasets: [{
            data: [overall.completed, overall.failed, overall.active, overall.queued],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)', // Completed - Green
              'rgba(239, 68, 68, 0.8)', // Failed - Red
              'rgba(59, 130, 246, 0.8)', // Active - Blue
              'rgba(251, 191, 36, 0.8)'  // Queued - Yellow
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(251, 191, 36, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: chartOptions
      });

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing job statistics charts:', error);
      cleanup();
    }
  }, [queue, overall, cleanup]);

  // Update chart data without re-creating charts
  const updateCharts = useCallback(() => {
    if (!queue || !overall || !isInitialized.current) return;

    try {
      if (queueChart.current) {
        queueChart.current.data.datasets[0].data = [
          queue.waiting,
          queue.active,
          queue.completed,
          queue.failed,
          queue.delayed
        ];
        queueChart.current.update('none');
      }

      if (overallChart.current) {
        overallChart.current.data.datasets[0].data = [
          overall.completed,
          overall.failed,
          overall.active,
          overall.queued
        ];
        overallChart.current.update('none');
      }
    } catch (error) {
      console.error('Error updating job statistics charts:', error);
    }
  }, [queue, overall]);

  // Initialize charts on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeCharts();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeCharts, cleanup]);

  // Update charts when data changes
  useEffect(() => {
    if (isInitialized.current) {
      updateCharts();
    }
  }, [queue, overall, updateCharts]);

  if (!queue || !overall) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex items-center">
            <div className="w-8 h-8 bg-indigo-200 rounded-full mr-3"></div>
            <span className="text-slate-600">Loading job statistics...</span>
          </div>
        </div>
      </div>
    );
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
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl mr-3 shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Job Statistics</h2>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Queue Status */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Current Queue</h3>
          <div className="relative h-48 mb-4">
            <canvas ref={queueChartRef} width="200" height="200"></canvas>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Total</div>
              <div className="font-bold text-slate-800">{queue.total}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Active</div>
              <div className="font-bold text-blue-600">{queue.active}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Waiting</div>
              <div className="font-bold text-yellow-600">{queue.waiting}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Delayed</div>
              <div className="font-bold text-purple-600">{queue.delayed}</div>
            </div>
          </div>
        </div>
        
        {/* Overall Statistics */}
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-700 mb-4">Overall Stats</h3>
          <div className="relative h-48 mb-4">
            <canvas ref={overallChartRef} width="200" height="200"></canvas>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Total</div>
              <div className="font-bold text-slate-800">{overall.total}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Completed</div>
              <div className="font-bold text-green-600">{overall.completed}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Failed</div>
              <div className="font-bold text-red-600">{queue.failed}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Avg Duration</div>
              <div className="font-bold text-slate-800">{formatDuration(overall.avgDuration)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobStatistics;
