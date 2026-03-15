const Groq = require('groq-sdk');
require('dotenv').config();

let groq;
const getGroqClient = () => {
    if (!groq) {
        if (!process.env.GROQ_API_KEY) {
            throw new Error('GROQ_API_KEY is missing. Please add it to your environment variables.');
        }
        groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    }
    return groq;
};

// Helper to chunk array
function chunkArray(array, size) {
    const chunked = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

/**
 * Analyzes a single chunk of reviews (Map Step)
 */
async function analyzeChunk(chunk, chunkIndex, onProgress) {
    const compactReviews = chunk.map((r, index) =>
        `Date: ${r.date}, Rating: ${r.rating}, Text: "${r.text}"`
    ).join('\n');

    const systemPrompt = `You are an analyst. Review these app reviews and extract the key themes and interesting user quotes.
    
### FORMAT:
Return ONLY VALID JSON.
{
  "micro_themes": ["theme 1", "theme 2"],
  "important_quotes": ["quote 1", "quote 2"]
}`;

    try {
        const client = getGroqClient();
        const chatCompletion = await client.chat.completions.create({
            response_format: { type: 'json_object' },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Reviews:\n\n${compactReviews}\n\nReturn JSON only.` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.2,
            max_tokens: 300
        });

        const content = chatCompletion.choices[0]?.message?.content || "{}";
        onProgress?.({ phase: 'analyzing', chunk: chunkIndex + 1, status: 'completed' });
        return JSON.parse(content);
    } catch (error) {
        console.error(`[LLM] Error analyzing chunk ${chunkIndex}:`, error.message);
        onProgress?.({ phase: 'analyzing', chunk: chunkIndex + 1, status: 'error', error: error.message });
        return { micro_themes: [], important_quotes: [] };
    }
}

/**
 * Reduces the mapped results into the final insight (Reduce Step)
 */
async function reduceInsights(mappedResults, onProgress) {
    const combinedInput = JSON.stringify(mappedResults, null, 2);

    const systemPrompt = `You are a Senior Product Analyst for the "Groww" app.
Your job is to read these aggregated micro-themes and quotes from recent app reviews and generate a scannable ONE-PAGE WEEKLY PULSE.

### TASK:
1. Synthesize the micro-themes into maximum 5 final distinct themes.
2. Select exactly 3 representative real user quotes from the provided list.
3. Generate exactly 3 actionable product ideas based on these themes.
4. Identify 3 Themes Requiring Immediate Action (URGENT) with a specific action item, urgency level (CRITICAL, HIGH, MEDIUM, LOW), and a simulated impact percentage.
5. Keep the entire response under 250 words. No PII.

### FORMAT:
Return ONLY VALID JSON.
{
  "themes": [ "Theme 1", "Theme 2", "Theme 3", "Theme 4", "Theme 5" ],
  "quotes": [ "Quote 1", "Quote 2", "Quote 3" ],
  "actions": [ "Action 1", "Action 2", "Action 3" ],
  "urgentThemes": [
     { "name": "Theme Name", "action": "Immediate Action", "urgency": "CRITICAL", "change": "+X%" },
     { "name": "Theme Name", "action": "Immediate Action", "urgency": "HIGH", "change": "+X%" },
     { "name": "Theme Name", "action": "Immediate Action", "urgency": "MEDIUM", "change": "+X%" }
  ]
}`;

    try {
        onProgress?.({ phase: 'reducing', status: 'started' });
        const client = getGroqClient();
        const chatCompletion = await client.chat.completions.create({
            response_format: { type: 'json_object' },
            messages: [
                { role: "system", content: systemPrompt },
                { role: "user", content: `Aggregated Insights:\n\n${combinedInput}\n\nGenerate final JSON only.` }
            ],
            model: "llama-3.1-8b-instant",
            temperature: 0.3,
            max_tokens: 400
        });

        onProgress?.({ phase: 'reducing', status: 'completed' });
        return chatCompletion.choices[0]?.message?.content || "{}";
    } catch (error) {
        console.error("[LLM] Error reducing insights:", error);
        onProgress?.({ phase: 'reducing', status: 'error', error: error.message });
        throw error;
    }
}

/**
 * Sends reviews to Groq to generate a Weekly Pulse note using Map-Reduce
 */
async function generatePulseReport(reviews, { onProgress } = {}) {
    if (!reviews || reviews.length === 0) {
        throw new Error("No reviews provided for analysis.");
    }

    console.log(`[LLM] Starting Map-Reduce analysis for ${reviews.length} reviews...`);
    const t0 = Date.now();

    // Map Phase: chunk into batches of ~30 to stay within Groq free tier TPM limits
    const chunks = chunkArray(reviews, 30);
    const chunksTotal = chunks.length;
    console.log(`[LLM] Created ${chunksTotal} chunks. Mapping in sequence (to respect rate limits)...`);

    onProgress?.({ phase: 'mapping', chunksTotal, status: 'started' });

    let chunksCompleted = 0;
    const mapResults = [];
    for (let i = 0; i < chunks.length; i++) {
        const result = await analyzeChunk(chunks[i], i, onProgress);
        chunksCompleted++;
        onProgress?.({ 
            phase: 'mapping', 
            chunksCompleted, 
            chunksTotal,
            progress: Math.round((chunksCompleted / chunksTotal) * 100)
        });
        mapResults.push(result);
    }

    // Filter out empty results and combine
    const validMapResults = mapResults.filter(r => r.micro_themes && r.micro_themes.length > 0);
    console.log(`[LLM] Map phase completed in ${Date.now() - t0}ms. Reducing...`);

    // Reduce Phase
    const finalReportString = await reduceInsights(validMapResults, onProgress);
    console.log(`[LLM] Reduce phase completed. Total time: ${Date.now() - t0}ms`);

    onProgress?.({ phase: 'analysis_complete', totalTime: Date.now() - t0 });
    return finalReportString;
}

module.exports = {
    generatePulseReport
};
