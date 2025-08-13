const fetch = require('node-fetch');

async function testSettingsAPI() {
  console.log('Testing Settings API...');
  
  // First, login to get a session
  const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: 'test@example.com',
      password: 'password123'
    })
  });
  
  if (!loginResponse.ok) {
    console.error('Login failed:', await loginResponse.text());
    return;
  }
  
  const loginData = await loginResponse.json();
  console.log('Login successful');
  
  // Get the session cookie
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('Session cookie:', cookies);
  
  // Test GET settings
  console.log('\nTesting GET settings...');
  const getResponse = await fetch('http://localhost:3003/api/properties/cmeak00ml0001p65jll1gz2zq/settings', {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('GET response status:', getResponse.status);
  if (getResponse.ok) {
    const settings = await getResponse.json();
    console.log('GET settings result:', settings);
  } else {
    console.error('GET failed:', await getResponse.text());
  }
  
  // Test POST settings
  console.log('\nTesting POST settings...');
  const testSettings = {
    grossRentMultiplier: 15,
    operatingExpenseRatio: 30,
    valueAdjustment: 5
  };
  
  const postResponse = await fetch('http://localhost:3003/api/properties/cmeak00ml0001p65jll1gz2zq/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(testSettings)
  });
  
  console.log('POST response status:', postResponse.status);
  if (postResponse.ok) {
    const result = await postResponse.json();
    console.log('POST settings result:', result);
  } else {
    console.error('POST failed:', await postResponse.text());
  }
}

testSettingsAPI().catch(console.error);
