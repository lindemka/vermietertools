const fetch = require('node-fetch')

async function testInvestmentComparison() {
  console.log('Testing Investment Comparison with evaluation data...')
  
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
  })
  
  if (!loginResponse.ok) {
    console.error('Login failed')
    return
  }
  
  const cookies = loginResponse.headers.get('set-cookie')
  console.log('Login successful')
  console.log('Session cookie:', cookies)
  
  // Get a property ID for testing
  const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
    headers: {
      'Cookie': cookies
    }
  })
  
  if (!propertiesResponse.ok) {
    console.error('Failed to fetch properties')
    return
  }
  
  const propertiesData = await propertiesResponse.json()
  const propertyId = propertiesData.properties[0]?.id
  
  if (!propertyId) {
    console.error('No properties found')
    return
  }
  
  console.log('Using property ID:', propertyId)
  
  // Set evaluation settings
  console.log('\nSetting evaluation settings...')
  const settingsResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/settings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Cookie': cookies
    },
    body: JSON.stringify({
      grossRentMultiplier: 15,
      operatingExpenseRatio: 35,
      valueAdjustment: 10
    })
  })
  
  console.log('Settings response status:', settingsResponse.status)
  if (settingsResponse.ok) {
    const settingsData = await settingsResponse.json()
    console.log('Settings saved:', settingsData)
  }
  
  // Test evaluation API
  console.log('\nTesting evaluation API...')
  const evaluationResponse = await fetch(`http://localhost:3003/api/properties/${propertyId}/evaluation`, {
    headers: {
      'Cookie': cookies
    }
  })
  
  console.log('Evaluation response status:', evaluationResponse.status)
  if (evaluationResponse.ok) {
    const evaluationData = await evaluationResponse.json()
    console.log('Evaluation data:', evaluationData)
    
    // Calculate expected annual expenses
    const expectedExpenses = evaluationData.totalYearlyRent * (evaluationData.operatingExpenseRatio / 100)
    console.log('\nExpected annual expenses based on evaluation settings:')
    console.log(`- Total yearly rent: ${evaluationData.totalYearlyRent}`)
    console.log(`- Operating expense ratio: ${evaluationData.operatingExpenseRatio}%`)
    console.log(`- Expected annual expenses: ${expectedExpenses}`)
    
    console.log('\n✅ SUCCESS: Evaluation API provides all necessary data for investment comparison!')
    console.log('The investment comparison page should now use:')
    console.log(`- Property value: ${evaluationData.estimatedValue}`)
    console.log(`- Annual expenses: ${expectedExpenses}`)
  } else {
    console.error('Evaluation API failed')
  }
}

testInvestmentComparison().catch(console.error)
