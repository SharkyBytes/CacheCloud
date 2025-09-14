import { useEffect, useRef, useCallback } from 'react';
import Chart from 'chart.js/auto';

const SystemMetrics = ({ cpu, memory, containers }) => {
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
    if (!cpu || !memory || !cpuChartRef.current || !memoryChartRef.current || isInitialized.current) {
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
      cutout: '70%',
      elements: {
        arc: {
          borderWidth: 0
        }
      },
      animation: {
        duration: 0 // Disable animations to prevent infinite loops
      }
    };

    try {
      // CPU Chart
      cpuChart.current = new Chart(cpuChartRef.current, {
        type: 'doughnut',
        data: {
          labels: ['Used', 'Available'],
          datasets: [{
            data: [cpu.usage, 100 - cpu.usage],
            backgroundColor: [
              'rgba(99, 102, 241, 0.8)',
              'rgba(226, 232, 240, 0.3)'
            ],
            borderColor: [
              'rgba(99, 102, 241, 1)',
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
            data: [memory.percentUsed, 100 - memory.percentUsed],
            backgroundColor: [
              'rgba(168, 85, 247, 0.8)',
              'rgba(226, 232, 240, 0.3)'
            ],
            borderColor: [
              'rgba(168, 85, 247, 1)',
              'rgba(226, 232, 240, 0.5)'
            ],
            borderWidth: 2
          }]
        },
        options: chartOptions
      });

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing charts:', error);
      cleanup();
    }
  }, [cpu, memory, cleanup]);

  // Update chart data without re-creating charts
  const updateCharts = useCallback(() => {
    if (!cpu || !memory || !isInitialized.current) return;

    try {
      if (cpuChart.current) {
        cpuChart.current.data.datasets[0].data = [cpu.usage, 100 - cpu.usage];
        cpuChart.current.update('none'); // Update without animation
      }

      if (memoryChart.current) {
        memoryChart.current.data.datasets[0].data = [memory.percentUsed, 100 - memory.percentUsed];
        memoryChart.current.update('none'); // Update without animation
      }
    } catch (error) {
      console.error('Error updating charts:', error);
    }
  }, [cpu, memory]);

  // Initialize charts on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeCharts();
    }, 100); // Small delay to ensure DOM is ready

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
  }, [cpu?.usage, memory?.percentUsed, updateCharts]);

  if (!cpu || !memory || !containers) {
    return (
      <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20">
        <div className="flex items-center justify-center h-48">
          <div className="animate-pulse flex items-center">
            <div className="w-8 h-8 bg-indigo-200 rounded-full mr-3"></div>
            <span className="text-slate-600">Loading system metrics...</span>
          </div>
        </div>
      </div>
    );
  }

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getUsageColor = (percentage) => {
    if (percentage < 50) return 'text-emerald-600';
    if (percentage < 80) return 'text-amber-600';
    return 'text-red-600';
  };

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center mb-6">
        <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl mr-3 shadow-lg">
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-slate-800">System Metrics</h2>
      </div>
      
      {/* Charts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* CPU Chart */}
        <div className="text-center">
          <div className="relative h-40 mb-4">
            <canvas ref={cpuChartRef} width="200" height="200"></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getUsageColor(cpu.usage)}`}>
                  {cpu.usage}%
                </div>
                <div className="text-xs text-slate-500">CPU</div>
              </div>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Cores:</span>
              <span className="font-semibold text-slate-800">{cpu.cores}</span>
            </div>
          </div>
        </div>
        
        {/* Memory Chart */}
        <div className="text-center">
          <div className="relative h-40 mb-4">
            <canvas ref={memoryChartRef} width="200" height="200"></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className={`text-2xl font-bold ${getUsageColor(memory.percentUsed)}`}>
                  {memory.percentUsed}%
                </div>
                <div className="text-xs text-slate-500">Memory</div>
              </div>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-600">Used:</span>
              <span className="font-semibold text-slate-800">{formatBytes(memory.used)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Total:</span>
              <span className="font-semibold text-slate-800">{formatBytes(memory.total)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Container Usage */}
      <div className="border-t border-slate-200/50 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-slate-800">Container Usage</h3>
          <span className="text-sm text-slate-600">
            {containers.active} / {containers.max}
          </span>
        </div>
        
        <div className="relative">
          <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${Math.min((containers.active / containers.max) * 100, 100)}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-xs text-slate-500">
            <span>0</span>
            <span>{Math.round((containers.active / containers.max) * 100)}% utilized</span>
            <span>{containers.max}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemMetrics;
