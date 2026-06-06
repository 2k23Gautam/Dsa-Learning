const axios = require('axios');

async function test() {
  const nowTime = Date.now();
  const windowEndTime = nowTime + (48 * 60 * 60 * 1000);
  console.log('Now:', new Date(nowTime).toISOString());
  console.log('48h End:', new Date(windowEndTime).toISOString());

  // Codeforces
  try {
    const res = await axios.get('https://codeforces.com/api/contest.list?gym=false');
    const upcoming = res.data.result.filter(c => c.phase === 'BEFORE');
    console.log('\n--- Codeforces ---');
    upcoming.forEach(c => {
      const start = c.startTimeSeconds * 1000;
      console.log(`Name: ${c.name}`);
      console.log(`Start: ${new Date(start).toISOString()}`);
      console.log(`In 48h Window? ${start > nowTime && start <= windowEndTime}`);
    });
  } catch (e) {
    console.error('CF Error:', e.message);
  }

  // LeetCode
  try {
    const query = `{ topTwoContests { title titleSlug startTime duration } }`;
    const res = await axios.post('https://leetcode.com/graphql', { query });
    const contests = res.data?.data?.topTwoContests || [];
    console.log('\n--- LeetCode ---');
    contests.forEach(c => {
      const start = c.startTime * 1000;
      console.log(`Name: ${c.title}`);
      console.log(`Start: ${new Date(start).toISOString()}`);
      console.log(`In 48h Window? ${start > nowTime && start <= windowEndTime}`);
    });
  } catch (e) {
    console.error('LC Error:', e.message);
  }

  // CodeChef
  try {
    const res = await axios.get('https://www.codechef.com/api/list/contests/all?sort_by=START&sorting_order=asc&offset=0&mode=all');
    const upcoming = [
      ...(res.data?.future_contests || []),
      ...(res.data?.present_contests || []),
    ];
    console.log('\n--- CodeChef ---');
    upcoming.forEach(c => {
      const start = new Date(c.contest_start_date_iso || c.contest_start_date).getTime();
      console.log(`Name: ${c.contest_name}`);
      console.log(`Start: ${new Date(start).toISOString()}`);
      console.log(`In 48h Window? ${start > nowTime && start <= windowEndTime}`);
    });
  } catch (e) {
    console.error('CC Error:', e.message);
  }
}

test();
