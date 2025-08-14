// Use built-in fetch for Node.js 18+

async function testLoginAPI() {
  try {
    console.log('🔍 Testing login API...')
    
    const loginData = {
      email: 'test@example.com',
      password: 'password123'
    }

    console.log('📤 Sending login request...')
    const response = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(loginData)
    })

    console.log('📊 Response status:', response.status)
    console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()))

    const data = await response.json()
    console.log('📄 Response data:', data)

    if (response.ok) {
      console.log('✅ Login successful!')
      
      // Get cookies from response
      const cookies = response.headers.get('set-cookie')
      if (cookies) {
        console.log('🍪 Cookies set:', cookies)
      } else {
        console.log('⚠️ No cookies found in response')
      }
    } else {
      console.log('❌ Login failed:', data.error)
    }

  } catch (error) {
    console.error('❌ Error testing login API:', error.message)
  }
}

testLoginAPI()
