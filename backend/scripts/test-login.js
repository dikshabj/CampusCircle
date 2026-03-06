
async function testLogin() {
  const data = {
    identifier: 'admin@campusfeed.com',
    password: 'admin123',
    loginType: 'admin'
  };

  try {
    const res = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    
    const body = await res.json();
    console.log('Status:', res.status);
    console.log('Body:', body);
  } catch (err) {
    console.error('Network Error:', err.message);
  }
}

testLogin();
