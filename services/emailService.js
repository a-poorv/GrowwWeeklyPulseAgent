// Email Service - Premium HTTP Web API Based (Brevo)
// This strictly uses HTTPS (Port 443) and delivers a high-fidelity report.
require('dotenv').config();
const axios = require('axios');

const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * Sends email via Brevo REST API (HTTP Path)
 */
async function sendEmail(to, subject, html, retries = 3) {
    if (!to || !validateEmail(to)) {
        throw new Error(`Invalid recipient: ${to}`);
    }

    const apiKey = process.env.BREVO_API_KEY;
    const senderEmail = process.env.SMTP_USER;

    if (!apiKey) {
        throw new Error('Missing BREVO_API_KEY in environment variables.');
    }

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[HTTP-API] Attempt ${attempt}: Sending to ${to} via Brevo...`);
            
            const response = await axios.post('https://api.brevo.com/v3/smtp/email', {
                sender: { name: "Weekly Pulse", email: senderEmail },
                to: [{ email: to }],
                subject: subject,
                htmlContent: html
            }, {
                headers: {
                    'api-key': apiKey,
                    'Content-Type': 'application/json'
                },
                timeout: 15000
            });

            console.log(`✅ HTTP SUCCESS! Message ID: ${response.data.messageId}`);
            return response.data;

        } catch (error) {
            lastError = error;
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
            console.error(`❌ HTTP Attempt ${attempt} failed: ${errorMsg}`);
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 3000));
            }
        }
    }
    throw lastError;
}

/**
 * Formats pulse data and sends it.
 */
async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;
    
    if (!recipientEmail || !validateEmail(recipientEmail)) {
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Invalid recipient' });
        return;
    }

    try {
        onProgress?.({ phase: 'email', status: 'sending', progress: 30 });

        // Ensure we have fallbacks for the new data structure
        const themes = pulseData.themes || [];
        const actions = pulseData.actions || [];
        const quotes = pulseData.quotes || [];
        const urgentThemes = pulseData.urgentThemes || [];
        const totalReviews = pulseData.totalReviews || 0;
        const reviewChange = pulseData.reviewChange || '+0%';
        const sentimentScore = pulseData.sentimentScore || 0;
        const sentimentChange = pulseData.sentimentChange || 0;

        const htmlTemplate = `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; margin: 0; padding: 0; background-color: #f8fafc; }
                    .container { max-width: 600px; margin: 20px auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); border: 1px solid #e2e8f0; }
                    .header { background: #00d09c; padding: 30px; text-align: center; color: white; }
                    .header h1 { margin: 0; font-size: 28px; font-weight: 800; letter-spacing: -0.5px; }
                    .header p { margin: 5px 0 0; opacity: 0.9; font-size: 14px; }
                    .content { padding: 30px; }
                    .stats-grid { display: table; width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 25px; }
                    .stat-box { display: table-cell; background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center; width: 33.33%; }
                    .stat-label { display: block; font-size: 10px; font-weight: 700; color: #64748b; text-transform: uppercase; margin-bottom: 4px; }
                    .stat-value { display: block; font-size: 20px; font-weight: 800; color: #0f172a; }
                    .stat-change { font-size: 11px; font-weight: 600; color: #10b981; }
                    .section-title { font-size: 13px; font-weight: 700; color: #64748b; text-transform: uppercase; margin: 25px 0 12px; display: flex; align-items: center; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px; }
                    .urgent-theme { background: #fff1f2; border-left: 4px solid #f43f5e; padding: 12px 15px; margin-bottom: 10px; border-radius: 0 4px 4px 0; }
                    .urgent-name { font-weight: 700; color: #9f1239; font-size: 14px; display: block; }
                    .urgent-action { color: #be123c; font-size: 13px; display: block; margin-top: 2px; }
                    .urgent-badge { float: right; background: #f43f5e; color: white; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: 700; margin-top: -18px; }
                    .theme-item { background: #f8fafc; padding: 10px 15px; border-radius: 6px; margin-bottom: 8px; font-size: 14px; font-weight: 500; border: 1px solid #f1f5f9; }
                    .quote-card { background: #ffffff; border-left: 4px solid #00d09c; padding: 15px; font-style: italic; color: #475569; margin-bottom: 15px; box-shadow: 0 1px 2px rgba(0,0,0,0.05); border-top: 1px solid #f1f5f9; border-right: 1px solid #f1f5f9; border-bottom: 1px solid #f1f5f9; }
                    .action-item { display: flex; margin-bottom: 12px; }
                    .action-bullet { min-width: 24px; color: #00d09c; font-weight: 800; font-size: 18px; line-height: 1.2; }
                    .action-text { font-size: 14px; color: #334115; }
                    .footer { background: #f1f5f9; padding: 20px; text-align: center; font-size: 11px; color: #94a3b8; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Groww Weekly Pulse</h1>
                        <p>Aggregated user feedback analysis for the past ${pulseData.weeks || 8} weeks</p>
                    </div>
                    <div class="content">
                        <!-- KPI Section -->
                        <div class="stats-grid">
                            <div class="stat-box">
                                <span class="stat-label">Total Reviews</span>
                                <span class="stat-value">${totalReviews}</span>
                                <span class="stat-change">${reviewChange}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">Avg. Rating</span>
                                <span class="stat-value">${sentimentScore}</span>
                                <span class="stat-change" style="color:#00d09c;">+${sentimentChange}</span>
                            </div>
                            <div class="stat-box">
                                <span class="stat-label">Status</span>
                                <span class="stat-value" style="color:#00d09c; font-size: 16px;">Healthy</span>
                                <span class="stat-change">Verified</span>
                            </div>
                        </div>

                        <!-- Immediate Action Section -->
                        <div class="section-title">⚠️ THEMES REQUIRING IMMEDIATE ACTION</div>
                        ${urgentThemes.map(t => `
                            <div class="urgent-theme">
                                <span class="urgent-badge">${t.urgency}</span>
                                <span class="urgent-name">${t.name}</span>
                                <span class="urgent-action">${t.action}</span>
                            </div>
                        `).join('')}

                        <!-- Emerging Themes Section -->
                        <div class="section-title">⚡ TOP EMERGING THEMES</div>
                        ${themes.map(t => `
                            <div class="theme-item">${typeof t === 'object' ? t.name : t}</div>
                        `).join('')}

                        <!-- User Voices Section -->
                        <div class="section-title">🗣️ RAW USER VOICE</div>
                        ${quotes.map(q => `
                            <div class="quote-card">"${q}"</div>
                        `).join('')}

                        <!-- Strategic Actions Section -->
                        <div class="section-title">🚀 STRATEGIC ACTIONS</div>
                        ${actions.map(a => `
                            <div class="action-item">
                                <div class="action-bullet">→</div>
                                <div class="action-text">${typeof a === 'object' ? a.text : a}</div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="footer">
                        <p>Generated on ${new Date(pulseData.generatedAt).toLocaleString()}</p>
                        <p>This report was generated using AI analysis of real app reviews.</p>
                        <p>Sent via Brevo HTTP Web Path.</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const subject = `📈 Groww Weekly Pulse Report - ${new Date().toLocaleDateString()}`;
        const result = await sendEmail(recipientEmail, subject, htmlTemplate);
        
        onProgress?.({ phase: 'email', status: 'completed', progress: 100 });
        return result;
        
    } catch (error) {
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = { sendEmail, sendPulseEmail };
