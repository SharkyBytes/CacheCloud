import React, { useRef, useEffect, useCallback } from 'react';
import Chart from 'chart.js/auto';

const UsageCharts = ({ metrics, formatBytes }) => {
  const cpuChartRef = useRef(null);
  const memoryChartRef = useRef(null);
  const cpuChart = useRef(null);
  const memoryChart = useRef(null);
  const isInitialized = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (cpuChart.current) {
      cpuChart.current.destroy();
      cpuChart.current = null;
    }
    if (memoryChart.current) {
      memoryChart.current.destroy();
      memoryChart.current = null;
    }
    isInitialized.current = false;
  }, []);

  // Initialize charts only once
  const initializeCharts = useCallback(() => {
    if (!metrics || !cpuChartRef.current || !memoryChartRef.current || isInitialized.current) {
      return;
    }

    cleanup();

    const chartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '70%',
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
      // CPU Chart
      cpuChart.current = new Chart(cpuChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Available'],
          datasets: [{
            data: [metrics.cpu.usage, 100 - metrics.cpu.usage],
            backgroundColor: [
              'rgba(59, 130, 246, 0.8)',
              'rgba(226, 232, 240, 0.3)'
            ],
            borderColor: [
              'rgba(59, 130, 246, 1)',
              'rgba(226, 232, 240, 0.5)'
            ],
            borderWidth: 2
          }]
        },
        options: chartOptions
      });

      // Memory Chart
      memoryChart.current = new Chart(memoryChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Available'],
          datasets: [{
            data: [metrics.memory.percentUsed, 100 - metrics.memory.percentUsed],
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(226, 232, 240, 0.3)'
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(226, 232, 240, 0.5)'
            ],
            borderWidth: 2
          }]
        },
        options: chartOptions
      });

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing usage charts:', error);
      cleanup();
    }
  }, [metrics, cleanup]);

  // Update chart data without re-creating charts
  const updateCharts = useCallback(() => {
    if (!metrics || !isInitialized.current) return;

    try {
      if (cpuChart.current) {
        cpuChart.current.data.datasets[0].data = [metrics.cpu.usage, 100 - metrics.cpu.usage];
        cpuChart.current.update('none');
      }

      if (memoryChart.current) {
        memoryChart.current.data.datasets[0].data = [metrics.memory.percentUsed, 100 - metrics.memory.percentUsed];
        memoryChart.current.update('none');
      }
    } catch (error) {
      console.error('Error updating usage charts:', error);
    }
  }, [metrics]);

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
  }, [metrics?.cpu?.usage, metrics?.memory?.percentUsed, updateCharts]);

  if (!metrics) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex items-center">
            <div className="w-8 h-8 bg-indigo-200 rounded-full mr-3"></div>
            <span className="text-slate-600">Loading usage charts...</span>
          </div>
        </div>
      </div>
    );
  }

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'text-emerald-600';
    if (percentage < 80) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-xl mr-3 shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">Resource Usage</h2>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* CPU Usage */}
        <div className="text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700">CPU Usage</h3>
            <span className={`text-xl font-bold ${getUsageColor(metrics.cpu.usage)}`}>
              {metrics.cpu.usage.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-40 mb-4">
            <canvas ref={cpuChartRef} width="200" height="200"></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getUsageColor(metrics.cpu.usage)}`}>
                  {metrics.cpu.usage.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">CPU</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Used</div>
              <div className="font-bold text-blue-600">{metrics.cpu.usage.toFixed(1)}%</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Available</div>
              <div className="font-bold text-slate-600">{(100 - metrics.cpu.usage).toFixed(1)}%</div>
            </div>
          </div>
        </div>

        {/* Memory Usage */}
        <div className="text-center">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-700">Memory Usage</h3>
            <span className={`text-xl font-bold ${getUsageColor(metrics.memory.percentUsed)}`}>
              {metrics.memory.percentUsed.toFixed(1)}%
            </span>
          </div>
          <div className="relative h-40 mb-4">
            <canvas ref={memoryChartRef} width="200" height="200"></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getUsageColor(metrics.memory.percentUsed)}`}>
                  {metrics.memory.percentUsed.toFixed(1)}%
                </div>
                <div className="text-xs text-slate-500">Memory</div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Used</div>
              <div className="font-bold text-emerald-600">{formatBytes(metrics.memory.total - metrics.memory.free)}</div>
            </div>
            <div className="bg-slate-50 rounded-lg p-2">
              <div className="text-slate-600">Free</div>
              <div className="font-bold text-slate-600">{formatBytes(metrics.memory.free)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UsageCharts;