const fetch = require('node-fetch');

async function testEvaluationSettings() {
  console.log('Testing Evaluation Settings API...');
  
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
  
  const propertyId = 'cmeak00ml0001p65jll1gz2zq'; // Test property ID
  
  // Test GET settings
  console.log('\nTesting GET evaluation settings...');
  const getResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/settings`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('GET response status:', getResponse.status);
  if (getResponse.ok) {
    const settings = await getResponse.json();
    console.log('GET evaluation settings result:', settings);
  } else {
    console.error('GET failed:', await getResponse.text());
  }
  
  // Test POST evaluation settings
  console.log('\nTesting POST evaluation settings...');
  const evaluationSettings = {
    grossRentMultiplier: 18,
    operatingExpenseRatio: 28,
    valueAdjustment: 3
  };
  
  const postResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(evaluationSettings)
  });
  
  console.log('POST response status:', postResponse.status);
  if (postResponse.ok) {
    const result = await postResponse.json();
    console.log('POST evaluation settings result:', result);
  } else {
    console.error('POST failed:', await postResponse.text());
  }
  
  // Test GET again to verify the settings were saved
  console.log('\nTesting GET evaluation settings again...');
  const getResponse2 = await fetch(`http://localhost:3003/api/properties/${propertyId}/settings`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('GET response status:', getResponse2.status);
  if (getResponse2.ok) {
    const settings = await getResponse2.json();
    console.log('GET evaluation settings result after save:', settings);
  } else {
    console.error('GET failed:', await getResponse2.text());
  }
}

testEvaluationSettings().catch(console.error);
