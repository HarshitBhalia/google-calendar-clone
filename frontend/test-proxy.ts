async function testProxy() {
  try {
    const res = await fetch('http://localhost:5173/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'harshitbhalia931@gmail.com', password: 'Harshit@2730' })
    });
    const data = await res.text();
    console.log('Status:', res.status);
    console.log('Body:', data);
  } catch(e) {
    console.error('Error:', e);
  }
}
testProxy();
