const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3003';

// Test data
const testData = {
  user: {
    email: 'test@example.com',
    password: 'testpassword123',
    name: 'Test User'
  },
  johnDoe: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@example.com',
    phone: '+49123456789'
  },
  janeSmith: {
    firstName: 'Jane',
    lastName: 'Smith',
    email: 'jane.smith@example.com',
    phone: '+49987654321'
  },
  property: {
    name: 'Test Property',
    address: 'Teststraße 1, 12345 Teststadt',
    description: 'Test property for John Doe assignments'
  },
  unit: {
    name: 'Test Unit',
    type: 'wohnung',
    monthlyRent: 1000.00,
    description: 'Test unit for John Doe assignments'
  }
};

let sessionToken = null;
let userId = null;
let johnDoeId = null;
let janeSmithId = null;
let propertyId = null;
let unitId = null;

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

async function createTestUserWithJohnDoe() {
  console.log('🧪 Creating Test User with John Doe Assignments...\n');

  try {
    // 1. Login to existing test user
    console.log('1. Logging in to existing test user...');
    const { response: loginResponse, data: loginData } = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: testData.user.email,
        password: testData.user.password
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

    // 2. Get user info
    console.log('\n2. Getting user info...');
    const { data: userInfo } = await makeRequest('/api/auth/me');
    userId = userInfo.id;
    console.log('✅ User info retrieved:', userInfo.email);

    // 3. Create John Doe
    console.log('\n3. Creating John Doe...');
    const { data: johnDoeData } = await makeRequest('/api/people', {
      method: 'POST',
      body: JSON.stringify(testData.johnDoe)
    });
    johnDoeId = johnDoeData.id;
    console.log('✅ John Doe created:', `${johnDoeData.firstName} ${johnDoeData.lastName}`);

    // 4. Create Jane Smith
    console.log('\n4. Creating Jane Smith...');
    const { data: janeSmithData } = await makeRequest('/api/people', {
      method: 'POST',
      body: JSON.stringify(testData.janeSmith)
    });
    janeSmithId = janeSmithData.id;
    console.log('✅ Jane Smith created:', `${janeSmithData.firstName} ${janeSmithData.lastName}`);

    // 5. Create a test property
    console.log('\n5. Creating test property...');
    const { data: propertyData } = await makeRequest('/api/properties', {
      method: 'POST',
      body: JSON.stringify(testData.property)
    });
    propertyId = propertyData.property.id;
    console.log('✅ Property created:', propertyData.property.name);

    // 6. Create a test unit
    console.log('\n6. Creating test unit...');
    const { data: unitData } = await makeRequest('/api/units', {
      method: 'POST',
      body: JSON.stringify({
        ...testData.unit,
        propertyId: propertyId
      })
    });
    unitId = unitData.unit.id;
    console.log('✅ Unit created:', unitData.unit.name);

    // 7. Assign John Doe to property as hausmeister
    console.log('\n7. Assigning John Doe to property as hausmeister...');
    const { data: propertyPersonData } = await makeRequest(`/api/properties/${propertyId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: johnDoeId,
        role: 'hausmeister'
      })
    });
    console.log('✅ John Doe assigned to property as hausmeister');

    // 8. Assign John Doe to unit as tenant
    console.log('\n8. Assigning John Doe to unit as tenant...');
    const { data: unitPersonData } = await makeRequest(`/api/units/${unitId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: johnDoeId,
        role: 'tenant'
      })
    });
    console.log('✅ John Doe assigned to unit as tenant');

    // 9. Assign Jane Smith to property as verwalter
    console.log('\n9. Assigning Jane Smith to property as verwalter...');
    await makeRequest(`/api/properties/${propertyId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: janeSmithId,
        role: 'verwalter'
      })
    });
    console.log('✅ Jane Smith assigned to property as verwalter');

    // 10. Verify assignments
    console.log('\n10. Verifying assignments...');
    const { data: propertyPeople } = await makeRequest(`/api/properties/${propertyId}/people`);
    const { data: unitPeople } = await makeRequest(`/api/units/${unitId}/people`);
    console.log('✅ Property people:', propertyPeople.length, 'assignments');
    console.log('✅ Unit people:', unitPeople.length, 'assignments');

    console.log('\n🎉 Test setup completed successfully!');
    console.log('\n📋 Test Account Details:');
    console.log('- Email: test@example.com');
    console.log('- Password: test123');
    console.log('- Property ID:', propertyId);
    console.log('- Unit ID:', unitId);
    console.log('- John Doe ID:', johnDoeId);
    console.log('- Jane Smith ID:', janeSmithId);
    console.log('\n🌐 Test Instructions:');
    console.log('1. Go to http://localhost:3003');
    console.log('2. Login with test@example.com / test123');
    console.log('3. Go to your property page');
    console.log('4. Try removing John Doe from property assignments');
    console.log('5. Go to your unit page');
    console.log('6. Try removing John Doe from unit assignments');

  } catch (error) {
    console.error('❌ Test setup failed:', error.message);
  }
}

// Run the setup
createTestUserWithJohnDoe();
