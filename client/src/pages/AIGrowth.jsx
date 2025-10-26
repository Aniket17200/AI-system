import React, { useState, useEffect } from "react";
import { format } from "date-fns";
import axiosInstance from "../axios";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { PulseLoader } from "react-spinners";
import DateRangeSelector from "../components/DateRangeSelector";

const AIGrowth = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [predictionsData, setPredictionsData] = useState(null);
  const [dashboardData, setDashboardData] = useState(null);
  const [dateRange, setDateRange] = useState(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 29);
    return { startDate, endDate };
  });
  const [showDateSelector, setShowDateSelector] = useState(false);

  useEffect(() => {
    fetchData();
  }, [dateRange]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const startDateString = format(dateRange.startDate, "yyyy-MM-dd");
      const endDateString = format(dateRange.endDate, "yyyy-MM-dd");
      const userId = localStorage.getItem("userId");

      const [predictionsRes, dashboardRes] = await Promise.all([
        axiosInstance.get("/data/predictions", {
          params: { startDate: startDateString, endDate: endDateString, userId }
        }),
        axiosInstance.get("/data/dashboard", {
          params: { startDate: startDateString, endDate: endDateString, userId }
        })
      ]);

      setPredictionsData(predictionsRes.data);
      setDashboardData(dashboardRes.data);
    } catch (err) {
      setError("Failed to load AI predictions. Please try again later.");
      console.error('AI Growth fetch error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = (range) => {
    setDateRange({ startDate: range.startDate, endDate: range.endDate });
    setShowDateSelector(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={15} color="#12EB8E" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <div className="text-red-500 text-xl">{error}</div>
      </div>
    );
  }

  const { predictions, insights, confidence } = predictionsData;
  const financialData = dashboardData?.financialsBreakdownData?.pieData || [];

  const formatCurrency = (value) => `₹${Math.round(value).toLocaleString('en-IN')}`;
  
  const getGrowthColor = (value) => {
    if (value > 5) return 'text-green-400';
    if (value < -5) return 'text-red-400';
    return 'text-gray-400';
  };

  const getInsightIcon = (type) => {
    switch (type) {
      case 'positive': return '✅';
      case 'warning': return '⚠️';
      default: return 'ℹ️';
    }
  };

  const getInsightColor = (type) => {
    switch (type) {
      case 'positive': return 'border-green-500 bg-green-500/10';
      case 'warning': return 'border-yellow-500 bg-yellow-500/10';
      default: return 'border-blue-500 bg-blue-500/10';
    }
  };

  // Prepare actual vs predicted data for chart
  const actualVsPredictedData = predictions.next7Days.dailyBreakdown.map((day, index) => ({
    day: `Day ${day.day}`,
    actual: predictions.current.revenue,
    predicted: day.revenue / 1000 // Convert to thousands
  }));

  // Prepare monthly financial breakdown
  const monthlyFinancialData = [
    {
      month: format(dateRange.startDate, 'MMM'),
      cogs: financialData.find(f => f.name === 'COGS')?.value || 0,
      grossProfit: financialData.find(f => f.name === 'Gross Profit')?.value || 0,
      operatingCosts: (financialData.find(f => f.name === 'Ad Spend')?.value || 0) + 
                      (financialData.find(f => f.name === 'Shipping')?.value || 0),
      netProfit: financialData.find(f => f.name === 'Net Profit')?.value || 0,
      netMargin: predictions.current.profitMargin
    }
  ];

  const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6'];

  return (
    <div className="min-h-screen bg-[#0D1D1E] text-white p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">🤖 AI-Powered Growth Dashboard</h1>
          <p className="text-gray-400">Predictive analytics and actionable insights</p>
        </div>
        <div className="flex items-center gap-4 relative">
          <div className="text-sm text-gray-400">
            Confidence: <span className="text-white font-bold">{confidence}%</span>
          </div>
          <button
            onClick={() => setShowDateSelector(!showDateSelector)}
            className="px-3 py-1 rounded-md text-sm border bg-[#161616] border-gray-700"
          >
            {`${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`}
          </button>
          {showDateSelector && (
            <div className="absolute top-full mt-2 right-0 z-50 bg-[#161616] rounded-lg shadow-lg border border-gray-700">
              <DateRangeSelector onApply={handleApply} initialRange={dateRange} />
            </div>
          )}
        </div>
      </div>

      {/* Actual vs. Predicted Revenue Chart */}
      <div className="bg-[#00131C] rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">Actual vs. Predicted Revenue (in thousands)</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={actualVsPredictedData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="day" stroke="#9CA3AF" />
            <YAxis stroke="#9CA3AF" />
            <Tooltip 
              contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
              formatter={(value) => `₹${value.toLocaleString('en-IN')}K`}
            />
            <Legend />
            <Line type="monotone" dataKey="actual" stroke="#10B981" strokeWidth={2} name="Actual" />
            <Line type="monotone" dataKey="predicted" stroke="#3B82F6" strokeWidth={2} name="Predicted" strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Upcoming Events */}
        <div className="bg-[#00131C] rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">📅 Upcoming Events</h3>
          <div className="space-y-3">
            <div className="bg-[#161616] p-3 rounded-lg">
              <div className="text-sm text-gray-400">Next 7 Days</div>
              <div className="text-lg font-bold">{predictions.next7Days.orders} Orders Expected</div>
            </div>
            <div className="bg-[#161616] p-3 rounded-lg">
              <div className="text-sm text-gray-400">Revenue Forecast</div>
              <div className="text-lg font-bold">{formatCurrency(predictions.next7Days.revenue)}</div>
            </div>
            <div className="bg-[#161616] p-3 rounded-lg">
              <div className="text-sm text-gray-400">Profit Projection</div>
              <div className="text-lg font-bold">{formatCurrency(predictions.next7Days.profit)}</div>
            </div>
          </div>
        </div>

        {/* Actionable Insights */}
        <div className="bg-[#00131C] rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">💡 Actionable Insights</h3>
          <div className="space-y-3">
            {insights.slice(0, 3).map((insight, index) => (
              <div key={index} className="bg-[#161616] p-3 rounded-lg">
                <div className="flex items-start gap-2">
                  <span className="text-lg">{getInsightIcon(insight.type)}</span>
                  <div>
                    <div className="font-bold text-sm">{insight.metric}</div>
                    <div className="text-xs text-gray-400 mt-1">{insight.recommendation}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Financial Breakdown Pie */}
        <div className="bg-[#00131C] rounded-2xl p-6">
          <h3 className="text-xl font-bold mb-4">📊 Financial Breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={financialData}
                cx="50%"
                cy="50%"
                outerRadius={70}
                dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
              >
                {financialData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip formatter={(value) => formatCurrency(value)} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Monthly Financial Breakdown Table */}
      <div className="bg-[#00131C] rounded-2xl p-6 mb-6">
        <h3 className="text-xl font-bold mb-4">📈 Monthly Financial Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left p-3">Month</th>
                <th className="text-right p-3">COGS</th>
                <th className="text-right p-3">Gross Profit</th>
                <th className="text-right p-3">Operating Costs</th>
                <th className="text-right p-3">Net Profit</th>
                <th className="text-right p-3">Net Margin</th>
              </tr>
            </thead>
            <tbody>
              {monthlyFinancialData.map((row, index) => (
                <tr key={index} className="border-b border-gray-800">
                  <td className="p-3">{row.month}</td>
                  <td className="text-right p-3">{formatCurrency(row.cogs)}</td>
                  <td className="text-right p-3 text-green-400">{formatCurrency(row.grossProfit)}</td>
                  <td className="text-right p-3">{formatCurrency(row.operatingCosts)}</td>
                  <td className="text-right p-3 text-green-400 font-bold">{formatCurrency(row.netProfit)}</td>
                  <td className="text-right p-3">{row.netMargin.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detailed AI Insights */}
      <div className="bg-[#00131C] rounded-2xl p-6">
        <h3 className="text-xl font-bold mb-4">🎯 Detailed AI Insights & Recommendations</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {insights.map((insight, index) => (
            <div 
              key={index}
              className={`rounded-xl p-5 border-2 ${getInsightColor(insight.type)}`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">{getInsightIcon(insight.type)}</div>
                <div className="flex-1">
                  <div className="font-bold text-lg mb-2">{insight.metric}</div>
                  <div className="text-gray-300 mb-3 text-sm">{insight.message}</div>
                  <div className="bg-black/30 rounded-lg p-3 border border-gray-600">
                    <div className="text-xs text-gray-400 mb-1">💡 Recommendation:</div>
                    <div className="text-sm">{insight.recommendation}</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AIGrowth;
