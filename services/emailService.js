// Email Service - HTTP Web API Based (Brevo)
// This strictly uses HTTPS (Port 443) to bypass ALL network port blocks.
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
                timeout: 10000
            });

            console.log(`✅ HTTP SUCCESS! Message ID: ${response.data.messageId}`);
            return response.data;

        } catch (error) {
            lastError = error;
            const errorMsg = error.response?.data?.message || JSON.stringify(error.response?.data) || error.message;
            console.error(`❌ HTTP Attempt ${attempt} failed: ${errorMsg}`);
            
            if (attempt < retries) {
                await new Promise(resolve => setTimeout(resolve, 2000));
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

        const htmlTemplate = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #333; line-height: 1.6;">
                <h1 style="color: #00d09c;">📈 Groww Weekly Pulse</h1>
                <p>Latest analysis report for ${pulseData.weeks || 8} weeks.</p>
                <hr style="border: 0; border-top: 1px solid #eee;"/>
                <h3>📌 Key Themes</h3>
                <ul>${pulseData.themes.map(t => `<li>${t}</li>`).join('')}</ul>
                <h3>🗣️ User Voice</h3>
                <div style="background: #f9f9f9; padding: 15px; border-left: 4px solid #00d09c; font-style: italic;">
                    "${pulseData.quotes[0]}"
                </div>
                <h3>🚀 Action Items</h3>
                <ul>${pulseData.actions.map(a => `<li>${a}</li>`).join('')}</ul>
                <p style="font-size: 11px; color: #888; margin-top: 30px;">Delivered via HTTP Web API (Brevo).</p>
            </div>
        `;

        const subject = `Weekly Pulse Report - ${new Date().toLocaleDateString()}`;
        const result = await sendEmail(recipientEmail, subject, htmlTemplate);
        
        onProgress?.({ phase: 'email', status: 'completed', progress: 100 });
        return result;
        
    } catch (error) {
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = { sendEmail, sendPulseEmail };
