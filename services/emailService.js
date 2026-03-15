require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns');

/**
 * Sends the generated pulse report via email
 * @param {Object} pulseData JSON object from LLM containing themes, quotes, actions
 * @param {string} targetEmail Recipient email address
 * @param {Function} onProgress Optional progress callback
 */

// HARDENED GMAIL CONFIGURATION
// We use a custom lookup function to force IPv4 and bypass Render's IPv6 networking bugs.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // Use STARTTLS
    pool: true,
    maxConnections: 3,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // CRITICAL: Manual DNS Lookup Force for Cloud Environments (Render fix)
    lookup: (hostname, options, callback) => {
        dns.lookup(hostname, { family: 4 }, (err, address, family) => {
            callback(err, address, family);
        });
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
    tls: {
        rejectUnauthorized: false,
        minVersion: 'TLSv1.2'
    }
});

// Verify connection on startup to log errors clearly in Render logs
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error (Gmail):', error.message);
    } else {
        console.log('✅ SMTP Server ready (Gmail)');
    }
});

async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS || !recipientEmail) {
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Missing configuration' });
        return;
    }

    try {
        onProgress?.({ phase: 'email', status: 'sending', progress: 10 });

        const htmlTemplate = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #00d09c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📈 Groww Weekly Pulse</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">Week ${pulseData.weeks || 'Recent'} Digest</p>
                </div>
                
                <div style="background-color: #f9f9f9; padding: 24px; border-radius: 0 0 8px 8px; border: 1px solid #eee;">
                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px; margin-top: 0;">📌 Top 3 User Themes</h2>
                    <ul style="padding-left: 20px; margin-bottom: 24px;">
                        ${pulseData.themes.map(t => `<li style="margin-bottom: 8px;"><strong>${t}</strong></li>`).join('')}
                    </ul>

                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px;">🗣️ Raw User Voice</h2>
                    <div style="background-color: white; border-left: 4px solid #00d09c; padding: 16px; margin-bottom: 24px; font-style: italic; color: #555;">
                        ${pulseData.quotes.map(q => `<p>💬 "${q}"</p>`).join('')}
                    </div>

                    <h2 style="color: #1a1a1a; font-size: 18px; border-bottom: 2px solid #00d09c; padding-bottom: 8px;">🚀 Proposed Action Items</h2>
                    <ul style="padding-left: 20px; margin-bottom: 0;">
                        ${pulseData.actions.map(a => `<li style="margin-bottom: 8px;">${a}</li>`).join('')}
                    </ul>
                </div>
                <div style="text-align: center; margin-top: 20px; font-size: 12px; color: #888;">
                    <p>Automated Weekly Pulse Reporter</p>
                    <p>Generated for: ${recipientEmail}</p>
                </div>
            </div>
        `;

        const mailOptions = {
            from: `"Weekly Pulse" <${process.env.SMTP_USER}>`,
            to: recipientEmail,
            subject: `📈 Groww Weekly Pulse (Week ${pulseData.weeks || 'Recent'}) - ${new Date().toDateString()}`,
            html: htmlTemplate
        };

        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Pulse email delivered to ${recipientEmail}`);
        onProgress?.({ phase: 'email', status: 'completed', progress: 100, messageId: info.messageId });
        return info;
        
    } catch (error) {
        console.error('❌ Email dispatch failed:', error.message);
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = {
    sendPulseEmail
};
