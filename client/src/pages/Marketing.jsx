import React, { useState, useEffect } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  Line,
  CartesianGrid,
  Cell,
} from "recharts";
import { subDays } from "date-fns";
import { PulseLoader } from "react-spinners";
import axiosInstance from "../../axios";
import { toast } from "react-toastify";
import DateRangeSelector from "../components/DateRangeSelector";
const toISTDateString = (date) => {
  // Convert to YYYY-MM-DD format in local timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}; 
const Marketing = () => {
  const [adsSummaryData, setAdsSummaryData] = useState([]);
  const [metaCampaignMetrics, setMetaCampaignMetrics] = useState({});
  const [campaigns, setCampaigns] = useState([]); // Individual campaigns array
  const [spendData, setSpendData] = useState([]);
  const [metaAdsData, setMetaAdsData] = useState([]);
  const [detailedAnalysisData, setDetailedAnalysisData] = useState([]);

  const [campaignFilter, setCampaignFilter] = useState("Best");
  const [selectedCampaign, setSelectedCampaign] = useState("Campaign 1");
  // Set default date range to cover the data period (July 27 - Oct 25, 2025)
  const [dateRange, setDateRange] = useState({
    startDate: new Date('2025-07-27'),
    endDate: new Date('2025-10-25'),
  });
  const [showDateSelector, setShowDateSelector] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Get metrics for selected campaign from campaigns array or fallback to campaignMetrics
  const selectedCampaignData = campaigns.find(c => c.campaignName === selectedCampaign);
  const metrics = selectedCampaignData || metaCampaignMetrics[selectedCampaign] || {};
  
  // Debug logging
  useEffect(() => {
    if (selectedCampaign) {
      console.log("Selected campaign:", selectedCampaign);
      console.log("Campaign data found:", !!selectedCampaignData);
      console.log("Metrics:", metrics);
    }
  }, [selectedCampaign, selectedCampaignData, metrics]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const startDateStr = toISTDateString(dateRange.startDate);
        const endDateStr = toISTDateString(dateRange.endDate);
        
        console.log("Fetching marketing data:", {
          startDate: startDateStr,
          endDate: endDateStr
        });
        
        const res = await axiosInstance.get("/data/marketingData", {
          params: {
            startDate: startDateStr,
            endDate: endDateStr,
          },
        });
        
        // Check if response has data
        if (!res.data) {
          throw new Error("No data received from server");
        }
        
        const {
          summary,
          campaigns: campaignsArray,
          campaignMetrics,
          spendChartData,
          adsChartData,
          analysisTable,
        } = res.data;
        
        console.log("Marketing data received:", {
          summaryLength: summary?.length,
          campaignsCount: campaignsArray?.length || 0,
          chartDataLength: spendChartData?.length,
          dateRange: { startDate: startDateStr, endDate: endDateStr }
        });

        // Fallback to empty objects/arrays if data is missing
        setAdsSummaryData(summary || []);
        setCampaigns(campaignsArray || []); // Store campaigns array
        setMetaCampaignMetrics(campaignMetrics || {});
        setSpendData(spendChartData || []);
        setMetaAdsData(adsChartData || []);
        setDetailedAnalysisData(analysisTable || []);
        
        // Set selected campaign - prefer campaigns array, fallback to "All Campaigns"
        const firstCampaign = campaignsArray?.[0]?.campaignName || "All Campaigns";
        console.log("Setting selected campaign to:", firstCampaign);
        console.log("Available campaigns:", campaignsArray?.length || 0);
        if (campaignsArray?.length > 0) {
          console.log("First 5 campaigns:", campaignsArray.map(c => c.campaignName).slice(0, 5));
        }
        setSelectedCampaign(firstCampaign);
        
        setLoading(false);
      } catch (err) {
        console.error("Error fetching marketing data:", err);
        console.error("Error details:", {
          message: err.message,
          response: err.response?.data,
          status: err.response?.status
        });
        
        const errorMessage = err.response?.data?.error || err.message || "Error fetching data";
        toast.error(`Error: ${errorMessage}`);
        setLoading(false);
      }
    };
    fetchData();
  }, [dateRange]);

  const sortedMetaAdsData = [...metaAdsData].sort((a, b) => {
    return campaignFilter === "Best" ? b.value - a.value : a.value - b.value;
  });

  const handleBarClick = (data) => {
    console.log("Bar clicked:", data.name);
    // Check if campaign exists in campaigns array or campaignMetrics
    const campaignExists = campaigns.some(c => c.campaignName === data.name) || metaCampaignMetrics[data.name];
    console.log("Campaign exists:", campaignExists);
    if (campaignExists) {
      console.log("Setting selected campaign to:", data.name);
      setSelectedCampaign(data.name);
    } else {
      console.warn("Campaign not found:", data.name);
    }
  };

  const handleApply = (range) => {
    console.log("Selected range:", range);
    setDateRange(range);
    setShowDateSelector(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#0D1D1E]">
        <PulseLoader size={15} color="#12EB8E" />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 text-white space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-2xl font-bold">Marketing Dashboard</h1>
          <p className="text-sm text-white">
            Overall Data like the main dashboard starting
          </p>
        </div>
        <div className="flex items-center gap-4 relative">
          <button
            onClick={() => setShowDateSelector(!showDateSelector)}
            className="px-3 py-1 rounded-md text-sm border bg-[#161616] border-gray-700"
          >
            {dateRange
              ? `${dateRange.startDate.toLocaleDateString()} - ${dateRange.endDate.toLocaleDateString()}`
              : "Select Date Range"}
          </button>

          {showDateSelector && (
            <div className="absolute top-full mt-2 z-50 right-0 bg-[#161616] rounded-lg shadow-lg border border-gray-700 parentz">
              <DateRangeSelector onApply={handleApply} />
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-8">
        {adsSummaryData.map(([title, value]) => (
          <div key={title} className="bg-[#161616] p-4 rounded-xl shadow-md">
            <div className="text-sm text-white">{title}</div>
            <div className="text-xl font-bold">{value}</div>
          </div>
        ))}
      </div>

      {/* Campaign Breakdown Button */}
      <button className="border border-gray-500 rounded px-4 py-1 text-xl z-1">
        Campaign Breakdown
      </button>

      {/* Spend, CPP and ROAS Chart */}
      <div className="bg-[#161616] rounded-xl p-4 z-1">
        <h3 className="text-xl font-medium mb-4">Spend, CPP and ROAS</h3>
        <ResponsiveContainer width="100%" height={350}>
          <ComposedChart data={spendData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis
              yAxisId="left"
              stroke="#888"
              tickFormatter={(v) => `${v / 1000}K`}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#888"
              domain={[0, 5]}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161616",
                border: "1px solid #2e2e2e",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                color: "#ffffff",
              }}
              wrapperStyle={{
                zIndex: 1000,
              }}
              cursor={{ fill: "#2e2e2e", opacity: 0.1 }}
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="cpp"
              stackId="a"
              fill="#6a66db"
              name="CPP"
            />
            <Bar
              yAxisId="left"
              dataKey="spend"
              stackId="a"
              fill="#3b82f6"
              name="Spend"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="roas"
              stroke="#ffffff"
              strokeWidth={2}
              name="ROAS"
              dot={{ r: 5 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Detailed Analysis Table */}
      <div className="bg-[#161616] rounded-xl p-4 z-1">
        <h3 className="text-xl font-medium mb-2">
          Detailed Analysis
          {campaigns.length > 0 && (
            <span className="text-sm text-gray-400 ml-2">
              ({campaigns.length} campaigns)
            </span>
          )}
        </h3>

        {/* container scrolls in both X and Y if needed, capped at 80 (20rem) high */}
        <div className="overflow-auto max-h-80">
          {campaigns.length > 0 ? (
            <table className="min-w-full text-md">
              <thead className="text-white sticky top-0 bg-[#161616]">
                <tr>
                  <th className="text-left p-2">Campaign</th>
                  <th className="text-left p-2">Spend</th>
                  <th className="text-left p-2">CPC</th>
                  <th className="text-left p-2">ROAS</th>
                  <th className="text-left p-2">Sales</th>
                  <th className="text-left p-2">Performing Well</th>
                </tr>
              </thead>
              <tbody>
                {campaigns.length > 0 ? (
                campaigns.map((campaign, idx) => (
                  <tr 
                    key={idx} 
                    className={`border-t border-gray-700 cursor-pointer hover:bg-gray-800 transition-colors ${
                      selectedCampaign === campaign.campaignName ? 'bg-gray-800' : ''
                    }`}
                    onClick={() => {
                      console.log("Table row clicked:", campaign.campaignName);
                      setSelectedCampaign(campaign.campaignName);
                    }}
                  >
                    <td className="p-2">{campaign.campaignName}</td>
                    <td className="p-2">
                      ₹{parseFloat(campaign.amountSpent).toLocaleString('en-IN', {minimumFractionDigits: 2})}
                    </td>
                    <td className="p-2">
                      ₹{campaign.cpc}
                    </td>
                    <td className="p-2">
                      {campaign.roas}
                    </td>
                    <td className="p-2">
                      ₹{campaign.sales}
                    </td>
                    <td
                      className={`p-2 ${
                        parseFloat(campaign.roas) >= 5
                          ? "text-green-400"
                          : parseFloat(campaign.roas) >= 3
                          ? "text-yellow-400"
                          : "text-red-400"
                      }`}
                    >
                      {parseFloat(campaign.roas) >= 5
                        ? "Performing Well"
                        : parseFloat(campaign.roas) >= 3
                        ? "Average"
                        : "Poor"}
                    </td>
                  </tr>
                ))
                ) : null}
              </tbody>
            </table>
          ) : (
            <div className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <p className="text-lg font-medium">No Individual Campaign Data Available</p>
                <p className="text-sm mt-2">
                  Campaign-level details are not available for this date range.
                  <br />
                  Showing aggregated metrics for all campaigns below.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Meta Ads Campaigns Chart with Filter and Sorting */}
      <div className="bg-[#161616] rounded-xl p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-medium">Meta Ads Campaigns</h3>
          <select
            value={campaignFilter}
            onChange={(e) => setCampaignFilter(e.target.value)}
            className="bg-[#202020] text-white text-sm px-3 py-1 rounded border border-gray-700"
          >
            <option value="Best">Best Performing</option>
            <option value="Least">Least Performing</option>
          </select>
        </div>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={sortedMetaAdsData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
            <XAxis dataKey="name" stroke="#888" />
            <YAxis stroke="#888" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#161616",
                border: "1px solid #2e2e2e",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.4)",
                color: "#ffffff",
              }}
              wrapperStyle={{
                zIndex: 1000,
              }}
              cursor={{ fill: "#2e2e2e", opacity: 0.1 }}
            />
            <Bar
              dataKey="value"
              fill="#5488d8"
              onClick={handleBarClick}
              isAnimationActive={false}
            >
              {sortedMetaAdsData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.name === selectedCampaign ? "#22c55e" : "#5488d8"}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Summary Metrics */}
      <h3 className="text-xl mb-2 text-white">
        {selectedCampaign
          ? `${selectedCampaign} Breakdown`
          : "All Campaigns Overview"}
      </h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-md text-gray-200">
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">Amount Spent</p>
          <h4 className="text-lg font-semibold">
            {metrics.amountSpent 
              ? `₹${parseFloat(metrics.amountSpent).toLocaleString('en-IN', {minimumFractionDigits: 2})}`
              : "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">Impressions</p>
          <h4 className="text-lg font-semibold">
            {metrics.impressions?.toLocaleString('en-IN') || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">CPM</p>
          <h4 className="text-lg font-semibold">
            {metrics.cpm ? `₹${metrics.cpm}` : "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">CTR</p>
          <h4 className="text-lg font-semibold">
            {metrics.ctr || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">Clicks</p>
          <h4 className="text-lg font-semibold">
            {metrics.clicks?.toLocaleString('en-IN') || metrics.linkClicks?.toLocaleString('en-IN') || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">CPC</p>
          <h4 className="text-lg font-semibold">
            {metrics.cpc ? `₹${metrics.cpc}` : metrics.costPerClick || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">Sales</p>
          <h4 className="text-lg font-semibold">
            {metrics.sales ? `₹${metrics.sales}` : "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">CPS</p>
          <h4 className="text-lg font-semibold">
            {metrics.cps ? `₹${metrics.cps}` : metrics.costPerSale || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">ROAS</p>
          <h4
            className={`text-lg font-semibold ${
              parseFloat(metrics.roas || 0) < 3 ? "text-red-400" : "text-green-400"
            }`}
          >
            {metrics.roas || "N/A"}
          </h4>
        </div>
        <div className="bg-[#161616] rounded-xl p-6">
          <p className="text-white">Total Sales</p>
          <h4 className="text-lg font-semibold">
            {metrics.totalSales ? `₹${metrics.totalSales}` : "N/A"}
          </h4>
        </div>
      </div>
    </div>
  );
};

export default Marketing;
