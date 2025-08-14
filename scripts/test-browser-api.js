const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3003';

let sessionToken = null;

async function makeRequest(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...(sessionToken && { 'Cookie': `session-token=${sessionToken}` }),
      ...options.headers
    },
    ...options
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${data.error || 'Unknown error'}`);
    }

    return { response, data };
  } catch (error) {
    console.error(`❌ Request failed for ${endpoint}:`, error.message);
    throw error;
  }
}

async function testBrowserAPI() {
  console.log('🌐 Testing API in browser context...\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const { response: loginResponse, data: loginData } = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    // Extract session token from cookies
    const cookies = loginResponse.headers.get('set-cookie');
    if (cookies) {
      const sessionMatch = cookies.match(/session-token=([^;]+)/);
      if (sessionMatch) {
        sessionToken = sessionMatch[1];
        console.log('✅ Login successful, session token obtained');
      }
    }

    // 2. Test people API without search
    console.log('\n2. Testing people API without search...');
    const { data: allPeopleData } = await makeRequest('/api/people');
    console.log(`✅ Found ${allPeopleData.people.length} people without search`);
    allPeopleData.people.forEach(person => {
      console.log(`  - ${person.firstName} ${person.lastName} (${person.email})`);
    });

    // 3. Test people API with search
    console.log('\n3. Testing people API with search...');
    const { data: searchData } = await makeRequest('/api/people?search=John Doe');
    console.log(`✅ Found ${searchData.people.length} people with search "John Doe"`);
    searchData.people.forEach(person => {
      console.log(`  - ${person.firstName} ${person.lastName} (${person.email})`);
    });

    // 4. Test people API with just "John"
    console.log('\n4. Testing people API with search "John"...');
    const { data: johnData } = await makeRequest('/api/people?search=John');
    console.log(`✅ Found ${johnData.people.length} people with search "John"`);
    johnData.people.forEach(person => {
      console.log(`  - ${person.firstName} ${person.lastName} (${person.email})`);
    });

    // 5. Check if there's a difference in the response structure
    console.log('\n5. Comparing response structures...');
    console.log('All people response keys:', Object.keys(allPeopleData));
    console.log('Search response keys:', Object.keys(searchData));
    
    if (allPeopleData.people && searchData.people) {
      console.log('All people count:', allPeopleData.people.length);
      console.log('Search people count:', searchData.people.length);
    }

  } catch (error) {
    console.error('❌ Error testing browser API:', error.message);
  }
}

// Run the test
testBrowserAPI();
