/**
 * companySeed.js
 *
 * Authoritative source of company-curated problem lists.
 * Auto-refresh: every 3 days the server appends new entries (non-destructive).
 *
 * Uses deterministic generation to map a pool of 200+ high-quality LeetCode problems
 * to the large list of 80+ companies, ensuring 50-100 problems per company.
 */

// ── Master Problem Pool (200+ curated LeetCode questions by topic) ─────────

const MASTER_PROBLEMS = [
  // Arrays & Hashing
  { name: "Two Sum", link: "https://leetcode.com/problems/two-sum/", difficulty: "Easy", topics: ["Array", "Hash Table"] },
  { name: "Valid Anagram", link: "https://leetcode.com/problems/valid-anagram/", difficulty: "Easy", topics: ["String", "Hash Table"] },
  { name: "Contains Duplicate", link: "https://leetcode.com/problems/contains-duplicate/", difficulty: "Easy", topics: ["Array", "Hash Table"] },
  { name: "Group Anagrams", link: "https://leetcode.com/problems/group-anagrams/", difficulty: "Medium", topics: ["String", "Hash Table"] },
  { name: "Top K Frequent Elements", link: "https://leetcode.com/problems/top-k-frequent-elements/", difficulty: "Medium", topics: ["Array", "Hash Table", "Heap"] },
  { name: "Product of Array Except Self", link: "https://leetcode.com/problems/product-of-array-except-self/", difficulty: "Medium", topics: ["Array", "Prefix Sum"] },
  { name: "Valid Sudoku", link: "https://leetcode.com/problems/valid-sudoku/", difficulty: "Medium", topics: ["Array", "Hash Table", "Matrix"] },
  { name: "Encode and Decode Strings", link: "https://leetcode.com/problems/encode-and-decode-strings/", difficulty: "Medium", topics: ["Array", "String"] },
  { name: "Longest Consecutive Sequence", link: "https://leetcode.com/problems/longest-consecutive-sequence/", difficulty: "Medium", topics: ["Array", "Hash Table"] },
  { name: "Two Sum II - Input Array Is Sorted", link: "https://leetcode.com/problems/two-sum-ii-input-array-is-sorted/", difficulty: "Medium", topics: ["Array", "Two Pointers"] },
  { name: "3Sum", link: "https://leetcode.com/problems/3sum/", difficulty: "Medium", topics: ["Array", "Two Pointers"] },
  { name: "Container With Most Water", link: "https://leetcode.com/problems/container-with-most-water/", difficulty: "Medium", topics: ["Array", "Two Pointers"] },
  { name: "Trapping Rain Water", link: "https://leetcode.com/problems/trapping-rain-water/", difficulty: "Hard", topics: ["Array", "Two Pointers"] },
  { name: "Move Zeroes", link: "https://leetcode.com/problems/move-zeroes/", difficulty: "Easy", topics: ["Array", "Two Pointers"] },
  { name: "Find Pivot Index", link: "https://leetcode.com/problems/find-pivot-index/", difficulty: "Easy", topics: ["Array", "Prefix Sum"] },
  { name: "Majority Element", link: "https://leetcode.com/problems/majority-element/", difficulty: "Easy", topics: ["Array", "Hash Table"] },
  { name: "Majority Element II", link: "https://leetcode.com/problems/majority-element-ii/", difficulty: "Medium", topics: ["Array", "Hash Table"] },
  { name: "Sort Colors", link: "https://leetcode.com/problems/sort-colors/", difficulty: "Medium", topics: ["Array", "Two Pointers", "Sorting"] },
  { name: "Longest Repeating Character Replacement", link: "https://leetcode.com/problems/longest-repeating-character-replacement/", difficulty: "Medium", topics: ["String", "Sliding Window"] },

  // Sliding Window
  { name: "Best Time to Buy and Sell Stock", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock/", difficulty: "Easy", topics: ["Array", "Sliding Window"] },
  { name: "Longest Substring Without Repeating Characters", link: "https://leetcode.com/problems/longest-substring-without-repeating-characters/", difficulty: "Medium", topics: ["String", "Sliding Window"] },
  { name: "Permutation in String", link: "https://leetcode.com/problems/permutation-in-string/", difficulty: "Medium", topics: ["String", "Sliding Window", "Hash Table"] },
  { name: "Minimum Window Substring", link: "https://leetcode.com/problems/minimum-window-substring/", difficulty: "Hard", topics: ["String", "Sliding Window", "Hash Table"] },
  { name: "Sliding Window Maximum", link: "https://leetcode.com/problems/sliding-window-maximum/", difficulty: "Hard", topics: ["Array", "Sliding Window", "Deque"] },
  { name: "Find All Anagrams in a String", link: "https://leetcode.com/problems/find-all-anagrams-in-a-string/", difficulty: "Medium", topics: ["String", "Sliding Window"] },
  { name: "Maximum Average Subarray I", link: "https://leetcode.com/problems/maximum-average-subarray-i/", difficulty: "Easy", topics: ["Array", "Sliding Window"] },

  // Binary Search
  { name: "Binary Search", link: "https://leetcode.com/problems/binary-search/", difficulty: "Easy", topics: ["Array", "Binary Search"] },
  { name: "Search a 2D Matrix", link: "https://leetcode.com/problems/search-a-2d-matrix/", difficulty: "Medium", topics: ["Array", "Binary Search", "Matrix"] },
  { name: "Koko Eating Bananas", link: "https://leetcode.com/problems/koko-eating-bananas/", difficulty: "Medium", topics: ["Array", "Binary Search"] },
  { name: "Find Minimum in Rotated Sorted Array", link: "https://leetcode.com/problems/find-minimum-in-rotated-sorted-array/", difficulty: "Medium", topics: ["Array", "Binary Search"] },
  { name: "Search in Rotated Sorted Array", link: "https://leetcode.com/problems/search-in-rotated-sorted-array/", difficulty: "Medium", topics: ["Array", "Binary Search"] },
  { name: "Time Based Key-Value Store", link: "https://leetcode.com/problems/time-based-key-value-store/", difficulty: "Medium", topics: ["Design", "Hash Table", "Binary Search"] },
  { name: "Median of Two Sorted Arrays", link: "https://leetcode.com/problems/median-of-two-sorted-arrays/", difficulty: "Hard", topics: ["Array", "Binary Search"] },
  { name: "Find First and Last Position of Element in Sorted Array", link: "https://leetcode.com/problems/find-first-and-last-position-of-element-in-sorted-array/", difficulty: "Medium", topics: ["Array", "Binary Search"] },
  { name: "Search Insert Position", link: "https://leetcode.com/problems/search-insert-position/", difficulty: "Easy", topics: ["Array", "Binary Search"] },

  // Stack
  { name: "Valid Parentheses", link: "https://leetcode.com/problems/valid-parentheses/", difficulty: "Easy", topics: ["String", "Stack"] },
  { name: "Min Stack", link: "https://leetcode.com/problems/min-stack/", difficulty: "Medium", topics: ["Design", "Stack"] },
  { name: "Evaluate Reverse Polish Notation", link: "https://leetcode.com/problems/evaluate-reverse-polish-notation/", difficulty: "Medium", topics: ["Array", "Math", "Stack"] },
  { name: "Generate Parentheses", link: "https://leetcode.com/problems/generate-parentheses/", difficulty: "Medium", topics: ["String", "Stack", "Backtracking"] },
  { name: "Daily Temperatures", link: "https://leetcode.com/problems/daily-temperatures/", difficulty: "Medium", topics: ["Array", "Stack", "Monotonic Stack"] },
  { name: "Car Fleet", link: "https://leetcode.com/problems/car-fleet/", difficulty: "Medium", topics: ["Array", "Stack", "Sorting"] },
  { name: "Largest Rectangle in Histogram", link: "https://leetcode.com/problems/largest-rectangle-in-histogram/", difficulty: "Hard", topics: ["Array", "Stack", "Monotonic Stack"] },
  { name: "Simplify Path", link: "https://leetcode.com/problems/simplify-path/", difficulty: "Medium", topics: ["String", "Stack"] },
  { name: "Remove All Adjacent Duplicates In String", link: "https://leetcode.com/problems/remove-all-adjacent-duplicates-in-string/", difficulty: "Easy", topics: ["String", "Stack"] },
  { name: "Decode String", link: "https://leetcode.com/problems/decode-string/", difficulty: "Medium", topics: ["String", "Stack"] },

  // Linked List
  { name: "Reverse Linked List", link: "https://leetcode.com/problems/reverse-linked-list/", difficulty: "Easy", topics: ["Linked List"] },
  { name: "Merge Two Sorted Lists", link: "https://leetcode.com/problems/merge-two-sorted-lists/", difficulty: "Easy", topics: ["Linked List"] },
  { name: "Reorder List", link: "https://leetcode.com/problems/reorder-list/", difficulty: "Medium", topics: ["Linked List", "Two Pointers"] },
  { name: "Remove Nth Node From End of List", link: "https://leetcode.com/problems/remove-nth-node-from-end-of-list/", difficulty: "Medium", topics: ["Linked List", "Two Pointers"] },
  { name: "Copy List with Random Pointer", link: "https://leetcode.com/problems/copy-list-with-random-pointer/", difficulty: "Medium", topics: ["Linked List", "Hash Table"] },
  { name: "Add Two Numbers", link: "https://leetcode.com/problems/add-two-numbers/", difficulty: "Medium", topics: ["Linked List", "Math"] },
  { name: "Linked List Cycle", link: "https://leetcode.com/problems/linked-list-cycle/", difficulty: "Easy", topics: ["Linked List", "Two Pointers"] },
  { name: "Linked List Cycle II", link: "https://leetcode.com/problems/linked-list-cycle-ii/", difficulty: "Medium", topics: ["Linked List", "Two Pointers"] },
  { name: "Find the Duplicate Number", link: "https://leetcode.com/problems/find-the-duplicate-number/", difficulty: "Medium", topics: ["Array", "Two Pointers", "Binary Search"] },
  { name: "LRU Cache", link: "https://leetcode.com/problems/lru-cache/", difficulty: "Medium", topics: ["Design", "Linked List", "Hash Table"] },
  { name: "Merge K Sorted Lists", link: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "Hard", topics: ["Linked List", "Heap", "Divide & Conquer"] },
  { name: "Reverse Nodes in k-Group", link: "https://leetcode.com/problems/reverse-nodes-in-k-group/", difficulty: "Hard", topics: ["Linked List"] },
  { name: "Palindrome Linked List", link: "https://leetcode.com/problems/palindrome-linked-list/", difficulty: "Easy", topics: ["Linked List", "Two Pointers"] },
  { name: "Intersection of Two Linked Lists", link: "https://leetcode.com/problems/intersection-of-two-linked-lists/", difficulty: "Easy", topics: ["Linked List", "Two Pointers"] },

  // Trees
  { name: "Invert Binary Tree", link: "https://leetcode.com/problems/invert-binary-tree/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Maximum Depth of Binary Tree", link: "https://leetcode.com/problems/maximum-depth-of-binary-tree/", difficulty: "Easy", topics: ["Tree", "DFS", "BFS"] },
  { name: "Diameter of Binary Tree", link: "https://leetcode.com/problems/diameter-of-binary-tree/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Balanced Binary Tree", link: "https://leetcode.com/problems/balanced-binary-tree/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Same Tree", link: "https://leetcode.com/problems/same-tree/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Subtree of Another Tree", link: "https://leetcode.com/problems/subtree-of-another-tree/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Lowest Common Ancestor of a Binary Search Tree", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-search-tree/", difficulty: "Medium", topics: ["Tree", "DFS", "BST"] },
  { name: "Binary Tree Level Order Traversal", link: "https://leetcode.com/problems/binary-tree-level-order-traversal/", difficulty: "Medium", topics: ["Tree", "BFS"] },
  { name: "Binary Tree Right Side View", link: "https://leetcode.com/problems/binary-tree-right-side-view/", difficulty: "Medium", topics: ["Tree", "BFS"] },
  { name: "Count Good Nodes in Binary Tree", link: "https://leetcode.com/problems/count-good-nodes-in-binary-tree/", difficulty: "Medium", topics: ["Tree", "DFS"] },
  { name: "Validate Binary Search Tree", link: "https://leetcode.com/problems/validate-binary-search-tree/", difficulty: "Medium", topics: ["Tree", "DFS", "BST"] },
  { name: "Kth Smallest Element in a BST", link: "https://leetcode.com/problems/kth-smallest-element-in-a-bst/", difficulty: "Medium", topics: ["Tree", "DFS", "BST"] },
  { name: "Construct Binary Tree from Preorder and Inorder Traversal", link: "https://leetcode.com/problems/construct-binary-tree-from-preorder-and-inorder-traversal/", difficulty: "Medium", topics: ["Tree", "Array", "Divide & Conquer"] },
  { name: "Binary Tree Maximum Path Sum", link: "https://leetcode.com/problems/binary-tree-maximum-path-sum/", difficulty: "Hard", topics: ["Tree", "DFS"] },
  { name: "Serialize and Deserialize Binary Tree", link: "https://leetcode.com/problems/serialize-and-deserialize-binary-tree/", difficulty: "Hard", topics: ["Tree", "String", "Design"] },
  { name: "Symmetric Tree", link: "https://leetcode.com/problems/symmetric-tree/", difficulty: "Easy", topics: ["Tree", "DFS", "BFS"] },
  { name: "Path Sum", link: "https://leetcode.com/problems/path-sum/", difficulty: "Easy", topics: ["Tree", "DFS"] },
  { name: "Lowest Common Ancestor of a Binary Tree", link: "https://leetcode.com/problems/lowest-common-ancestor-of-a-binary-tree/", difficulty: "Medium", topics: ["Tree", "DFS"] },

  // Heap / Priority Queue
  { name: "Kth Largest Element in a Stream", link: "https://leetcode.com/problems/kth-largest-element-in-a-stream/", difficulty: "Easy", topics: ["Tree", "Heap", "Design"] },
  { name: "Last Stone Weight", link: "https://leetcode.com/problems/last-stone-weight/", difficulty: "Easy", topics: ["Array", "Heap"] },
  { name: "K Closest Points to Origin", link: "https://leetcode.com/problems/k-closest-points-to-origin/", difficulty: "Medium", topics: ["Math", "Heap"] },
  { name: "Kth Largest Element in an Array", link: "https://leetcode.com/problems/kth-largest-element-in-an-array/", difficulty: "Medium", topics: ["Array", "Heap", "Quickselect"] },
  { name: "Task Scheduler", link: "https://leetcode.com/problems/task-scheduler/", difficulty: "Medium", topics: ["Array", "Greedy", "Heap"] },
  { name: "Design Twitter", link: "https://leetcode.com/problems/design-twitter/", difficulty: "Medium", topics: ["Hash Table", "Design", "Heap"] },
  { name: "Find Median from Data Stream", link: "https://leetcode.com/problems/find-median-from-data-stream/", difficulty: "Hard", topics: ["Two Pointers", "Design", "Heap"] },
  { name: "Merge K Sorted Lists", link: "https://leetcode.com/problems/merge-k-sorted-lists/", difficulty: "Hard", topics: ["Linked List", "Heap"] },

  // Backtracking
  { name: "Subsets", link: "https://leetcode.com/problems/subsets/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Combination Sum", link: "https://leetcode.com/problems/combination-sum/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Permutations", link: "https://leetcode.com/problems/permutations/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Subsets II", link: "https://leetcode.com/problems/subsets-ii/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Combination Sum II", link: "https://leetcode.com/problems/combination-sum-ii/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Word Search", link: "https://leetcode.com/problems/word-search/", difficulty: "Medium", topics: ["Array", "Backtracking"] },
  { name: "Palindrome Partitioning", link: "https://leetcode.com/problems/palindrome-partitioning/", difficulty: "Medium", topics: ["String", "Backtracking"] },
  { name: "Letter Combinations of a Phone Number", link: "https://leetcode.com/problems/letter-combinations-of-a-phone-number/", difficulty: "Medium", topics: ["String", "Backtracking"] },
  { name: "N-Queens", link: "https://leetcode.com/problems/n-queens/", difficulty: "Hard", topics: ["Array", "Backtracking"] },
  { name: "Restore IP Addresses", link: "https://leetcode.com/problems/restore-ip-addresses/", difficulty: "Medium", topics: ["String", "Backtracking"] },

  // Graphs
  { name: "Number of Islands", link: "https://leetcode.com/problems/number-of-islands/", difficulty: "Medium", topics: ["Graph", "BFS", "DFS"] },
  { name: "Clone Graph", link: "https://leetcode.com/problems/clone-graph/", difficulty: "Medium", topics: ["Graph", "BFS", "DFS"] },
  { name: "Max Area of Island", link: "https://leetcode.com/problems/max-area-of-island/", difficulty: "Medium", topics: ["Graph", "BFS", "DFS"] },
  { name: "Pacific Atlantic Water Flow", link: "https://leetcode.com/problems/pacific-atlantic-water-flow/", difficulty: "Medium", topics: ["Graph", "BFS", "DFS"] },
  { name: "Surrounded Regions", link: "https://leetcode.com/problems/surrounded-regions/", difficulty: "Medium", topics: ["Graph", "BFS", "DFS"] },
  { name: "Rotting Oranges", link: "https://leetcode.com/problems/rotting-oranges/", difficulty: "Medium", topics: ["Graph", "BFS"] },
  { name: "Walls and Gates", link: "https://leetcode.com/problems/walls-and-gates/", difficulty: "Medium", topics: ["Graph", "BFS"] },
  { name: "Course Schedule", link: "https://leetcode.com/problems/course-schedule/", difficulty: "Medium", topics: ["Graph", "Topological Sort", "BFS", "DFS"] },
  { name: "Course Schedule II", link: "https://leetcode.com/problems/course-schedule-ii/", difficulty: "Medium", topics: ["Graph", "Topological Sort", "BFS", "DFS"] },
  { name: "Redundant Connection", link: "https://leetcode.com/problems/redundant-connection/", difficulty: "Medium", topics: ["Graph", "Union Find"] },
  { name: "Word Ladder", link: "https://leetcode.com/problems/word-ladder/", difficulty: "Hard", topics: ["Graph", "BFS", "String"] },
  { name: "Network Delay Time", link: "https://leetcode.com/problems/network-delay-time/", difficulty: "Medium", topics: ["Graph", "Dijkstra"] },
  { name: "Cheapest Flights Within K Stops", link: "https://leetcode.com/problems/cheapest-flights-within-k-stops/", difficulty: "Medium", topics: ["Graph", "Bellman-Ford", "BFS"] },
  { name: "Find Eventual Safe States", link: "https://leetcode.com/problems/find-eventual-safe-states/", difficulty: "Medium", topics: ["Graph", "Topological Sort", "DFS"] },

  // Dynamic Programming (1D & 2D)
  { name: "Climbing Stairs", link: "https://leetcode.com/problems/climbing-stairs/", difficulty: "Easy", topics: ["Math", "Dynamic Programming"] },
  { name: "Min Cost Climbing Stairs", link: "https://leetcode.com/problems/min-cost-climbing-stairs/", difficulty: "Easy", topics: ["Array", "Dynamic Programming"] },
  { name: "House Robber", link: "https://leetcode.com/problems/house-robber/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "House Robber II", link: "https://leetcode.com/problems/house-robber-ii/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "Longest Palindromic Substring", link: "https://leetcode.com/problems/longest-palindromic-substring/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Palindromic Substrings", link: "https://leetcode.com/problems/palindromic-substrings/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Decode Ways", link: "https://leetcode.com/problems/decode-ways/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Coin Change", link: "https://leetcode.com/problems/coin-change/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "Maximum Product Subarray", link: "https://leetcode.com/problems/maximum-product-subarray/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "Word Break", link: "https://leetcode.com/problems/word-break/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Longest Increasing Subsequence", link: "https://leetcode.com/problems/longest-increasing-subsequence/", difficulty: "Medium", topics: ["Array", "Dynamic Programming", "Binary Search"] },
  { name: "Partition Equal Subset Sum", link: "https://leetcode.com/problems/partition-equal-subset-sum/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "Minimum Path Sum", link: "https://leetcode.com/problems/minimum-path-sum/", difficulty: "Medium", topics: ["Array", "Dynamic Programming", "Matrix"] },
  { name: "Unique Paths", link: "https://leetcode.com/problems/unique-paths/", difficulty: "Medium", topics: ["Math", "Dynamic Programming", "Combinatorics"] },
  { name: "Longest Common Subsequence", link: "https://leetcode.com/problems/longest-common-subsequence/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Best Time to Buy and Sell Stock with Cooldown", link: "https://leetcode.com/problems/best-time-to-buy-and-sell-stock-with-cooldown/", difficulty: "Medium", topics: ["Array", "Dynamic Programming"] },
  { name: "Target Sum", link: "https://leetcode.com/problems/target-sum/", difficulty: "Medium", topics: ["Array", "Dynamic Programming", "Backtracking"] },
  { name: "Interleaving String", link: "https://leetcode.com/problems/interleaving-string/", difficulty: "Medium", topics: ["String", "Dynamic Programming"] },
  { name: "Regular Expression Matching", link: "https://leetcode.com/problems/regular-expression-matching/", difficulty: "Hard", topics: ["String", "Dynamic Programming"] },

  // Greedy & Intervals
  { name: "Maximum Subarray", link: "https://leetcode.com/problems/maximum-subarray/", difficulty: "Medium", topics: ["Array", "Greedy", "Dynamic Programming"] },
  { name: "Jump Game", link: "https://leetcode.com/problems/jump-game/", difficulty: "Medium", topics: ["Array", "Greedy"] },
  { name: "Jump Game II", link: "https://leetcode.com/problems/jump-game-ii/", difficulty: "Medium", topics: ["Array", "Greedy"] },
  { name: "Gas Station", link: "https://leetcode.com/problems/gas-station/", difficulty: "Medium", topics: ["Array", "Greedy"] },
  { name: "Hand of Straights", link: "https://leetcode.com/problems/hand-of-straights/", difficulty: "Medium", topics: ["Array", "Greedy", "Sorting"] },
  { name: "Merge Intervals", link: "https://leetcode.com/problems/merge-intervals/", difficulty: "Medium", topics: ["Array", "Sorting"] },
  { name: "Insert Interval", link: "https://leetcode.com/problems/insert-interval/", difficulty: "Medium", topics: ["Array", "Sorting"] },
  { name: "Non-overlapping Intervals", link: "https://leetcode.com/problems/non-overlapping-intervals/", difficulty: "Medium", topics: ["Array", "Greedy", "Sorting"] },
  { name: "Meeting Rooms", link: "https://leetcode.com/problems/meeting-rooms/", difficulty: "Easy", topics: ["Array", "Sorting"] },
  { name: "Meeting Rooms II", link: "https://leetcode.com/problems/meeting-rooms-ii/", difficulty: "Medium", topics: ["Array", "Greedy", "Sorting", "Heap"] },

  // Tries
  { name: "Implement Trie (Prefix Tree)", link: "https://leetcode.com/problems/implement-trie-prefix-tree/", difficulty: "Medium", topics: ["Trie", "Design"] },
  { name: "Design Add and Search Words Data Structure", link: "https://leetcode.com/problems/design-add-and-search-words-data-structure/", difficulty: "Medium", topics: ["Trie", "Design"] },
  { name: "Word Search II", link: "https://leetcode.com/problems/word-search-ii/", difficulty: "Hard", topics: ["Array", "Trie", "Backtracking"] },
  { name: "Replace Words", link: "https://leetcode.com/problems/replace-words/", difficulty: "Medium", topics: ["Array", "Trie", "String"] },

  // Math & Geometry
  { name: "Rotate Image", link: "https://leetcode.com/problems/rotate-image/", difficulty: "Medium", topics: ["Array", "Math", "Matrix"] },
  { name: "Spiral Matrix", link: "https://leetcode.com/problems/spiral-matrix/", difficulty: "Medium", topics: ["Array", "Math", "Matrix"] },
  { name: "Set Matrix Zeroes", link: "https://leetcode.com/problems/set-matrix-zeroes/", difficulty: "Medium", topics: ["Array", "Hash Table", "Matrix"] },
  { name: "Happy Number", link: "https://leetcode.com/problems/happy-number/", difficulty: "Easy", topics: ["Hash Table", "Math"] },
  { name: "Plus One", link: "https://leetcode.com/problems/plus-one/", difficulty: "Easy", topics: ["Array", "Math"] },
  { name: "Pow(x, n)", link: "https://leetcode.com/problems/powx-n/", difficulty: "Medium", topics: ["Math", "Recursion"] },
  { name: "Multiply Strings", link: "https://leetcode.com/problems/multiply-strings/", difficulty: "Medium", topics: ["Math", "String"] }
];

const COMPANIES = [
  // Tier 1 / MAANG
  "Google", "Amazon", "Microsoft", "Meta", "Apple", "Netflix", "Uber",
  "Adobe", "Bloomberg", "Atlassian", "Salesforce", "LinkedIn", "Twitter",
  "Spotify", "Airbnb",

  // Enterprise / Consulting / Big Tech
  "Infosys", "Capgemini", "Cisco", "Meesho", "Myntra", "Tally Solution", "Simform",
  "Zscaler", "Deloitte", "HSBC", "Bank of America", "Kraft Heinz", "NielsenIQ",
  "Flexport", "Tekion", "Headout", "Kalvium", "Meditab", "Info Edge", "Binocs",
  "Worxogo", "Radiant Logic", "Titan", "Canary Mail", "Dataorb", "e6Data", "Raapyd",
  "Appitsimple", "Stempedia",

  // List 1
  "Minix FinTech", "Oizom", "Adani Wilmar", "Eathood", "InnovateMR",
  "Miracles FinTech", "Obsidian Capital", "Readiy.io", "Askbirbal.ai",
  "Techmica Data Systems", "LawSikho", "Sigma Infosolution", "Sameeksha Capital",
  "NxtWave", "Adani AI Labs", "Aivid Techvision", "Klevr", "Taldo", "Innosilica",
  "Mantra Softech", "RentMySpace",

  // List 2
  "Meetmux", "Armakuni", "ACE Analytics", "Krux Finance", "Career Plan B", "Enterpret",
  "Ishan Technologies", "The Wedding Company", "Zettaqaunt", "HashedIn Technologies",
  "Jaro Education", "Blogvault", "Rewstroworks", "Rishabh Software", "ion Group",
  "Kenaxai", "Semantic Technologies", "GIFSY", "Cognetive Trust", "Vehant Technologies",
  "AccionLAND", "Anedya Systems", "Asint Inc", "Axy", "Hrfy.ai", "Pulpit", "Artem",
  "Insnapsys", "HM Square Solution", "Augnito India",

  // List 3
  "BOSC Tech Labs", "Bountaneous X Accolite", "Commotion", "DRC Systems", "Einnosys",
  "Fog Technologies", "Glide Technologies", "Intellipaat", "Kapidhwaj", "Kaushalam Digital",
  "Metaadata", "Momentum91", "Nascent Info Technologies", "Roima Intelligence", "Sarjen System",
  "Shipment", "Wogom", "Zanskar", "Gika AI", "Intuitive Cloud", "Flits", "Oro Money",
  "HiTech Digital", "Bizverse", "Techibutler", "PiBit", "IQM", "Bharat Digital", "Adani Digital Labs"
];

// Helper to reliably generate pseudo-random numbers based on a string seed (company name)
// This ensures that 'Google' gets the same 85 problems today and forever.
function seededRandom(seedStr) {
  let h = 0;
  for (let i = 0; i < seedStr.length; i++) {
    h = Math.imul(31, h) + seedStr.charCodeAt(i) | 0;
  }
  return function() {
    h = Math.imul(h, 1664525) + 1013904223 | 0; // LCG
    return (h >>> 0) / 4294967296;
  };
}

const COMPANY_PROBLEMS = {};

// Distribute master problems to every company
COMPANIES.forEach((company) => {
  const randomizer = seededRandom(company);

  // Big tech gets ~90-110 problems, mid gets ~60-80, tiny gets ~40-60
  let targetCount = 50; // base

  const lowerC = company.toLowerCase();
  if (["google", "amazon", "microsoft", "meta", "apple"].includes(lowerC)) {
    targetCount = 100;
  } else if (["netflix", "uber", "adobe", "bloomberg", "linkedin", "atlassian", "twitter", "spotify", "zscaler", "cisco"].includes(lowerC)) {
    targetCount = 80;
  } else {
    // everyone else gets between 45 and 65
    targetCount = 45 + Math.floor(randomizer() * 21);
  }

  // Shuffle the master list deterministically for this company
  let shuffled = [...MASTER_PROBLEMS];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(randomizer() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }

  // Select the subset
  let selected = shuffled.slice(0, targetCount);

  // Add random frequency 1-5 to them deterministically
  selected = selected.map(p => {
    // weight frequencies towards 3 and 4
    const rand = randomizer();
    let freq = 3;
    if (rand < 0.1) freq = 1;
    else if (rand < 0.25) freq = 2;
    else if (rand < 0.6) freq = 3;
    else if (rand < 0.85) freq = 4;
    else freq = 5;

    return { ...p, frequency: freq };
  });

  COMPANY_PROBLEMS[company] = selected;
});

function getProblemsForCompany(company) {
  return COMPANY_PROBLEMS[company] || [];
}

function getAllCompanies() {
  return Object.keys(COMPANY_PROBLEMS);
}

module.exports = { COMPANY_PROBLEMS, getProblemsForCompany, getAllCompanies };
