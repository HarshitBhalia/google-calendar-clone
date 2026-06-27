async function testLogin() {
  const res = await fetch('http://localhost:3001/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'harshitbhalia931@gmail.com', password: 'Harshit@2730' })
  });
  const data = await res.text();
  console.log('Status:', res.status);
  console.log('Body:', data);
}

testLogin();
