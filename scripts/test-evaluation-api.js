const fetch = require('node-fetch');

async function testEvaluationAPI() {
  console.log('Testing Evaluation API with saved settings...');
  
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
  
  const propertyId = 'cmeak9xyu00013bcvnnusm0zl'; // Test property with units ID
  
  // First, set some evaluation settings
  console.log('\nSetting evaluation settings...');
  const evaluationSettings = {
    grossRentMultiplier: 20,
    operatingExpenseRatio: 30,
    valueAdjustment: 5
  };
  
  const settingsResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify(evaluationSettings)
  });
  
  console.log('Settings response status:', settingsResponse.status);
  if (settingsResponse.ok) {
    const result = await settingsResponse.json();
    console.log('Settings saved:', result);
  } else {
    console.error('Settings save failed:', await settingsResponse.text());
  }
  
  // Now test the evaluation API
  console.log('\nTesting evaluation API...');
  const evaluationResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/evaluation`, {
    headers: {
      'Cookie': cookies
    }
  });
  
  console.log('Evaluation response status:', evaluationResponse.status);
  if (evaluationResponse.ok) {
    const evaluationData = await evaluationResponse.json();
    console.log('Evaluation data:', {
      estimatedValue: evaluationData.estimatedValue,
      totalYearlyRent: evaluationData.totalYearlyRent,
      grossRentMultiplier: evaluationData.grossRentMultiplier,
      operatingExpenseRatio: evaluationData.operatingExpenseRatio,
      valueAdjustment: evaluationData.valueAdjustment,
      capRate: evaluationData.capRate
    });
    
    // Verify that the saved settings are being used
    if (evaluationData.grossRentMultiplier === 20 && 
        evaluationData.operatingExpenseRatio === 30 && 
        evaluationData.valueAdjustment === 5) {
      console.log('✅ SUCCESS: Evaluation API is using saved settings!');
    } else {
      console.log('❌ FAILED: Evaluation API is not using saved settings');
    }
  } else {
    console.error('Evaluation API failed:', await evaluationResponse.text());
  }
}

testEvaluationAPI().catch(console.error);
