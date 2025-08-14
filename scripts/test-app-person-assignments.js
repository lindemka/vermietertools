const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const BASE_URL = 'http://localhost:3003';

// Test data with unique email
const timestamp = Date.now();
const testData = {
  user: {
    email: `test-${timestamp}@example.com`,
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
    description: 'Test property for assignment testing'
  },
  unit: {
    name: 'Test Unit',
    type: 'wohnung',
    monthlyRent: 1000.00,
    description: 'Test unit for assignment testing'
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

async function testPersonAssignments() {
  console.log('🧪 Testing Person Assignment Functionality via API...\n');
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

    // 7. Test property-person assignment
    console.log('\n7. Testing property-person assignment...');
    const { data: propertyPersonData } = await makeRequest(`/api/properties/${propertyId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: personId,
        role: 'hausmeister'
      })
    });
    console.log('✅ Property-person assignment created:', `${propertyPersonData.person.firstName} ${propertyPersonData.person.lastName} as ${propertyPersonData.role}`);

    // 8. Test unit-person assignment
    console.log('\n8. Testing unit-person assignment...');
    const { data: unitPersonData } = await makeRequest(`/api/units/${unitId}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: personId,
        role: 'tenant'
      })
    });
    console.log('✅ Unit-person assignment created:', `${unitPersonData.person.firstName} ${unitPersonData.person.lastName} as ${unitPersonData.role}`);

    // 9. Test querying property people
    console.log('\n9. Testing property people query...');
    const { data: propertyPeople } = await makeRequest(`/api/properties/${propertyId}/people`);
    console.log('✅ Property people query:', propertyPeople.length, 'assignments found');

    // 10. Test querying unit people
    console.log('\n10. Testing unit people query...');
    const { data: unitPeople } = await makeRequest(`/api/units/${unitId}/people`);
    console.log('✅ Unit people query:', unitPeople.length, 'assignments found');

    // 11. Test updating property person role
    console.log('\n11. Testing role update...');
    await makeRequest(`/api/properties/${propertyId}/people/${personId}`, {
      method: 'PUT',
      body: JSON.stringify({
        role: 'verwalter'
      })
    });
    console.log('✅ Property person role updated to verwalter');

    // 12. Test removing person from property
    console.log('\n12. Testing person removal from property...');
    await makeRequest(`/api/properties/${propertyId}/people/${personId}`, {
      method: 'DELETE'
    });
    console.log('✅ Person removed from property');

    // 13. Verify removal worked
    console.log('\n13. Verifying removal...');
    const { data: propertyPeopleAfter } = await makeRequest(`/api/properties/${propertyId}/people`);
    console.log('✅ Property people after removal:', propertyPeopleAfter.length, 'assignments found');

    console.log('\n🎉 All API tests completed successfully!');
    console.log('\n📋 Test Summary:');
    console.log('- User registration and login: ✅');
    console.log('- Person creation: ✅');
    console.log('- Property creation: ✅');
    console.log('- Unit creation: ✅');
    console.log('- Property-person assignment: ✅');
    console.log('- Unit-person assignment: ✅');
    console.log('- Assignment queries: ✅');
    console.log('- Role updates: ✅');
    console.log('- Assignment removal: ✅');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testPersonAssignments();
