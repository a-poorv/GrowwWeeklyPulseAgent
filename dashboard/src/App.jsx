import React, { useState, useEffect, useRef } from 'react';
import './index.css';
import {
  TrendingUp,
  MessageSquareQuote,
  Lightbulb,
  Activity,
  ArrowRight,
  RefreshCw,
  Mail,
  Calendar,
  Clock,
  CheckCircle,
  XCircle,
  Loader
} from 'lucide-react';
import initialPulseData from './data/pulse.json';
import ReviewAnalytics from './components/ComprehensiveDashboard';

function App() {
  const [data, setData] = useState(initialPulseData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedWeeks, setSelectedWeeks] = useState(8);
  const [, setCurrentJob] = useState(null);
  const [jobStatus, setJobStatus] = useState(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const pollingInterval = useRef(null);

  // Load the pre-computed data instantly on mount or week change
  useEffect(() => {
    fetchPrecomputedData(selectedWeeks);
    return () => {
      if (pollingInterval.current) {
        clearInterval(pollingInterval.current);
      }
    };
  }, [selectedWeeks]);

  const fetchPrecomputedData = async (weeks) => {
    try {
      const url = weeks ? `http://127.0.0.1:3000/api/pulse?weeks=${weeks}` : 'http://127.0.0.1:3000/api/pulse';
      const response = await fetch(url);
      if (response.ok) {
        const newData = await response.json();
        setData(newData);
      }
    } catch {
      console.error("Failed to fetch initial pulse data");
    }
  };

  const startPolling = (jobId) => {
    if (pollingInterval.current) {
      clearInterval(pollingInterval.current);
    }

    pollingInterval.current = setInterval(async () => {
      try {
        const response = await fetch(`http://127.0.0.1:3000/api/jobs/${jobId}`);
        if (response.ok) {
          const job = await response.json();
          setJobStatus(job);
          
          if (job.status === 'completed') {
            clearInterval(pollingInterval.current);
            setLoading(false);
            setCurrentJob(null);
            setJobStatus(null); // Clear pipeline after completion
            setShowSuccess(true);
            setTimeout(() => setShowSuccess(false), 5000);
            // Refresh the pulse data
            await fetchPrecomputedData(selectedWeeks);
          } else if (job.status === 'failed') {
            clearInterval(pollingInterval.current);
            setLoading(false);
            setCurrentJob(null);
            setJobStatus(null);
            setError(job.error || 'Job failed');
          }
        }
      } catch (err) {
        console.error('Failed to poll job status:', err);
      }
    }, 2000); // Poll every 2 seconds
  };

  const handleGeneratePulse = async () => {
    setLoading(true);
    setError(null);
    setJobStatus(null);

    try {
      const response = await fetch('http://127.0.0.1:3000/api/generate-pulse', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ 
          weeks: selectedWeeks,
          recipientEmail: recipientEmail || undefined 
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start pulse generation');
      }
      
      const result = await response.json();
      setCurrentJob(result);
      startPolling(result.jobId);
      
    } catch (err) {
      console.error(err);
      setError('Could not start pulse generation. ' + err.message);
      setLoading(false);
    }
  };

  const getStageIcon = (stageName) => {
    switch (stageName) {
      case 'initializing': return <Loader size={16} />;
      case 'fetching_reviews': return <Activity size={16} />;
      case 'analyzing_reviews': return <TrendingUp size={16} />;
      case 'generating_report': return <Lightbulb size={16} />;
      case 'sending_email': return <Mail size={16} />;
      case 'completed': return <CheckCircle size={16} />;
      case 'failed': return <XCircle size={16} />;
      default: return <Clock size={16} />;
    }
  };

  const getStageLabel = (stageName) => {
    switch (stageName) {
      case 'initializing': return 'Step 1: Initialization';
      case 'fetching_reviews': return 'Step 2: Fetching Reviews';
      case 'analyzing_reviews': return 'Step 3: Analyzing with AI';
      case 'generating_report': return 'Step 4: Generating Report';
      case 'sending_email': return 'Step 5: Sending Email';
      case 'completed': return 'Final: Completed';
      case 'failed': return 'Final: Failed';
      default: return 'Processing';
    }
  };

  
  const { emailStatus } = data;

  return (
    <div className="dashboard-container">
      {error && <div className="error-banner">{error}</div>}

      {showSuccess && (
        <div className="top-success-nudge">
          <div className="nudge-content">
            <CheckCircle size={20} className="nudge-icon" />
            <div className="nudge-text">
              <strong>Email Sent successfully!</strong>
              <span>The Weekly Pulse for week {selectedWeeks} has been dispatched to your inbox.</span>
            </div>
          </div>
        </div>
      )}

      {jobStatus && (
        <div className="pipeline-stepper">
          <div className="stepper-header">
            <h3>Processing Pipeline</h3>
            <span className="progress-percent">{jobStatus.progress}%</span>
          </div>
          <div className="stepper-track">
            <div 
              className="stepper-fill" 
              style={{ width: `${jobStatus.progress}%` }}
            />
          </div>
          <div className="stepper-steps">
            {Object.entries(jobStatus.stages).map(([stageKey, stage], index) => (
              <div 
                key={stageKey}
                className={`step-item ${stage.completed ? 'completed' : 'pending'} ${jobStatus.currentStage === stageKey ? 'active' : ''}`}
              >
                <div className="step-circle">
                  {stage.completed ? <CheckCircle size={14} /> : <span>{index + 1}</span>}
                </div>
                <div className="step-content">
                  <span className="step-title">{getStageLabel(stageKey)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ReviewAnalytics 
        data={data}
        selectedWeeks={selectedWeeks}
        onWeekSelect={setSelectedWeeks}
        recipientEmail={recipientEmail}
        onEmailChange={setRecipientEmail}
        onGenerate={handleGeneratePulse}
        loading={loading}
      />
    </div>
  );
}

export default App;
