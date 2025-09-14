import React, { useRef, useEffect, useCallback } from 'react';
import Chart from 'chart.js/auto';

const ResourceHistory = ({ cpuHistory, memoryHistory, timeLabels }) => {
  const cpuHistoryRef = useRef(null);
  const memoryHistoryRef = useRef(null);
  const cpuHistoryChart = useRef(null);
  const memoryHistoryChart = useRef(null);
  const isInitialized = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (cpuHistoryChart.current) {
      cpuHistoryChart.current.destroy();
      cpuHistoryChart.current = null;
    }
    if (memoryHistoryChart.current) {
      memoryHistoryChart.current.destroy();
      memoryHistoryChart.current = null;
    }
    isInitialized.current = false;
  }, []);

  // Initialize charts only once
  const initializeCharts = useCallback(() => {
    if (cpuHistory.length === 0 || timeLabels.length === 0 || !cpuHistoryRef.current || !memoryHistoryRef.current || isInitialized.current) {
      return;
    }

    cleanup();

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        intersect: false,
        mode: 'index'
      },
      scales: {
        x: {
          display: false,
          grid: {
            display: false
          }
        },
        y: {
          beginAtZero: true,
          max: 100,
          grid: {
            color: '#f3f4f6'
          },
          ticks: {
            color: '#6b7280',
            font: {
              size: 12
            },
            callback: function(value) {
              return value + '%';
            }
          }
        }
      },
      plugins: {
        legend: {
          display: false
        }
      },
      animation: {
        duration: 0 // Disable animations
      }
    };

    try {
      // CPU History Chart
      cpuHistoryChart.current = new Chart(cpuHistoryRef.current, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'CPU Usage %',
            data: cpuHistory,
            fill: true,
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            borderColor: '#3b82f6',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          }]
        },
        options: chartOptions
      });

      // Memory History Chart
      memoryHistoryChart.current = new Chart(memoryHistoryRef.current, {
        type: 'line',
        data: {
          labels: timeLabels,
          datasets: [{
            label: 'Memory Usage %',
            data: memoryHistory,
            fill: true,
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            borderColor: '#10b981',
            borderWidth: 2,
            tension: 0.4,
            pointRadius: 0,
            pointHoverRadius: 4
          }]
        },
        options: chartOptions
      });

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing resource history charts:', error);
      cleanup();
    }
  }, [cpuHistory, memoryHistory, timeLabels, cleanup]);

  // Update chart data without re-creating charts
  const updateCharts = useCallback(() => {
    if (!isInitialized.current || cpuHistory.length === 0) return;

    try {
      if (cpuHistoryChart.current) {
        cpuHistoryChart.current.data.labels = timeLabels;
        cpuHistoryChart.current.data.datasets[0].data = cpuHistory;
        cpuHistoryChart.current.update('none');
      }

      if (memoryHistoryChart.current) {
        memoryHistoryChart.current.data.labels = timeLabels;
        memoryHistoryChart.current.data.datasets[0].data = memoryHistory;
        memoryHistoryChart.current.update('none');
      }
    } catch (error) {
      console.error('Error updating resource history charts:', error);
    }
  }, [cpuHistory, memoryHistory, timeLabels]);

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
  }, [cpuHistory, memoryHistory, timeLabels, updateCharts]);

  if (cpuHistory.length === 0) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-48">
          <div className="text-center">
            <div className="w-8 h-8 bg-slate-200 rounded-full mx-auto mb-2"></div>
            <span className="text-slate-600">No history data available</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-amber-500 to-orange-600 rounded-xl mr-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Resource History</h2>
        </div>
        <div className="text-sm text-slate-500">
          Last {timeLabels.length} updates
        </div>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-700">CPU Usage Trend</h3>
            <div className="text-2xl font-bold text-blue-600">
              {cpuHistory[cpuHistory.length - 1]?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="h-48">
            <canvas ref={cpuHistoryRef} width="400" height="200"></canvas>
          </div>
        </div>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-700">Memory Usage Trend</h3>
            <div className="text-2xl font-bold text-emerald-600">
              {memoryHistory[memoryHistory.length - 1]?.toFixed(1) || 0}%
            </div>
          </div>
          <div className="h-48">
            <canvas ref={memoryHistoryRef} width="400" height="200"></canvas>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourceHistory;