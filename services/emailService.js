// Email Service - Hardened SMTP (Gmail) - Last Updated: 2026-03-15
require('dotenv').config();
const nodemailer = require('nodemailer');
const dns = require('dns');
// TRIPLE FORCE: Tell Node.js to prefer IPv4 globally to avoid Railway IPv6 bugs
if (dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
}

/**
 * Validates an email address format.
 */
const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(String(email).toLowerCase());
};

/**
 * HARDENED SMTP CONFIGURATION
 * This bypasses the broken IPv6 routing found on Render/Railway/Cloud providers.
 */
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    },
    // TRIPLE FORCE: Force IPv4 at the socket and binding level
    family: 4, 
    localAddress: '0.0.0.0', // Force local bind to IPv4 only
    connectionTimeout: 15000, 
    greetingTimeout: 15000,
    socketTimeout: 30000,
});

/**
 * Reusable core email sending function with retry logic.
 */
async function sendEmail(to, subject, html, retries = 3) {
    if (!to || !validateEmail(to)) {
        throw new Error(`Invalid recipient email address: ${to}`);
    }

    let lastError;
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            console.log(`[SMTP] Attempt ${attempt} to send email to ${to}...`);
            const info = await transporter.sendMail({
                from: `"Weekly Pulse" <${process.env.SMTP_USER}>`,
                to: to,
                subject: subject,
                html: html
            });
            console.log(`✅ Email sent successfully on attempt ${attempt}: ${info.messageId}`);
            return info;
        } catch (error) {
            lastError = error;
            console.error(`❌ SMTP Attempt ${attempt} failed: ${error.message}`);
            // If it's a network error, we definitely want to try again
            if (attempt < retries) {
                const delay = attempt * 2000; 
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }
    throw lastError;
}

/**
 * Formats pulse data and sends it using the core sendEmail function.
 */
async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;
    
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Missing SMTP credentials' });
        return;
    }

    if (!recipientEmail || !validateEmail(recipientEmail)) {
        console.error(`❌ Skipping email: Invalid or missing recipient: ${recipientEmail}`);
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Invalid recipient' });
        return;
    }

    try {
        onProgress?.({ phase: 'email', status: 'sending', progress: 30 });

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

        const subject = `📈 Groww Weekly Pulse (Week ${pulseData.weeks || 'Recent'}) - ${new Date().toDateString()}`;
        
        const result = await sendEmail(recipientEmail, subject, htmlTemplate);
        
        onProgress?.({ phase: 'email', status: 'completed', progress: 100, messageId: result.messageId });
        return result;
        
    } catch (error) {
        console.error('❌ Pulse email failed after final attempt:', error.message);
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = {
    sendEmail,
    sendPulseEmail
};
