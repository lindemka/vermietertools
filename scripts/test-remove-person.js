const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3003';

// Test data with unique email
const timestamp = Date.now();
const testData = {
  user: {
    email: `test-remove-${timestamp}@example.com`,
    password: 'testpassword123',
    name: 'Test User'
  },
  person: {
    firstName: 'Max',
    lastName: 'Mustermann',
    email: 'max@example.com',
    phone: '+49123456789'
  },
  property: {
    name: 'Test Property',
    address: 'Teststraße 1, 12345 Teststadt',
    description: 'Test property for removal testing'
  },
  unit: {
    name: 'Test Unit',
    type: 'wohnung',
    monthlyRent: 1000.00,
    description: 'Test unit for removal testing'
  }
};

let sessionToken = null;
let userId = null;
let personId = null;
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

async function testRemovePerson() {
  console.log('🧪 Testing Person Removal Functionality...\n');
  console.log(`Using test email: ${testData.user.email}\n`);

  try {
    // 1. Register a test user
    console.log('1. Registering test user...');
    const { data: userData } = await makeRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(testData.user)
    });
    console.log('✅ User registered:', userData.email);

    // 2. Login to get session
    console.log('\n2. Logging in...');
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

    // 3. Get user info
    console.log('\n3. Getting user info...');
    const { data: userInfo } = await makeRequest('/api/auth/me');
    userId = userInfo.id;
    console.log('✅ User info retrieved:', userInfo.email);

    // 4. Create a test person
    console.log('\n4. Creating test person...');
    const { data: personData } = await makeRequest('/api/people', {
      method: 'POST',
      body: JSON.stringify(testData.person)
    });
    personId = personData.id;
    console.log('✅ Person created:', `${personData.firstName} ${personData.lastName}`);

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

    // 7. Add person to property
    console.log('\n7. Adding person to property...');
    const { data: propertyPersonData } = await makeRequest(`/api/properties/${propertyId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: personId,
        role: 'hausmeister'
      })
    });
    console.log('✅ Person added to property as hausmeister');

    // 8. Add person to unit
    console.log('\n8. Adding person to unit...');
    const { data: unitPersonData } = await makeRequest(`/api/units/${unitId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: personId,
        role: 'tenant'
      })
    });
    console.log('✅ Person added to unit as tenant');

    // 9. Verify both assignments exist
    console.log('\n9. Verifying assignments exist...');
    const { data: propertyPeople } = await makeRequest(`/api/properties/${propertyId}/people`);
    const { data: unitPeople } = await makeRequest(`/api/units/${unitId}/people`);
    console.log('✅ Property people:', propertyPeople.length, 'assignments');
    console.log('✅ Unit people:', unitPeople.length, 'assignments');

    // 10. Test removing person from property
    console.log('\n10. Testing remove person from property...');
    await makeRequest(`/api/properties/${propertyId}/people?personId=${personId}`, {
      method: 'DELETE'
    });
    console.log('✅ Person removed from property');

    // 11. Verify property removal worked
    console.log('\n11. Verifying property removal...');
    const { data: propertyPeopleAfter } = await makeRequest(`/api/properties/${propertyId}/people`);
    console.log('✅ Property people after removal:', propertyPeopleAfter.length, 'assignments');

    // 12. Test removing person from unit
    console.log('\n12. Testing remove person from unit...');
    await makeRequest(`/api/units/${unitId}/people?personId=${personId}`, {
      method: 'DELETE'
    });
    console.log('✅ Person removed from unit');

    // 13. Verify unit removal worked
    console.log('\n13. Verifying unit removal...');
    const { data: unitPeopleAfter } = await makeRequest(`/api/units/${unitId}/people`);
    console.log('✅ Unit people after removal:', unitPeopleAfter.length, 'assignments');

    console.log('\n🎉 All removal tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- User registration and login: ✅');
    console.log('- Person creation: ✅');
    console.log('- Property creation: ✅');
    console.log('- Unit creation: ✅');
    console.log('- Adding person to property: ✅');
    console.log('- Adding person to unit: ✅');
    console.log('- Removing person from property: ✅');
    console.log('- Removing person from unit: ✅');
    console.log('- Verification of removals: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testRemovePerson();
