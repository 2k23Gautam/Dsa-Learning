const examples = [
  "3753. Total Waviness of Numbers in Range II Solved Hard Topics premium lock icon Companies Hint You are given two integers num1 and num2 representing an inclusive range [num1, num2].",
  "Total Waviness of Numbers in Range II Solved Hard Topics premium lock icon Companies Hint You are given two integers num1 and num2",
  "Solved Hard Topics premium lock icon Companies Hint You are given two integers",
  "3753. Total Waviness of Numbers in Range II Easy Topics Companies Hint You are given two integers",
  "3753. Total Waviness of Numbers in Range II Solved Medium Topics Companies Hint 1 Hint 2 You are given two integers",
  "Some random description without boilerplate starts here."
];

function cleanProblemStatement(text) {
  if (!text) return '';
  
  let cleaned = text;

  // Pattern 1: Title + Boilerplate prefix
  cleaned = cleaned.replace(/^\s*(?:\d+\.\s+)?[^\n]+?\b(?:Solved|Easy|Medium|Hard)\b[\s,]*\b(?:Topics|Companies|Hint|premium\s+lock\s+icon)\b[\s\S]*?\b(?:Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon)\b\s*/i, '');

  // Pattern 2: Just boilerplate prefix
  cleaned = cleaned.replace(/^\s*(?:Solved|Easy|Medium|Hard|Topics|Companies|Hint(?:\s+\d+)?|premium\s+lock\s+icon|\s)+/i, '');

  // Clean standalone residual boilerplate words
  cleaned = cleaned.replace(/\bpremium\s+lock\s+icon\b/gi, '');

  // Clean multiple spaces
  cleaned = cleaned.replace(/\s{2,}/g, ' ').trim();

  return cleaned;
}

examples.forEach((ex, idx) => {
  console.log(`Example ${idx + 1}:`);
  console.log(`Original: "${ex}"`);
  console.log(`Cleaned:  "${cleanProblemStatement(ex)}"`);
  console.log("----------------------------------------");
});
