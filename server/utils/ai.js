const { GoogleGenerativeAI } = require('@google/generative-ai');

function cleanString(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function cleanArray(value) {
  if (!Array.isArray(value)) return [];
  return value.map(cleanString).filter(Boolean);
}

function cleanComplexityString(str) {
  if (!str) return '';
  let clean = str.replace(/^\$\$?|\$\$?$/g, '').trim();
  clean = clean.replace(/\\times/g, '×').replace(/\\cdot/g, '·');
  clean = clean.replace(/\\log/g, 'log');
  clean = clean.replace(/\\/g, '');
  clean = clean.replace(/_\{([^}]+)\}/g, '_$1');
  clean = clean.replace(/\^\{([^}]+)\}/g, '^$1');
  clean = clean.replace(/\{([^}]+)\}/g, '$1');
  clean = clean.replace(/[{}]/g, '');
  return clean;
}


function parseAiResponse(text) {
  if (!text) throw new Error('Empty response from AI');

  const getSection = (headerName) => {
    const escapedHeader = headerName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(
      `(?:#+)\\s*${escapedHeader}[\\s\\S]*?(?=(?:#+\\s*(?:Intuition|Pattern|Topics Used|Time Complexity|Space Complexity)|---|\\n#+|$))`,
      'i'
    );
    const match = text.match(regex);
    if (!match) return '';
    const headerRegex = new RegExp(`^(?:#+)\\s*${escapedHeader}\\s*`, 'i');
    return match[0].replace(headerRegex, '').trim();
  };

  const intuitionText = getSection('Intuition');
  const patternText = getSection('Pattern');
  const topicsText = getSection('Topics Used');
  const timeText = getSection('Time Complexity');
  const spaceText = getSection('Space Complexity');

  const extractBulletedItems = (sectionText) => {
    return sectionText
      .split('\n')
      .map(line => {
        const match = line.trim().match(/^[-*+]\s+(.*)$/);
        return match ? match[1].trim() : line.trim();
      })
      .filter(item => item.length > 0 && !item.startsWith('---'));
  };

  const patterns = extractBulletedItems(patternText);
  const topics = extractBulletedItems(topicsText);

  const extractComplexity = (sectionText) => {
    const lines = sectionText
      .split('\n')
      .map(l => l.trim())
      .filter(l => l.length > 0 && !l.startsWith('---') && !l.startsWith('#'));

    if (lines.length === 0) return '';

    let result = '';
    let openParens = 0;
    let closeParens = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      result += (result ? ' ' : '') + line;

      openParens = (result.match(/\(/g) || []).length;
      closeParens = (result.match(/\)/g) || []).length;

      if (openParens > 0 && openParens <= closeParens) {
        break;
      }
      if (i === 0 && openParens === 0) {
        break;
      }
    }

    return result;
  };

  const timeComplexity = cleanComplexityString(extractComplexity(timeText));
  const spaceComplexity = cleanComplexityString(extractComplexity(spaceText));

  // Fallback for summary/bruteForce/keyInsight to prevent UI empty states
  const intuitionParagraphs = intuitionText.split('\n').map(p => p.trim()).filter(p => p.length > 0);
  const summary = intuitionParagraphs[0] || 'Analyze problem and solution to build intuition.';
  
  let bruteForce = 'Identify the brute force approach and why it is too slow.';
  let keyInsight = 'Identify the key mental shift or observation.';
  let correctness = 'Verify why this approach produces correct results.';
  
  if (intuitionParagraphs.length >= 3) {
    bruteForce = intuitionParagraphs[0];
    keyInsight = intuitionParagraphs[1];
    correctness = intuitionParagraphs.slice(2).join('\n\n');
  } else if (intuitionParagraphs.length === 2) {
    bruteForce = intuitionParagraphs[0];
    keyInsight = intuitionParagraphs[1];
    correctness = intuitionParagraphs[1];
  } else if (intuitionParagraphs.length === 1) {
    bruteForce = intuitionParagraphs[0];
    keyInsight = intuitionParagraphs[0];
    correctness = intuitionParagraphs[0];
  }

  // Create steps from sentences in intuition
  const sentences = intuitionText
    .replace(/([.?!])\s*(?=[A-Z])/g, '$1|')
    .split('|')
    .map(s => s.trim())
    .filter(s => s.length > 5);

  const steps = sentences.slice(0, 8);

  return {
    topics,
    patterns,
    difficulty: '',
    timeComplexity,
    spaceComplexity,
    suggestedApproach: text, // The complete markdown is saved as the approach
    summary,
    bruteForce,
    keyInsight,
    steps,
    correctness,
    edgeCases: [],
    implementationNotes: [],
    takeaway: patterns[0] || 'DSA reasoning takeaway'
  };
}

