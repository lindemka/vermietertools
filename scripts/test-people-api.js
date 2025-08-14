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

async function testPeopleAPI() {
  console.log('🧪 Testing People API...\n');

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

    // 2. Get all people
    console.log('\n2. Fetching all people...');
    const { data: peopleData } = await makeRequest('/api/people');
    console.log(`✅ Found ${peopleData.people.length} people:`);
    
    peopleData.people.forEach(person => {
      console.log(`- ${person.firstName} ${person.lastName} (${person.email})`);
      console.log(`  Property roles: ${person.propertyRoles.length}`);
      console.log(`  Unit roles: ${person.unitRoles.length}`);
    });

    // 3. Search for John Doe specifically
    console.log('\n3. Searching for John Doe...');
    const { data: johnDoeData } = await makeRequest('/api/people?search=John Doe');
    console.log(`✅ Found ${johnDoeData.people.length} people matching "John Doe":`);
    
    johnDoeData.people.forEach(person => {
      console.log(`- ${person.firstName} ${person.lastName} (${person.email})`);
      console.log(`  Property roles: ${person.propertyRoles.length}`);
      console.log(`  Unit roles: ${person.unitRoles.length}`);
    });

    // 4. Check user session
    console.log('\n4. Checking user session...');
    const { data: userData } = await makeRequest('/api/auth/me');
    console.log(`✅ Current user: ${userData.email} (${userData.name})`);

  } catch (error) {
    console.error('❌ Error testing People API:', error.message);
  }
}

// Run the test
testPeopleAPI();
