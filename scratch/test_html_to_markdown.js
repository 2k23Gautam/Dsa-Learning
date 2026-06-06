const sampleHtml = `<p>You are given two integers <code>num1</code> and <code>num2</code> representing an inclusive range [num1, num2].</p>
<p>The waviness of a number is defined as the total count of its peaks and valleys:</p>
<ul>
  <li>A digit is a <strong>peak</strong> if it is strictly greater than both of its immediate neighbors.</li>
  <li>A digit is a <strong>valley</strong> if it is strictly less than both of its immediate neighbors.</li>
</ul>
<p>Example 1:</p>
<pre>
Input: num1 = 3, num2 = 5
Output: 0
</pre>`;

function htmlToMarkdown(html) {
  if (!html) return '';
  
  let text = html;
  
  // Replace block elements and lists with appropriate line breaks/markdown
  text = text.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (match, code) => {
    const cleanCode = code.replace(/<[^>]+>/g, '');
    return `\n\`\`\`\n${cleanCode.trim()}\n\`\`\`\n`;
  });
  
  text = text.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (match, code) => {
    return ` \`${code.replace(/<[^>]+>/g, '')}\` `;
  });

  text = text.replace(/<strong[^>]*>([\s\S]*?)<\/strong>/gi, '**$1**');
  text = text.replace(/<b[^>]*>([\s\S]*?)<\/b>/gi, '**$1**');
  text = text.replace(/<em[^>]*>([\s\S]*?)<\/em>/gi, '*$1*');
  text = text.replace(/<i[^>]*>([\s\S]*?)<\/i>/gi, '*$1*');
  
  text = text.replace(/<li[^>]*>/gi, '\n- ');
  text = text.replace(/<\/li>/gi, '');
  text = text.replace(/<ul[^>]*>/gi, '\n');
  text = text.replace(/<\/ul>/gi, '\n');
  text = text.replace(/<ol[^>]*>/gi, '\n');
  text = text.replace(/<\/ol>/gi, '\n');
  
  text = text.replace(/<p[^>]*>/gi, '\n\n');
  text = text.replace(/<\/p>/gi, '\n');
  
  text = text.replace(/<div[^>]*>/gi, '\n');
  text = text.replace(/<\/div>/gi, '\n');
  
  text = text.replace(/<br\s*\/?>/gi, '\n');
  
  // Remove all other HTML tags
  text = text.replace(/<[^>]+>/g, ' ');
  
  // Decode HTML entities
  text = text.replace(/&nbsp;/g, ' ')
             .replace(/&lt;/g, '<')
             .replace(/&gt;/g, '>')
             .replace(/&amp;/g, '&')
             .replace(/&quot;/g, '"')
             .replace(/&#39;/g, "'");
             
  // Clean up excessive empty lines
  text = text.replace(/\n{3,}/g, '\n\n');
  
  return text.trim();
}

console.log("HTML TO MARKDOWN OUTPUT:");
console.log(htmlToMarkdown(sampleHtml));
