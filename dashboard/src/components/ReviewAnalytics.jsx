import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, MessageSquareQuote, Calendar } from 'lucide-react';

// Custom Tooltip component defined outside to avoid re-creation on render
const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="analytics-tooltip">
        <p className="tooltip-week">{label}</p>
        <p className="tooltip-reviews">Reviews: {data.reviews}</p>
        <div className="tooltip-themes">
          <p>Top Themes:</p>
          <ul>
            {data.themes.map((theme, i) => (
              <li key={i}>{theme}</li>
            ))}
          </ul>
        </div>
      </div>
    );
  }
  return null;
};

const ReviewAnalytics = ({ selectedWeeks }) => {
  // Mock data for demonstration - in real app, this would come from API
  const analyticsData = [
    { week: '1W', reviews: 245, themes: ['UI Issues', 'Performance', 'Features'] },
    { week: '2W', reviews: 312, themes: ['Performance', 'UI Issues', 'Support'] },
    { week: '4W', reviews: 456, themes: ['Features', 'Performance', 'UI Issues'] },
    { week: '6W', reviews: 523, themes: ['Support', 'Features', 'Performance'] },
    { week: '8W', reviews: 678, themes: ['UI Issues', 'Support', 'Performance'] },
  ];

  const currentWeekData = analyticsData.find(item => item.week === `${selectedWeeks}W`) || analyticsData[4];

  return (
    <div className="analytics-container">
      <div className="analytics-header">
        <div className="analytics-title">
          <TrendingUp size={24} color="#00d09c" />
          <h2>Review Analytics</h2>
        </div>
        <div className="current-selection">
          <Calendar size={16} />
          <span>Current: {selectedWeeks} weeks</span>
        </div>
      </div>

      <div className="analytics-content">
        <div className="analytics-chart">
          <h3>Review Volume Over Time</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={analyticsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="week" 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <YAxis 
                stroke="#94a3b8"
                tick={{ fill: '#94a3b8' }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="reviews" 
                fill="#00d09c"
                radius={[8, 8, 0, 0]}
                opacity={0.8}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="current-week-insights">
          <h3>
            <MessageSquareQuote size={20} color="#e2e8f0" />
            Current Week Insights ({selectedWeeks} weeks)
          </h3>
          
          <div className="insight-cards">
            <div className="insight-card primary">
              <div className="insight-label">Total Reviews</div>
              <div className="insight-value">{currentWeekData.reviews}</div>
            </div>
            
            <div className="insight-card">
              <div className="insight-label">Time Period</div>
              <div className="insight-value">{selectedWeeks} weeks</div>
            </div>
          </div>

          <div className="themes-breakdown">
            <h4>Top 3 Emerging Themes</h4>
            <div className="theme-list">
              {currentWeekData.themes.map((theme, index) => (
                <div key={index} className="theme-item">
                  <span className="theme-rank">#{index + 1}</span>
                  <span className="theme-name">{theme}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewAnalytics;
