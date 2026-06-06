const cases = [
  `3753. Total Waviness of Numbers in Range II
Solved
Hard
Topics
Companies
Hint
You are given two integers num1 and num2 representing an inclusive range [num1, num2].`,
  `3753. Total Waviness of Numbers in Range II Solved Hard Topics Companies Hint You are given two integers num1 and num2 representing an inclusive range [num1, num2].`
];

function cleanProblemStatement(text) {
  if (!text) return '';
  
  let cleaned = text;

  // Pattern 1: Title + Boilerplate prefix
  cleaned = cleaned.replace(/^\s*(?:\d+\.\s+)?[\s\S]+?\b(?:Solved|Easy|Medium|Hard)\b[\s,]*\b(?:Topics|Companies|Hint|premium\s+lock\s+icon)\b[\s\S]*?\b(?:Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon)\b\s*/i, '');

  // Pattern 2: Just boilerplate prefix
  cleaned = cleaned.replace(/^\s*(?:Solved|Easy|Medium|Hard|Topics|Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon|\s)+/i, '');

  // Clean standalone residual boilerplate words
  cleaned = cleaned.replace(/\bpremium\s+lock\s+icon\b/gi, '');

  // Clean multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

cases.forEach((ex, idx) => {
  console.log(`Case ${idx + 1}:`);
  console.log(`Cleaned: "${cleanProblemStatement(ex)}"`);
});