/**
 * Analyze a problem statement together with the user's submitted solution.
 * The result is structured for both a reasoning UI and saved revision notes.
 */
async function suggestProblemMetadata(problemInput, solutionCode = '', problemStatement = '') {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (!geminiKey) throw new Error('GEMINI_API_KEY is not configured in .env');

  const statement = cleanString(problemStatement).slice(0, 14000);
  const code = cleanString(solutionCode).slice(0, 14000);
  const identifier = cleanString(problemInput) || 'Unknown Problem';

  const prompt = `You are an expert DSA educator.

For every LeetCode/GFG problem and solution provided, generate an explanation in the following format:

# Intuition

- Focus on HOW TO THINK about the solution, not line-by-line code explanation.
- Start from the brute force thought process.
- Explain why brute force is too slow.
- Explain the key observation that leads to the optimal solution.
- Explain why the chosen technique (Binary Search, Sliding Window, DP, Monotonic Stack, Graph, etc.) naturally follows from that observation.
- If binary search is used, clearly explain:
  - what answer/value is being binary searched,
  - why the search space is monotonic,
  - why count >= target and count < target move left/right.
  - If the condition is count >= k, explain with an example why both count == k and count > k move left.
- If sliding window is used, explain:
  - why the window is valid,
  - why r-l+1 subarrays are added whenever applicable.
- If monotonic stack is used, explain:
  - what elements are being eliminated,
  - why each element is pushed/popped at most once.
- If DP/Digit DP is used, explain:
  - what the state represents,
  - why those states are sufficient,
  - what information is carried forward.
- Write intuition in paragraph form similar to a human interview discussion.
- Avoid excessive code explanation.
- Focus on the reasoning that leads to the solution.

---

# Pattern

Mention the high-level pattern.

Examples:

- Binary Search on Answer
- Sliding Window
- Monotonic Stack
- Digit DP
- Two Pointers
- Greedy
- Graph Traversal
- Prefix Sum
- Dynamic Programming

---

# Topics Used

List the topics.

Example:

- Arrays
- Binary Search
- Greedy

---

# Time Complexity

Provide complexity with reasoning. Ensure it is mathematically correct and precisely reflects the state space and transitions. For dynamic programming (DP / Digit DP), the time complexity must be exactly O(number of states * transition time per state). For example, if the state space has dimensions L * D * D and we iterate through D choices per transition, the time complexity is O(L * D^3) (or O(L * 11 * 11 * 10) = O(L * D^3)), not O(L * D^2).

Example:

O(n log n)

because sorting takes O(n log n).

---

# Space Complexity

Provide auxiliary space complexity. For dynamic programming (DP / Digit DP), the auxiliary space complexity is exactly O(number of states) if using memoization, or O(1) if space-optimized.

Example:

O(1)

---

# Example 1

Problem:
69. Sqrt(x)

Solution Idea:
Binary Search on Answer

Output:

# Intuition

The brute force approach would be to try every integer from 0 up to x and check whose square is equal to or just smaller than x. However, x can be as large as 2³¹−1, making linear search too expensive.

The key observation is that the answer is bounded between 0 and x. If some number mid satisfies mid² ≤ x, then every number smaller than mid will also satisfy the condition. Similarly, if mid² > x, then every number larger than mid will also fail. This creates a monotonic search space, which is exactly what binary search requires.

Rather than searching for the square root directly, we search for the largest number whose square does not exceed x. Whenever mid² ≤ x, we try larger values because a better answer may exist. Otherwise, we move left. The final valid value becomes the floor square root.

# Pattern

- Binary Search on Answer

# Topics Used

- Binary Search
- Math

# Time Complexity

O(log x)

# Space Complexity

O(1)

---

# Example 2

Problem:
713. Subarray Product Less Than K

Solution Idea:
Sliding Window

Output:

# Intuition

The brute force solution would generate all subarrays and compute their products, resulting in O(n²) subarrays and even higher complexity if products are recomputed repeatedly.

The important observation is that all numbers are positive. Because of this, whenever the product becomes too large, extending the window further can only make it larger. This monotonic behavior suggests a sliding window.

We maintain a window whose product is always less than k. Whenever the product becomes greater than or equal to k, we shrink the window from the left until it becomes valid again.

Once the window [l, r] is valid, every subarray ending at r and starting anywhere between l and r is also valid. There are exactly:

r - l + 1

such subarrays:

[r]
[r-1, r]
[r-2, r]
...
[l, r]

Therefore we add r−l+1 to the answer at every step.

# Pattern

- Sliding Window

# Topics Used

- Two Pointers
- Sliding Window

# Time Complexity

O(n)

# Space Complexity

O(1)

---

# Example 3

Problem:
668. Kth Smallest Number in Multiplication Table

Solution Idea:
Binary Search on Answer

Output:

# Intuition

Generating all m×n values and sorting them is impossible for large constraints. Instead of asking for the kth smallest number directly, we ask a different question:

"How many numbers in the multiplication table are less than or equal to X?"

If we can answer this efficiently, then we can binary search for the smallest value whose count reaches at least k.

For a row that starts with i, the elements are:

i, 2i, 3i, ... , ni

The count of values less than or equal to X in this row is:

min(n, X / i)

Summing this over all rows gives the total count.

Now suppose k = 5.

If count(X) = 3, then there are only 3 elements ≤ X, meaning the 5th element must be larger. So we move right.

If count(X) = 5, then X could be the answer, but a smaller valid value may still exist. So we move left.

If count(X) = 8, then X is definitely large enough, but again a smaller valid value may still satisfy the condition. So we move left.

Thus whenever count(X) >= k we search left because we are looking for the FIRST value whose count reaches at least k. This is exactly lower bound binary search on the answer.

# Pattern

- Binary Search on Answer
- Kth Smallest Element

# Topics Used

- Binary Search
- Counting
- Matrix

# Time Complexity

O(m log(m*n))

# Space Complexity

O(1)

---

Now use the same style and formatting for the following problem and solution:

Problem:
${identifier}
${statement || 'Not available. Infer from the solution code.'}

Solution:
${code || 'No solution code supplied.'}`;

  const genAI = new GoogleGenerativeAI(geminiKey);
  const models = ['gemini-3.5-flash', 'gemini-3.1-pro-preview'];
  let lastError = 'Unknown error';

  for (const modelName of models) {
    try {
      console.log(`[AI] Trying Gemini ${modelName}...`);
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: "You are a precise DSA educator. Respond in the exact format requested.",
        generationConfig: {
          temperature: 0.15,
        }
      });

      const result = await model.generateContent(prompt);
      const responseText = result.response.text();
      if (!responseText) {
        throw new Error('Empty response text from Gemini');
      }

      return parseAiResponse(responseText);
    } catch (error) {
      lastError = error.message;
      console.warn(`[AI] Gemini ${modelName} failed:`, lastError);
    }
  }

  throw new Error(`AI request failed: ${lastError}`);
}

module.exports = { suggestProblemMetadata };
