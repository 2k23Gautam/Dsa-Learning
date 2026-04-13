fetch('https://dsa-learning-pbiw.onrender.com/api/platforms/contests', { 
  headers: { 
    'Origin': 'https://dsa-learning-sable.vercel.app' 
  } 
})
.then(res => { 
  console.log('Status GET:', res.status, res.statusText);
  res.headers.forEach((v, k) => console.log(k + ': ' + v));
  return res.text();
})
.then(t => console.log('Body:', t))
.catch(console.error);
