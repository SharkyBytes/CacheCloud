import React, { useRef, useEffect, useCallback } from 'react';
import Chart from 'chart.js/auto';

const JobStatistics = ({ statistics, formatDuration }) => {
  const jobsChartRef = useRef(null);
  const jobsChart = useRef(null);
  const isInitialized = useRef(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    if (jobsChart.current) {
      jobsChart.current.destroy();
      jobsChart.current = null;
    }
    isInitialized.current = false;
  }, []);

  // Initialize chart only once
  const initializeChart = useCallback(() => {
    if (!statistics || !jobsChartRef.current || isInitialized.current) {
      return;
    }

    cleanup();

    try {
      jobsChart.current = new Chart(jobsChartRef.current, {
        type: 'doughnut',
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
              'rgba(16, 185, 129, 0.8)', // Completed - Green
              'rgba(239, 68, 68, 0.8)', // Failed - Red
              'rgba(59, 130, 246, 0.8)', // Active - Blue
              'rgba(245, 158, 11, 0.8)'  // Queued - Yellow
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(245, 158, 11, 1)'
            ],
            borderWidth: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '60%',
          plugins: {
            legend: {
              display: false
            }
          },
          animation: {
            duration: 0 // Disable animations
          }
        }
      });

      isInitialized.current = true;
    } catch (error) {
      console.error('Error initializing job statistics chart:', error);
      cleanup();
    }
  }, [statistics, cleanup]);

  // Update chart data without re-creating chart
  const updateChart = useCallback(() => {
    if (!statistics || !isInitialized.current) return;

    try {
      if (jobsChart.current) {
        jobsChart.current.data.datasets[0].data = [
          statistics.overall.completed,
          statistics.overall.failed,
          statistics.overall.active,
          statistics.overall.queued
        ];
        jobsChart.current.update('none');
      }
    } catch (error) {
      console.error('Error updating job statistics chart:', error);
    }
  }, [statistics]);

  // Initialize chart on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      initializeChart();
    }, 100);

    return () => {
      clearTimeout(timer);
      cleanup();
    };
  }, [initializeChart, cleanup]);

  // Update chart when data changes
  useEffect(() => {
    if (isInitialized.current) {
      updateChart();
    }
  }, [statistics, updateChart]);

  if (!statistics) {
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

  const successRate = statistics.overall.total > 0
    ? ((statistics.overall.completed / statistics.overall.total) * 100).toFixed(1)
    : 0;

  const jobStats = [
    { label: 'Completed', value: statistics.overall.completed, color: 'bg-emerald-500', textColor: 'text-emerald-600' },
    { label: 'Failed', value: statistics.overall.failed, color: 'bg-red-500', textColor: 'text-red-600' },
    { label: 'Active', value: statistics.overall.active, color: 'bg-blue-500', textColor: 'text-blue-600' },
    { label: 'Queued', value: statistics.overall.queued, color: 'bg-amber-500', textColor: 'text-amber-600' }
  ];

  return (
    <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-xl transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-r from-violet-500 to-purple-600 rounded-xl mr-3 shadow-lg">
            <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-slate-800">Job Statistics</h2>
        </div>
        <div className="text-sm text-slate-600">
          {statistics.overall.total} Total Jobs
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Section */}
        <div className="text-center">
          <div className="relative h-48 mb-4">
            <canvas ref={jobsChartRef} width="200" height="200"></canvas>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-800">{statistics.overall.total}</div>
                <div className="text-xs text-slate-500">Total Jobs</div>
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="grid grid-cols-2 gap-2">
            {jobStats.map((stat, index) => (
              <div key={index} className="flex items-center justify-between bg-slate-50 rounded-lg p-2">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full ${stat.color} mr-2`}></div>
                  <span className="text-sm text-slate-600">{stat.label}</span>
                </div>
                <span className={`text-sm font-semibold ${stat.textColor}`}>{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Metrics Section */}
        <div className="space-y-4">
          {/* Performance Metrics */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-slate-700 mb-3">Performance</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Average Duration</span>
                <span className="font-semibold text-slate-800">{formatDuration(statistics.overall.avgDuration)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600">Success Rate</span>
                <span className={`font-semibold ${successRate >= 80 ? 'text-emerald-600' : successRate >= 60 ? 'text-amber-600' : 'text-red-600'}`}>
                  {successRate}%
                </span>
              </div>
            </div>
          </div>

          {/* Current Status */}
          <div className="bg-slate-50 rounded-xl p-4">
            <h4 className="text-lg font-semibold text-slate-700 mb-3">Current Status</h4>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                  <span className="text-slate-600">Active Jobs</span>
                </div>
                <span className="font-semibold text-blue-600">{statistics.overall.active}</span>
              </div>
              <div className="flex justify-between items-center">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-amber-500 rounded-full mr-2"></div>
                  <span className="text-slate-600">Queued Jobs</span>
                </div>
                <span className="font-semibold text-amber-600">{statistics.overall.queued}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default JobStatistics;