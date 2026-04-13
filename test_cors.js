fetch('https://dsa-learning-pbiw.onrender.com/api/platforms/contests', { 
  method: 'OPTIONS', 
  headers: { 
    'Origin': 'https://dsa-learning-sable.vercel.app', 
    'Access-Control-Request-Method': 'GET',
    'Access-Control-Request-Headers': 'Content-Type, Authorization' 
  } 
})
.then(res => { 
  console.log('Status:', res.status, res.statusText); 
  console.log('Headers:');
  res.headers.forEach((v, k) => console.log(k + ': ' + v)); 
})
.catch(console.error);
