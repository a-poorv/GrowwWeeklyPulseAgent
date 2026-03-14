require('dotenv').config();
const { Resend } = require('resend');

/**
 * Sends the generated pulse report via email using Resend API
 * This replaces the old SMTP logic to avoid networking/timeout issues.
 * @param {Object} pulseData JSON object from LLM containing themes, quotes, actions
 * @param {string} targetEmail Recipient email address
 * @param {Function} onProgress Optional progress callback
 */
async function sendPulseEmail(pulseData, targetEmail = null, onProgress) {
    const recipientEmail = targetEmail || process.env.TARGET_EMAIL;
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.error('❌ Missing RESEND_API_KEY environment variable.');
        onProgress?.({ phase: 'email', status: 'skipped', reason: 'Missing Resend API Key' });
        return;
    }

    const resend = new Resend(apiKey);
    
    try {
        console.log(`[Resend] Preparing to send pulse to: ${recipientEmail}...`);
        onProgress?.({ phase: 'email', status: 'sending', progress: 10 });

        // Build the HTML template
        const htmlTemplate = `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <div style="background-color: #00d09c; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
                    <h1 style="color: white; margin: 0; font-size: 24px;">📈 Groww Weekly Pulse</h1>
                    <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0;">${pulseData.weeks ? `Week ${pulseData.weeks} Review Digest` : 'Recent Review Digest'}</p>
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
                    <p>Automated by the Weekly Pulse Reporter • No PII explicitly present.</p>
                </div>
            </div>
        `;

        const { data, error } = await resend.emails.send({
            from: 'Weekly Pulse <onboarding@resend.dev>',
            to: recipientEmail,
            subject: `📈 Groww Weekly Pulse (Week ${pulseData.weeks || 'Recent'}) - ${new Date().toDateString()}`,
            html: htmlTemplate,
        });

        if (error) {
            throw new Error(error.message);
        }

        console.log(`✅ Email sent successfully via Resend! ID: ${data.id}`);
        onProgress?.({ phase: 'email', status: 'completed', progress: 100, messageId: data.id });
        return data;

    } catch (error) {
        console.error(`❌ Resend API Error:`, error.message);
        onProgress?.({ phase: 'email', status: 'error', error: error.message });
        throw error;
    }
}

module.exports = {
    sendPulseEmail
};
