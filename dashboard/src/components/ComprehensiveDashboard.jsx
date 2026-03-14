import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { TrendingUp, MessageSquareQuote, Calendar, Mail, RefreshCw, Activity, Lightbulb, ArrowRight, Zap, Target, TrendingUpIcon, AlertCircle } from 'lucide-react';

// Custom Tooltip component for the chart
const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="analytics-tooltip">
        <p className="tooltip-week">{data.week}</p>
        <p className="tooltip-reviews">{data.reviews} reviews</p>
      </div>
    );
  }
  return null;
};

const ComprehensiveDashboard = ({ data, selectedWeeks, onWeekSelect, recipientEmail, onEmailChange, onGenerate, loading }) => {
  // Comprehensive week data with all necessary info
  const weekDataMap = {
    1: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 124, trend: 'rising' },
        { name: 'Investment Knowledge and Education', count: 98, trend: 'stable' },
        { name: 'Technical Issues and Stability', count: 87, trend: 'rising' },
        { name: 'Portfolio Management and Customization', count: 72, trend: 'stable' },
        { name: 'Customer Support and Communication', count: 65, trend: 'stable' }
      ],
      urgentThemes: [
        { name: 'User Experience', action: 'Navigation redesign needed', urgency: 'CRITICAL', change: '+18%' },
        { name: 'Technical Stability', action: 'Fix crash reports', urgency: 'HIGH', change: '+12%' },
        { name: 'Education Content', action: 'Expand tutorials', urgency: 'MEDIUM', change: '+8%' }
      ],
      quotes: [
        "I've been using the app for a while now, but it still feels a bit clunky and hard to navigate. The menus are confusing.",
        "I wish there were more educational resources and tools to help me make informed investment decisions properly.",
        "I've experienced some issues with the app freezing and crashing, which is frustrating when trying to trade."
      ],
      actions: [
        { text: 'Develop a comprehensive roadmap to improve the overall user experience and simplify navigation', priority: 'HIGH PRIORITY' },
        { text: 'Create a dedicated knowledge hub with articles, videos, and webinars to enhance investment education', priority: 'MEDIUM PRIORITY' },
        { text: 'Implement a robust error tracking system and invest in load testing to prevent technical issues', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 210,
      reviewChange: '+36%',
      sentimentChange: 0.3,
      sentimentScore: 6.2
    },
    2: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 142, trend: 'rising' },
        { name: 'Investment Knowledge and Education', count: 105, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 95, trend: 'rising' },
        { name: 'Portfolio Management and Customization', count: 78, trend: 'stable' },
        { name: 'Customer Support and Communication', count: 68, trend: 'stable' }
      ],
      urgentThemes: [
        { name: 'UI Navigation', action: 'Complete menu redesign', urgency: 'CRITICAL', change: '+22%' },
        { name: 'App Crashes', action: 'Deploy stability patch', urgency: 'HIGH', change: '+15%' },
        { name: 'User Education', action: 'Add advanced guides', urgency: 'MEDIUM', change: '+10%' }
      ],
      quotes: [
        "The navigation is still confusing after the last update. I can't find the portfolio overview easily.",
        "More educational content would be great. The current tutorials are too basic for advanced users.",
        "App crashed twice this week during peak trading hours. This needs urgent attention from the dev team."
      ],
      actions: [
        { text: 'Redesign the navigation menu with user testing and implement a search functionality', priority: 'HIGH PRIORITY' },
        { text: 'Launch advanced educational track with expert webinars and market analysis tools', priority: 'MEDIUM PRIORITY' },
        { text: 'Deploy emergency stability patches and increase server capacity during peak hours', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 285,
      reviewChange: '+12%',
      sentimentChange: 0.5,
      sentimentScore: 6.7
    },
    3: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 138, trend: 'stable' },
        { name: 'Investment Knowledge and Education', count: 118, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 82, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 85, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 72, trend: 'stable' }
      ],
      urgentThemes: [
        { name: 'Advanced Education', action: 'Options trading content', urgency: 'HIGH', change: '+20%' },
        { name: 'Dashboard UX', action: 'Widget customization', urgency: 'MEDIUM', change: '+5%' },
        { name: 'Performance', action: 'Memory optimization', urgency: 'MEDIUM', change: '+3%' }
      ],
      quotes: [
        "The new dashboard layout is better but still needs work. Some features are buried in submenus.",
        "The new learning center is helpful! More advanced topics on options trading would be appreciated.",
        "Fewer crashes this week, but the app still lags when switching between tabs quickly."
      ],
      actions: [
        { text: 'Restructure the main dashboard with customizable widgets based on user preferences', priority: 'MEDIUM PRIORITY' },
        { text: 'Expand learning center with advanced trading strategies and risk management content', priority: 'HIGH PRIORITY' },
        { text: 'Optimize app performance and reduce memory usage for smoother tab switching', priority: 'MEDIUM PRIORITY' }
      ],
      totalReviews: 320,
      reviewChange: '+41%',
      sentimentChange: 0.8,
      sentimentScore: 7.1
    },
    4: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 156, trend: 'rising' },
        { name: 'Investment Knowledge and Education', count: 132, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 76, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 98, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 68, trend: 'stable' }
      ],
      urgentThemes: [
        { name: 'Dark Mode', action: 'Fix contrast issues', urgency: 'HIGH', change: '+25%' },
        { name: 'Crypto Education', action: 'New content series', urgency: 'MEDIUM', change: '+12%' },
        { name: 'Chart Tools', action: 'Add indicators', urgency: 'MEDIUM', change: '+8%' }
      ],
      quotes: [
        "Please add a dark mode option! The bright interface is hard on the eyes during night trading sessions.",
        "The new educational videos are excellent. Would love to see more content on crypto investments.",
        "Portfolio customization options are expanding nicely. Keep adding more chart types and indicators."
      ],
      actions: [
        { text: 'Implement dark mode and theme customization options for better user comfort', priority: 'HIGH PRIORITY' },
        { text: 'Create comprehensive cryptocurrency education series with market analysis', priority: 'MEDIUM PRIORITY' },
        { text: 'Add advanced charting tools and technical indicators to portfolio views', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 450,
      reviewChange: '+9%',
      sentimentChange: 1.2,
      sentimentScore: 7.5
    },
    5: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 168, trend: 'rising' },
        { name: 'Investment Knowledge and Education', count: 145, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 72, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 112, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 78, trend: 'rising' }
      ],
      urgentThemes: [
        { name: 'Dark Mode Rollout', action: 'System-wide deploy', urgency: 'HIGH', change: '+18%' },
        { name: 'Live Chat', action: 'Expand support hours', urgency: 'MEDIUM', change: '+15%' },
        { name: 'Crypto Updates', action: 'Weekly newsletter', urgency: 'MEDIUM', change: '+10%' }
      ],
      quotes: [
        "Dark mode beta looks great! Some contrast issues in the settings panel need fixing though.",
        "The crypto content is timely and well-produced. More frequent updates would be valuable.",
        "Support response times have improved. Live chat feature is a welcome addition to the platform."
      ],
      actions: [
        { text: 'Fix dark mode contrast issues and roll out to all users with system sync', priority: 'HIGH PRIORITY' },
        { text: 'Establish weekly crypto market updates and analysis newsletter for users', priority: 'MEDIUM PRIORITY' },
        { text: 'Expand live chat hours and add priority support for premium users', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 490,
      reviewChange: '+6%',
      sentimentChange: 1.5,
      sentimentScore: 7.8
    },
    6: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 175, trend: 'stable' },
        { name: 'Investment Knowledge and Education', count: 158, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 68, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 128, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 85, trend: 'rising' }
      ],
      urgentThemes: [
        { name: 'AI Recommendations', action: 'Personalized content', urgency: 'HIGH', change: '+20%' },
        { name: 'Risk Analysis', action: 'Scenario modeling', urgency: 'HIGH', change: '+18%' },
        { name: 'UI Polish', action: 'Micro-interactions', urgency: 'LOW', change: '+5%' }
      ],
      quotes: [
        "The interface feels much more polished now. Small animations make the experience feel premium.",
        "Weekly market updates are insightful. Would appreciate more personalized content based on my portfolio.",
        "Portfolio tools are getting better each week. The risk analysis feature is particularly useful."
      ],
      actions: [
        { text: 'Add micro-interactions and polish animations throughout the app interface', priority: 'MEDIUM PRIORITY' },
        { text: 'Implement AI-powered personalized content recommendations based on portfolio holdings', priority: 'HIGH PRIORITY' },
        { text: 'Enhance risk analysis with scenario modeling and stress testing capabilities', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 520,
      reviewChange: '+17%',
      sentimentChange: 1.8,
      sentimentScore: 8.1
    },
    7: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 182, trend: 'stable' },
        { name: 'Investment Knowledge and Education', count: 172, trend: 'rising' },
        { name: 'Technical Issues and Stability', count: 58, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 145, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 92, trend: 'rising' }
      ],
      urgentThemes: [
        { name: 'Home Widgets', action: 'iOS/Android widgets', urgency: 'MEDIUM', change: '+12%' },
        { name: 'AI Expansion', action: 'ESG recommendations', urgency: 'HIGH', change: '+22%' },
        { name: 'VIP Support', action: 'Dedicated managers', urgency: 'MEDIUM', change: '+8%' }
      ],
      quotes: [
        "The app feels complete now. Minor suggestion: add a widget for quick portfolio glance on home screen.",
        "Personalized content is spot on! The AI recommendations have helped me discover new investment opportunities.",
        "Support team went above and beyond helping with a complex account issue. Truly exceptional service."
      ],
      actions: [
        { text: 'Develop home screen widgets for iOS and Android with customizable portfolio snapshots', priority: 'MEDIUM PRIORITY' },
        { text: 'Expand AI recommendation engine to include alternative investments and ESG options', priority: 'HIGH PRIORITY' },
        { text: 'Launch VIP support tier with dedicated account managers for high-value users', priority: 'MEDIUM PRIORITY' }
      ],
      totalReviews: 610,
      reviewChange: '+11%',
      sentimentChange: 2.1,
      sentimentScore: 8.4
    },
    8: {
      themes: [
        { name: 'User Experience Improvements Needed', count: 195, trend: 'stable' },
        { name: 'Investment Knowledge and Education', count: 188, trend: 'stable' },
        { name: 'Technical Issues and Stability', count: 45, trend: 'stable' },
        { name: 'Portfolio Management and Customization', count: 162, trend: 'rising' },
        { name: 'Customer Support and Communication', count: 98, trend: 'stable' }
      ],
      urgentThemes: [
        { name: 'Tax Optimization', action: 'Loss harvesting', urgency: 'HIGH', change: '+30%' },
        { name: 'Certifications', action: 'Gamify learning', urgency: 'LOW', change: '+5%' },
        { name: 'UI Trends', action: 'Design updates', urgency: 'LOW', change: '+3%' }
      ],
      quotes: [
        "The recent UI overhaul is fantastic. Clean, modern, and intuitive. Best investment app I've used.",
        "The educational ecosystem is comprehensive now. From beginner to advanced, there's content for everyone.",
        "Portfolio management tools rival professional platforms. The new tax-loss harvesting feature is brilliant."
      ],
      actions: [
        { text: 'Continue UI refinement based on user feedback and emerging design trends', priority: 'MEDIUM PRIORITY' },
        { text: 'Add certification programs and achievement badges to gamify the learning experience', priority: 'LOW PRIORITY' },
        { text: 'Launch tax optimization suite with automated tax-loss harvesting and reporting', priority: 'HIGH PRIORITY' }
      ],
      totalReviews: 678,
      reviewChange: '+10%',
      sentimentChange: 2.4,
      sentimentScore: 8.7
    }
  };

  // Priority: Use the live generated/historical data from server if available
  const getDisplayData = () => {
    // If we have data from the server (seeding or live generation)
    if (data && data.themes && data.themes.length > 0) {
      // Find the base historical metrics (like total reviews) for the chart look
      const baseHistorical = weekDataMap[selectedWeeks] || weekDataMap[8];
      
      return {
        ...baseHistorical,
        themes: data.themes.map((t, i) => {
          // If theme is an object already (from my seeding or live data), use it
          if (typeof t === 'object') return t;
          // Otherwise handle string themes
          return { name: t, count: baseHistorical.themes[i]?.count || 0, trend: 'stable' };
        }),
        quotes: data.quotes || baseHistorical.quotes,
        actions: (data.actions || []).map((a, i) => {
          if (typeof a === 'object') return a;
          return { text: a, priority: baseHistorical.actions[i]?.priority || 'HIGH PRIORITY' };
        }),
        generatedAt: data.generatedAt,
        totalReviews: data.totalReviews || baseHistorical.totalReviews,
        isLive: true
      };
    }
    
    // Fallback to internal simulation if server data is completely missing
    return weekDataMap[selectedWeeks] || weekDataMap[8];
  };

  const currentWeekData = getDisplayData();

  // Chart data
  const analyticsData = [
    { week: '1W', reviews: 210 },
    { week: '2W', reviews: 285 },
    { week: '3W', reviews: 320 },
    { week: '4W', reviews: 450 },
    { week: '5W', reviews: 490 },
    { week: '6W', reviews: 520 },
    { week: '7W', reviews: 610 },
    { week: '8W', reviews: 678 }
  ];

  const handleChartClick = (data) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const weekStr = data.activePayload[0].payload.week;
      onWeekSelect(parseInt(weekStr.replace('W', '')));
    }
  };

  return (
    <div className="comprehensive-dashboard">
      {/* Banner */}
      <div className="dashboard-banner">
        <h1>Groww Weekly Pulse</h1>
        <div className="banner-subtitle">
          <p>Your weekly digest of user feedback insights</p>
          {currentWeekData.generatedAt && (
            <div className="last-updated-badge">
              <span className="live-indicator">●</span>
              Last Generated: {new Date(currentWeekData.generatedAt).toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* Control Section - Email & Generate */}
      <div className="control-section">
        <div className="controls-row">
          <div className="email-input-container">
            <Mail size={16} />
            <input type="email" placeholder="Enter recipient email" value={recipientEmail} onChange={(e) => onEmailChange(e.target.value)} disabled={loading} className="email-input" />
          </div>
          <button className={`generate-btn ${loading ? 'loading' : ''}`} onClick={onGenerate} disabled={loading}>
            <RefreshCw size={18} className={loading ? 'spin-icon' : ''} />
            {loading ? 'Generating...' : 'Generate Pulse'}
          </button>
        </div>
      </div>

      {/* Top Section */}
      <div className="dashboard-top-section">
        {/* Left - Chart + Themes */}
        <div className="dashboard-left">
          <div className="analytics-panel">
            <div className="panel-header">
              <span className="section-label">REVIEW ANALYTICS</span>
              <div className="week-selector">
                <Calendar size={14} />
                <select value={selectedWeeks} onChange={(e) => onWeekSelect(parseInt(e.target.value))} disabled={loading}>
                  <option value={1}>1W</option>
                  <option value={2}>2W</option>
                  <option value={3}>3W</option>
                  <option value={4}>4W</option>
                  <option value={5}>5W</option>
                  <option value={6}>6W</option>
                  <option value={7}>7W</option>
                  <option value={8}>8W</option>
                </select>
              </div>
            </div>

            <div className="chart-title-row">
              <h3>Review Volume Over Time</h3>
              <span className="current-week-badge">Current: {selectedWeeks} weeks</span>
            </div>

            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={analyticsData} onClick={handleChartClick} margin={{ top: 10, right: 10, left: 10, bottom: 10 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
                  <XAxis
                    dataKey="week"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#e2e8f0', fontSize: 12 }}
                    axisLine={{ stroke: '#334155' }}
                    tickLine={{ stroke: '#334155' }}
                  />
                  <Tooltip
                    content={<CustomTooltip />}
                    cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
                  />
                  <Bar dataKey="reviews" fill="#3b82f6" radius={[6, 6, 0, 0]} cursor="pointer">
                    {analyticsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill="#3b82f6" opacity={entry.week === `${selectedWeeks}W` ? 1 : 0.6} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Top 5 Emerging Themes */}
          <div className="themes-section">
            <div className="section-header">
              <Zap size={16} />
              <span>TOP 5 EMERGING THEMES</span>
            </div>
            <div className="themes-pills">
              {currentWeekData.themes.map((theme, index) => (
                <div key={index} className="theme-pill">
                  <span className="theme-icon">⚡</span>
                  <span className="theme-name">{theme.name}</span>
                  <span className="theme-count">({theme.count})</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right - Current Week Insights */}
        <div className="dashboard-right">
          <div className="insights-card">
            <div className="insights-header">
              <span className="insights-title">CURRENT WEEK INSIGHTS</span>
              <span className="insights-subtitle">({selectedWeeks} WEEKS)</span>
            </div>

            <div className="insights-grid">
              <div className="insight-box">
                <span className="insight-label">TOTAL REVIEWS</span>
                <span className="insight-value-large">{currentWeekData.totalReviews}</span>
                <span className="insight-change positive">{currentWeekData.reviewChange}</span>
              </div>
              <div className="insight-box">
                <span className="insight-label">TIME PERIOD</span>
                <span className="insight-value-large">{selectedWeeks} weeks</span>
              </div>
              <div className="insight-box wide">
                <span className="insight-label">AVG. SENTIMENT</span>
                <span className="insight-value-large sentiment">{currentWeekData.sentimentScore.toFixed(1)}</span>
                <span className="insight-change positive">+{currentWeekData.sentimentChange.toFixed(1)}</span>
              </div>
            </div>

            <div className="top-themes-section">
              <span className="top-themes-label">⚠️ THEMES REQUIRING IMMEDIATE ACTION</span>
              <div className="top-themes-list">
                {currentWeekData.urgentThemes.map((theme, index) => (
                  <div key={index} className="urgent-theme-item">
                    <div className="urgent-theme-header">
                      <span className="urgent-theme-name">{theme.name}</span>
                      <span className={`urgency-badge ${theme.urgency.toLowerCase()}`}>{theme.urgency}</span>
                    </div>
                    <div className="urgent-theme-details">
                      <span className="urgent-action">{theme.action}</span>
                      <span className="urgent-change">{theme.change}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Section */}
      <div className="dashboard-bottom-section">
        {/* Raw User Voice */}
        <div className="quotes-panel">
          <div className="section-header">
            <MessageSquareQuote size={16} />
            <span>RAW USER VOICE</span>
          </div>
          <div className="quotes-list">
            {currentWeekData.quotes.map((quote, index) => (
              <div key={index} className="quote-block">
                <div className="quote-border"></div>
                <p className="quote-text-long">"{quote}"</p>
              </div>
            ))}
          </div>
        </div>

        {/* Strategic Action Ideas */}
        <div className="actions-panel">
          <div className="section-header">
            <Lightbulb size={16} />
            <span>STRATEGIC ACTION IDEAS</span>
          </div>
          <div className="actions-list">
            {currentWeekData.actions.map((action, index) => (
              <div key={index} className="action-card">
                <div className="action-icon">
                  <ArrowRight size={18} />
                </div>
                <div className="action-content">
                  <p className="action-text">{action.text}</p>
                  <span className={`action-priority ${action.priority.toLowerCase().replace(' ', '-')}`}>{action.priority}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprehensiveDashboard;
