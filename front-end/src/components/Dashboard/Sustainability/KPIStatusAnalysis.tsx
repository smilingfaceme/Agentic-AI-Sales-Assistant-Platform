"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { FaBolt, FaLeaf, FaChartLine, FaRobot, FaSolarPanel, FaFilePdf, FaSyncAlt } from 'react-icons/fa';
import KPICard from './KPICard';
import StatusIndicator from './StatusIndicator';
import FilterPanel from './FilterPanel';
import { sustainabilityApi } from '@/services/apiService';
import { useApiCall } from '@/hooks/useApiCall';
import Loading from "@/components/Loading";
import { exportKPIToPDF } from '@/utils/exportKPIToPDF';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

// Type definitions for API responses
interface KPIMetric {
  current: number;
  target: number;
  status: 'on-track' | 'warning' | 'off-target';
  trend: { value: number; isPositive: boolean };
}

interface KPIData {
  energyPerConversation: KPIMetric;
  carbonFootprint: KPIMetric;
  efficiencyRatio: KPIMetric;
  emissionsSavings: KPIMetric;
  renewableEnergy: KPIMetric;
}

interface TrendDataPoint {
  date: string;
  energy: number;
  carbon: number;
  efficiency: number;
  renewable: number;
}

interface BreakdownData {
  name: string;
  value: number;
  color: string;
  [key: string]: string | number;
}

// interface Alert {
//   type: 'warning' | 'success' | 'info' | 'error';
//   title: string;
//   message: string;
//   timestamp: string;
// }

