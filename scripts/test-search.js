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

async function testSearch() {
  console.log('🔍 Testing search functionality...\n');

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

    // 2. Test different search terms
    const searchTerms = [
      'John Doe',
      'John',
      'Doe',
      'john',
      'doe',
      'JOHN',
      'DOE',
      'john.doe@example.com',
      'example.com'
    ];

    console.log('\n2. Testing search terms:');
    
    for (const term of searchTerms) {
      try {
        const { data: searchData } = await makeRequest(`/api/people?search=${encodeURIComponent(term)}`);
        console.log(`"${term}": ${searchData.people.length} results`);
        
        if (searchData.people.length > 0) {
          searchData.people.forEach(person => {
            console.log(`  - ${person.firstName} ${person.lastName} (${person.email})`);
          });
        }
      } catch (error) {
        console.log(`"${term}": Error - ${error.message}`);
      }
    }

    // 3. Get John Doe directly by ID
    console.log('\n3. Getting all people to find John Doe ID...');
    const { data: allPeopleData } = await makeRequest('/api/people');
    
    const johnDoe = allPeopleData.people.find(p => p.firstName === 'John' && p.lastName === 'Doe');
    if (johnDoe) {
      console.log(`✅ Found John Doe with ID: ${johnDoe.id}`);
      console.log(`   Email: ${johnDoe.email}`);
      console.log(`   Property roles: ${johnDoe.propertyRoles.length}`);
      console.log(`   Unit roles: ${johnDoe.unitRoles.length}`);
    } else {
      console.log('❌ John Doe not found in all people');
    }

  } catch (error) {
    console.error('❌ Error testing search:', error.message);
  }
}

// Run the test
testSearch();
