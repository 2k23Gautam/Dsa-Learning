const fs = require('fs');
const readline = require('readline');
const path = require('path');

async function parse() {
  const filePath = "C:\\Users\\mg932\\.gemini\\antigravity\\brain\\0af6f622-44b6-4b97-94be-6c539c9f9a0a\\.system_generated\\logs\\transcript.jsonl";
  const fileStream = fs.createReadStream(filePath);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  let stepIdx = 0;
  for await (const line of rl) {
    stepIdx++;
    try {
      const data = JSON.parse(line);
      const isUser = data.type === 'USER_INPUT';
      const isPlanner = data.type === 'PLANNER_RESPONSE';
      if (isUser || isPlanner) {
        const text = data.content || '';
        if (text.includes('Complexity') || text.includes('complexity') || text.includes('O(') || text.includes('bracket') || text.includes('10')) {
          console.log(`\n--- STEP ${stepIdx} [${data.type}] ---`);
          console.log(text.substring(0, 1000));
        }
      }
    } catch (err) {
      // Ignore parse errors
    }
  }
}

parse();
