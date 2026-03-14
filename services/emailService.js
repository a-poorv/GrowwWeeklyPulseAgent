require('dotenv').config();
const nodemailer = require('nodemailer');

/**
 * Sends the generated pulse report via email
 * @param {Object} pulseData JSON object from LLM containing themes, quotes, actions
 * @param {string} targetEmail Recipient email address (optional, uses default if not provided)
 * @param {Function} onProgress Optional progress callback
 */
// Create a more robust pooled transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL
    pool: true,   // Use pooled connections
    maxConnections: 3,
    maxMessages: 100,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Verify connection on startup to log errors if credentials are bad
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error on Startup:', error.message);
    } else {
        console.log('✅ SMTP Server ready to send emails.');
    }
});

/**
 * Sends the generated pulse report via email
 * @param {Object} pulseData JSON object from LLM containing themes, quotes, actions
 * @param {string} targetEmail Recipient email address (optional, uses default if not provided)
 * @param {Function} onProgress Optional progress callback
 */
async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;

    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        console.error('❌ Missing SMTP_USER or SMTP_PASS environment variables.');
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Missing email configuration' });
        return;
    }
    
    if (!recipientEmail) {
        console.error('❌ Missing recipient address (TARGET_EMAIL or input).');
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Missing recipient' });
        return;
    }

    try {
        // Report starting state
        onProgress?.({ phase: 'email', status: 'sending', progress: 10 });

        // Build the clean HTML Email Template based on constraints: Scannable, No PII.
        const htmlTemplate = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #00d09c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📈 Groww Weekly Pulse</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${pulseData.weeks ? `Week ${pulseData.weeks} Review Digest` : 'Recent Review Digest'}</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
                    
                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px; margin-top: 0;">📌 Top 3 User Themes</h2>
                    <ul style="padding-left: 20px; margin-bottom: 24px;">
                        <li style="margin-bottom: 8px;"><strong>${pulseData.themes[0]}</strong></li>
                        <li style="margin-bottom: 8px;"><strong>${pulseData.themes[1]}</strong></li>
                        <li style="margin-bottom: 8px;"><strong>${pulseData.themes[2]}</strong></li>
                    </ul>

                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px;">🗣️ Raw User Voice</h2>
                    <div style="background-color: white; border-left: 4px solid #00d09c; padding: 16px; margin-bottom: 24px; font-style: italic; color: #555;">
                        <p style="margin-top: 0;">💬 "${pulseData.quotes[0]}"</p>
                        <p>💬 "${pulseData.quotes[1]}"</p>
                        <p style="margin-bottom: 0;">💬 "${pulseData.quotes[2]}"</p>
                    </div>

                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px;">🚀 Proposed Action Items</h2>
                    <ul style="padding-left: 20px; margin-bottom: 0;">
                        <li style="margin-bottom: 8px;">${pulseData.actions[0]}</li>
                        <li style="margin-bottom: 8px;">${pulseData.actions[1]}</li>
                        <li style="margin-bottom: 0;">${pulseData.actions[2]}</li>
                    </ul>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
                    <p>Automated by the Weekly Pulse Reporter • No PII explicitly present.</p>
                    <p>Generated for: ${recipientEmail}</p>
                </div>
            </div>
        `;

        // Mail Options
        const mailOptions = {
            from: `"Pulse Reporter" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: `📈 Groww Weekly Pulse (Week ${pulseData.weeks || 'Recent'}) - ${new Date().toDateString()}`,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        onProgress?.({ phase: 'email', status: 'completed', progress: 100, messageId: info.messageId });
        return info;

    } catch (error) {
        console.error(`❌ Email dispatch failed to ${recipientEmail}:`, error.message);
        if (error.code === 'EAUTH') {
            console.error('👉 Hint: This is an Authentication error. Check your SMTP_PASS (App Password) inside Render.');
        } else if (error.code === 'ETIMEDOUT') {
            console.error('👉 Hint: Connection timeout. Render might be blocking default ports or Gmail is blocking the IP. Explicit SSL to port 465 should fix this.');
        }
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = {
    sendPulseEmail
};