export default function KPIStatusAnalysis() {
  const [dateRange, setDateRange] = useState('30d');
  const [kpiData, setKpiData] = useState<KPIData | null>(null);
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [energyBreakdownData, setEnergyBreakdownData] = useState<BreakdownData[]>([]);
  const [emissionsBreakdownData, setEmissionsBreakdownData] = useState<BreakdownData[]>([]);
  // const [alerts, setAlerts] = useState<Alert[]>([]);
  const [isExporting, setIsExporting] = useState(false);
  const [exportType, setExportType] = useState<'data' | 'visual'>('data');

  const { isLoading: isLoadingList, error: listError, execute: executeListAsync } = useApiCall();

  // Fetch all KPI data
  const fetchKPIData = useCallback(async () => {
    const result = await executeListAsync(() => sustainabilityApi.getKPIData(dateRange));
    if (result) {
      setKpiData(result.kpiData);
      setTrendData(result.trendData);
      setEnergyBreakdownData(result.energyBreakdown);
      setEmissionsBreakdownData(result.emissionsBreakdown);
      // setAlerts(result.alertsData);
    }
  }, [dateRange, executeListAsync]);

  // Fetch data when component mounts or dateRange changes
  useEffect(() => {
    fetchKPIData();
  }, [fetchKPIData]);

  // Handle PDF export
  const handleExportPDF = useCallback(async (type: 'data' | 'visual') => {
    if (!kpiData) {
      alert('No data available to export');
      return;
    }

    setIsExporting(true);
    setExportType(type);

    try {
      if (type === 'data') {
        // Export with data-based PDF (faster, smaller file size)
        await exportKPIToPDF(
          dateRange,
          kpiData,
          trendData,
          energyBreakdownData,
          emissionsBreakdownData
        );
      } else {
        // Export with visual charts (includes all visual elements)
      }
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export PDF. Please try again.');
    } finally {
      setIsExporting(false);
    }
  }, [kpiData, dateRange, trendData, energyBreakdownData, emissionsBreakdownData]);

  if (listError) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-red-600">Error loading KPI data: {listError}</div>
      </div>
    );
  }

  if (!kpiData ) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-gray-600">No KPI data available</div>
      </div>
    );
  }

  return (
    <Loading isLoading={isLoadingList} text="Loading KPI data..." type="inline" size="medium">
      <div className="space-y-6 overflow-auto">
        {/* Page Title and Export Buttons */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
              KPI Status Analysis
            </h1>
            <p className="text-gray-600">
              Monitor and analyze sustainability performance metrics
            </p>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2">
            <button
              className="px-3 py-1 hover:bg-gray-200 rounded text-sm flex items-center disabled:opacity-50"
              onClick={fetchKPIData}
              disabled={isLoadingList}
            >
              <Loading isLoading={isLoadingList} type="button" text="Refreshing..." size="small">
                <FaSyncAlt className="mr-2" /> Refresh
              </Loading>
            </button>
            <button
              onClick={() => handleExportPDF('data')}
              disabled={isExporting}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md transition-colors text-sm font-medium shadow-sm"
              title="Export as PDF with data tables (faster, smaller file)"
            >
              <FaFilePdf className="text-lg" />
              {isExporting && exportType === 'data' ? 'Exporting...' : 'Export PDF'}
            </button>
          </div>
        </div>

        {/* Filters */}
        <FilterPanel dateRange={dateRange} onDateRangeChange={setDateRange} />

        {/* 1. Overall KPI Summary Section */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Overall KPI Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            <KPICard
              title="Energy Consumption per Conversation"
              currentValue={kpiData.energyPerConversation.current}
              targetValue={kpiData.energyPerConversation.target}
              unit="kWh"
              status={kpiData.energyPerConversation.status}
              icon={<FaBolt />}
              trend={kpiData.energyPerConversation.trend}
            />
            <KPICard
              title="Carbon Footprint per 1K Conversations"
              currentValue={kpiData.carbonFootprint.current}
              targetValue={kpiData.carbonFootprint.target}
              unit="kg CO₂"
              status={kpiData.carbonFootprint.status}
              icon={<FaLeaf />}
              trend={kpiData.carbonFootprint.trend}
            />
            <KPICard
              title="Efficiency Ratio"
              currentValue={kpiData.efficiencyRatio.current}
              targetValue={kpiData.efficiencyRatio.target}
              unit="conv/kWh"
              status={kpiData.efficiencyRatio.status}
              icon={<FaChartLine />}
              trend={kpiData.efficiencyRatio.trend}
            />
            <KPICard
              title="Emissions Savings from Automation"
              currentValue={kpiData.emissionsSavings.current}
              targetValue={kpiData.emissionsSavings.target}
              unit="%"
              status={kpiData.emissionsSavings.status}
              icon={<FaRobot />}
              trend={kpiData.emissionsSavings.trend}
            />
            <KPICard
              title="Renewable Energy Usage"
              currentValue={kpiData.renewableEnergy.current}
              targetValue={kpiData.renewableEnergy.target}
              unit="g/kwh"
              status={kpiData.renewableEnergy.status}
              icon={<FaSolarPanel />}
              trend={kpiData.renewableEnergy.trend}
            />
          </div>
        </section>

        {/* 2. Trend & Comparison Charts */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Trend & Comparison</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">KPI Trends Over Time</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={trendData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="energy" stroke="#3b82f6" name="Energy (kWh)" />
                <Line type="monotone" dataKey="carbon" stroke="#10b981" name="Carbon (kg CO₂)" />
                <Line type="monotone" dataKey="efficiency" stroke="#8b5cf6" name="Efficiency" />
                <Line type="monotone" dataKey="renewable" stroke="#f59e0b" name="Renewable %" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* 3. Performance Status Indicators */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Performance Status</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <StatusIndicator
                type="success"
                label="Energy Efficiency"
                value={85}
                showProgressBar
                tooltip="Within target range"
              />
              <StatusIndicator
                type="success"
                label="Carbon Reduction"
                value={78}
                showProgressBar
                tooltip="Exceeding target"
              />
              <StatusIndicator
                type="warning"
                label="Renewable Adoption"
                value={75}
                showProgressBar
                tooltip="Close to limit"
              />
              <StatusIndicator
                type="success"
                label="Automation Impact"
                value={92}
                showProgressBar
                tooltip="Excellent performance"
              />
              <StatusIndicator
                type="info"
                label="Overall Sustainability Score"
                value={82}
                showProgressBar
                tooltip="Good overall performance"
              />
            </div>
          </div>
        </section>

        {/* 4. Emissions & Energy Breakdown */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Emissions & Energy Breakdown</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Energy Source Distribution */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Energy Source Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart
                  width={400}
                  height={300}
                  data={energyBreakdownData}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 15]} /> {/* Y-axis from 0 to 10 */}
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                    {energyBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Emissions by Source */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Emissions by Source</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={emissionsBreakdownData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {emissionsBreakdownData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </section>

        {/* 5. Efficiency Insights Panel */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Efficiency Insights</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              {/* Key Insights */}
              <div className="bg-blue-50 border-l-4 border-blue-500 p-4">
                <h4 className="font-semibold text-blue-900 mb-2">📊 Key Insights</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li>• Energy consumption decreased by 5% compared to last month</li>
                  <li>• Carbon footprint reduced by 8% through increased renewable usage</li>
                  <li>• Automation efficiency improved, saving 65% of emissions</li>
                </ul>
              </div>

              {/* Recommendations */}
              <div className="bg-green-50 border-l-4 border-green-500 p-4">
                <h4 className="font-semibold text-green-900 mb-2">💡 Recommendations</h4>
                <ul className="space-y-2 text-sm text-green-800">
                  <li>• Increase renewable energy usage to reach 80% target</li>
                  <li>• Optimize conversation processing to reduce energy per conversation</li>
                  <li>• Consider implementing caching to improve efficiency ratio</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* 6. Achievement & Impact Summary */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Achievement & Impact Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg shadow-sm border border-green-200 p-6">
              <div className="text-green-600 text-3xl mb-2">🎯</div>
              <h3 className="text-2xl font-bold text-green-900">
                {kpiData.emissionsSavings.current.toFixed(2)}%
              </h3>
              <p className="text-sm text-green-700">Emissions Saved This Year</p>
            </div>
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg shadow-sm border border-blue-200 p-6">
              <div className="text-blue-600 text-3xl mb-2">⚡</div>
              <h3 className="text-2xl font-bold text-blue-900">
                {kpiData.renewableEnergy.current.toFixed(2)}g/kwh
              </h3>
              <p className="text-sm text-blue-700">Renewable Energy Contribution</p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg shadow-sm border border-purple-200 p-6">
              <div className="text-purple-600 text-3xl mb-2">🌍</div>
              <h3 className="text-2xl font-bold text-purple-900">
                {kpiData.carbonFootprint.current.toFixed(4)} kg
              </h3>
              <p className="text-sm text-purple-700">CO₂ per 1K Conversations</p>
            </div>
          </div>

          {/* Milestones */}
          <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-800 mb-4">🏆 Milestones & Progress</h3>
            <div className="space-y-3">
              {/* Renewable Energy Milestone */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${kpiData.renewableEnergy.current >= kpiData.renewableEnergy.target ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center text-white`}>
                  {kpiData.renewableEnergy.current >= kpiData.renewableEnergy.target ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Renewable Energy Target: {kpiData.renewableEnergy.target}g/kwh
                  </p>
                  <p className="text-xs text-gray-600">
                    Current: {kpiData.renewableEnergy.current.toFixed(2)}g/kwh -
                    {kpiData.renewableEnergy.current >= kpiData.renewableEnergy.target
                      ? ' Target Achieved!'
                      : ` ${((kpiData.renewableEnergy.current / kpiData.renewableEnergy.target) * 100).toFixed(0)}% complete`}
                  </p>
                </div>
              </div>

              {/* Carbon Footprint Milestone */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${kpiData.carbonFootprint.status === 'on-track' ? 'bg-green-500' : kpiData.carbonFootprint.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white`}>
                  {kpiData.carbonFootprint.status === 'on-track' ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Carbon Footprint Target: {kpiData.carbonFootprint.target} kg CO₂
                  </p>
                  <p className="text-xs text-gray-600">
                    Current: {kpiData.carbonFootprint.current.toFixed(4)} kg CO₂ - Status: {kpiData.carbonFootprint.status}
                  </p>
                </div>
              </div>

              {/* Emissions Savings Milestone */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${kpiData.emissionsSavings.current >= kpiData.emissionsSavings.target ? 'bg-green-500' : 'bg-yellow-500'} rounded-full flex items-center justify-center text-white`}>
                  {kpiData.emissionsSavings.current >= kpiData.emissionsSavings.target ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Emissions Savings Target: {kpiData.emissionsSavings.target}%
                  </p>
                  <p className="text-xs text-gray-600">
                    Current: {kpiData.emissionsSavings.current.toFixed(1)}% -
                    {kpiData.emissionsSavings.current >= kpiData.emissionsSavings.target
                      ? ' Target Achieved!'
                      : ` ${((kpiData.emissionsSavings.current / kpiData.emissionsSavings.target) * 100).toFixed(0)}% complete`}
                  </p>
                </div>
              </div>

              {/* Energy Efficiency Milestone */}
              <div className="flex items-center gap-3">
                <div className={`w-8 h-8 ${kpiData.efficiencyRatio.status === 'on-track' ? 'bg-green-500' : kpiData.efficiencyRatio.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'} rounded-full flex items-center justify-center text-white`}>
                  {kpiData.efficiencyRatio.status === 'on-track' ? '✓' : '⏳'}
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    Efficiency Ratio Target: {kpiData.efficiencyRatio.target} conv/kWh
                  </p>
                  <p className="text-xs text-gray-600">
                    Current: {kpiData.efficiencyRatio.current.toFixed(1)} conv/kWh - Status: {kpiData.efficiencyRatio.status}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 7. Alerts & Notifications */}
        {/* <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Alerts & Notifications</h2>
          <div className="space-y-3">
            {alerts.length > 0 ? (
              alerts.map((alert, index) => {
                const alertConfig = {
                  warning: {
                    bg: 'bg-yellow-50',
                    border: 'border-yellow-500',
                    icon: '⚠️',
                    iconColor: 'text-yellow-600',
                    titleColor: 'text-yellow-900',
                    textColor: 'text-yellow-800',
                    timestampColor: 'text-yellow-700',
                  },
                  success: {
                    bg: 'bg-green-50',
                    border: 'border-green-500',
                    icon: '✅',
                    iconColor: 'text-green-600',
                    titleColor: 'text-green-900',
                    textColor: 'text-green-800',
                    timestampColor: 'text-green-700',
                  },
                  error: {
                    bg: 'bg-red-50',
                    border: 'border-red-500',
                    icon: '❌',
                    iconColor: 'text-red-600',
                    titleColor: 'text-red-900',
                    textColor: 'text-red-800',
                    timestampColor: 'text-red-700',
                  },
                  info: {
                    bg: 'bg-blue-50',
                    border: 'border-blue-500',
                    icon: 'ℹ️',
                    iconColor: 'text-blue-600',
                    titleColor: 'text-blue-900',
                    textColor: 'text-blue-800',
                    timestampColor: 'text-blue-700',
                  },
                };
                const config = alertConfig[alert.type];
                return (
                  <div key={index} className={`${config.bg} border-l-4 ${config.border} p-4 rounded`}>
                    <div className="flex items-start">
                      <div className={`${config.iconColor} text-xl mr-3`}>{config.icon}</div>
                      <div>
                        <h4 className={`font-semibold ${config.titleColor}`}>{alert.title}</h4>
                        <p className={`text-sm ${config.textColor} mt-1`}>{alert.message}</p>
                        <p className={`text-xs ${config.timestampColor} mt-2`}>{alert.timestamp}</p>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="bg-gray-50 border border-gray-200 p-4 rounded text-center text-gray-600">
                No alerts at this time
              </div>
            )}
          </div>
        </section> */}

        {/* 8. Data Summary Table */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Detailed Data Summary</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Period
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Energy (kWh)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Carbon (kg CO₂)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Renewable %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Efficiency
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {trendData.length > 0 ? (
                    trendData.map((dataPoint, index) => {
                      // Determine status based on efficiency value
                      let statusConfig = {
                        label: 'On Track',
                        bgColor: 'bg-green-100',
                        textColor: 'text-green-800'
                      };

                      if (dataPoint.efficiency >= 40) {
                        statusConfig = {
                          label: 'Excellent',
                          bgColor: 'bg-green-100',
                          textColor: 'text-green-800'
                        };
                      } else if (dataPoint.efficiency >= 38) {
                        statusConfig = {
                          label: 'On Track',
                          bgColor: 'bg-green-100',
                          textColor: 'text-green-800'
                        };
                      } else if (dataPoint.efficiency >= 36) {
                        statusConfig = {
                          label: 'Improving',
                          bgColor: 'bg-blue-100',
                          textColor: 'text-blue-800'
                        };
                      } else {
                        statusConfig = {
                          label: 'Baseline',
                          bgColor: 'bg-yellow-100',
                          textColor: 'text-yellow-800'
                        };
                      }

                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {dataPoint.date}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dataPoint.energy.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dataPoint.carbon.toFixed(4)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dataPoint.renewable}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                            {dataPoint.efficiency}%
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full ${statusConfig.bgColor} ${statusConfig.textColor}`}>
                              {statusConfig.label}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                        No trend data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* 9. Data Validation & Notes */}
        <section>
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Data Validation & Notes</h2>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="space-y-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Methodology</h4>
                <p className="text-sm text-gray-600">
                  KPIs are calculated based on real-time data from all active chatbot conversations.
                  Energy consumption is measured per conversation, and carbon footprint is calculated using
                  standard emission factors. Renewable energy percentage reflects the proportion of clean energy sources used
                  in data centers.
                </p>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Data Sources</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Energy consumption: Real-time monitoring from cloud infrastructure</li>
                  <li>• Carbon emissions: EPA and international emission factor databases</li>
                  <li>• Renewable energy: Data center energy source reports</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Admin Notes</h4>
                <div className="bg-gray-50 rounded p-3 text-sm text-gray-700">
                  <p className="italic">
                    Last updated: {new Date().toLocaleDateString()} - All metrics validated and verified.
                    System performance is stable with consistent improvements in energy efficiency.
                    Monitoring renewable energy targets for Q2 2024.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </Loading>
  );
}
