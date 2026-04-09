const axios = require('axios');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * Suggest metadata for a DSA problem based on the problem name/link,
 * the problem statement (if fetched), and the user's submitted solution code.
 *
 * @param {string} problemInput  - Problem name or link (fallback identifier)
 * @param {string} solutionCode  - User's solution code
 * @param {string} problemStatement - Full problem statement text (optional)
 */
async function suggestProblemMetadata(problemInput, solutionCode = "", problemStatement = "") {
  const groqKey = process.env.GROQ_API_KEY;

  if (!groqKey) {
    throw new Error("GROQ_API_KEY is not configured in .env");
  }

  const hasSolution = solutionCode && solutionCode.trim().length > 0;
  const hasStatement = problemStatement && problemStatement.trim().length > 0;
  const hasContext = problemInput && problemInput !== 'Unknown Problem';

  const prompt = `You are a world-class DSA (Data Structures & Algorithms) coach and competitive programmer. Your task is to analyze the given information and return a precise JSON object.

${hasStatement ? `## Problem Statement\n${problemStatement.trim()}` : hasContext ? `## Problem\n"${problemInput}"` : ''}

${hasSolution ? `## User's Solution Code\n\`\`\`\n${solutionCode.trim()}\n\`\`\`` : ''}

## Your Task
Analyze BOTH the problem statement and the user's solution code. Extract the following fields cleanly to be used by the student for revision.

- **topics**: List the core DSA topics this problem tests (array of strings, e.g. ["Array"]).
- **patterns**: List the key algorithmic patterns (array of strings, e.g. ["Two Pointers"]).
- **difficulty**: "Easy", "Medium", or "Hard".
- **timeComplexity**: Strictly Big-O notation, e.g. "O(n)".
- **spaceComplexity**: Strictly Big-O notation, e.g. "O(1)".
- **suggestedApproach**: A detailed, highly-structured markdown explanation. Ensure the output feels modern and premium by using blockquotes (\`>\`) for the main intuition, numbered lists with bolded action names, horizontal rules (\`---\`) for sectioning, and a clean Markdown Table for the Complexity breakdown. You MUST output this EXACT visually advanced layout:

## Output Format
You MUST structure your response EXACTLY like this (JSON first, then the Markdown approach between delimiters):

{
  "topics": ["Array"],
  "difficulty": "Medium",
  "patterns": ["Two Pointers"],
  "timeComplexity": "O(n)",
  "spaceComplexity": "O(1)"
}
===APPROACH_START===
> ### Core Intuition
> [Write an insightful 2-3 sentence summary of the core logic doing the heavy lifting]

---

### Step-by-Step Execution

1. **[Action Name]:** [Detailed step explanation...]
2. **[Action Name]:** [Detailed step explanation...]

---

### Identifying Patterns

- **Algorithmic Pattern:** \`[Pattern 1]\`
- **Core Topics:** \`[Topic 1]\`, \`[Topic 2]\`

---

### Complexity Analysis

| Type | Big-O | Explanation |
| :--- | :--- | :--- |
| **Time** | **\`O(n)\`** | [1-sentence reason, e.g., Single pass through the array] |
| **Space** | **\`O(1)\`** | [1-sentence reason, e.g., Only constant extra variables used] |
===APPROACH_END===
`;

  // ─── Try Groq (llama-3.3-70b-versatile) ───────────────
  if (groqKey) {
    const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
    
    const groqModels = [
      "llama-3.3-70b-versatile",
      "mixtral-8x7b-32768"
    ];

    let lastError = "Unknown error";
    for (const MODEL of groqModels) {
      try {
        console.log(`[AI] Trying Groq ${MODEL}...`);
        const response = await axios.post(
          GROQ_URL,
          {
            model: MODEL,
            messages: [
              {
                role: "system",
                content: "You are a world-class DSA expert. Follow the exact requested format delimited by ===APPROACH_START===."
              },
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.2,
            max_tokens: 1500
          },
          {
            headers: {
              "Authorization": `Bearer ${groqKey}`,
              "Content-Type": "application/json"
            },
            timeout: 20000
          }
        );

        const text = response.data?.choices?.[0]?.message?.content;
        console.log(`[AI] Groq (${MODEL}) response received.`);
        return parseAiResponse(text);
      } catch (err) {
        lastError = err.response?.data?.error?.message || err.message;
        console.warn(`[AI] Groq ${MODEL} failed:`, lastError);
        // If it's a hard error like 404 or missing model, we can continue to fallback
        if (!lastError.includes('rate_limit') && !lastError.includes('model') && !lastError.includes('404')) {
          break;
        }
      }
    }
    console.log(`[AI] All Groq models failed. Last error: ${lastError}`);
    throw new Error(`AI Request Failed: ${lastError}`);
  }
}

/**
 * Parse and sanitize the AI response
 */
function parseAiResponse(text) {
  if (!text) throw new Error("Empty response from AI");

  let jsonPart = text;
  let approachPart = "";

  if (text.includes("===APPROACH_START===")) {
    const parts = text.split("===APPROACH_START===");
    jsonPart = parts[0];
    approachPart = parts[1].replace("===APPROACH_END===", "").trim();
  }

  // Strip markdown code fences if present around the JSON
  const jsonStr = jsonPart.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '').trim();
  let raw = {};
  try {
    raw = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error("AI output was not valid JSON: " + e.message);
  }

  // Helper to get a field by multiple possible key names (case-insensitive)
  const get = (keys) => {
    for (const k of keys) {
      if (raw[k] !== undefined) return raw[k];
      const lk = k.toLowerCase();
      if (raw[lk] !== undefined) return raw[lk];
    }
    return null;
  };


  // Sanitize arrays
  const toArray = (val) => {
    if (!val) return [];
    if (Array.isArray(val)) return val.filter(v => typeof v === 'string' && v.trim());
    if (typeof val === 'string') return [val.trim()].filter(Boolean);
    return [];
  };

  return {
    topics: toArray(get(['topics'])),
    patterns: toArray(get(['patterns'])),
    difficulty: get(['difficulty']) || "",
    timeComplexity: get(['timeComplexity', 'time_complexity']) || "",
    spaceComplexity: get(['spaceComplexity', 'space_complexity']) || "",
    suggestedApproach: approachPart || get(['suggestedApproach', 'approach', 'suggested_approach']) || ""
  };
}

module.exports = { suggestProblemMetadata };
