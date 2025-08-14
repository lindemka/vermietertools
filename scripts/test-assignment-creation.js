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

async function testAssignmentCreation() {
  console.log('🧪 Testing assignment creation and deletion...\n');

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

    // 2. Get John Doe
    console.log('\n2. Getting John Doe...');
    const { data: peopleData } = await makeRequest('/api/people?search=John Doe');
    const johnDoe = peopleData.people.find(p => p.firstName === 'John' && p.lastName === 'Doe');
    
    if (!johnDoe) {
      console.log('❌ John Doe not found');
      return;
    }
    
    console.log(`✅ Found John Doe: ${johnDoe.id}`);
    console.log(`   Current assignments: ${johnDoe.propertyRoles.length} property, ${johnDoe.unitRoles.length} unit`);

    // 3. Get properties
    console.log('\n3. Getting properties...');
    const { data: propertiesData } = await makeRequest('/api/properties');
    const property = propertiesData.properties[0];
    
    if (!property) {
      console.log('❌ No properties found');
      return;
    }
    
    console.log(`✅ Found property: ${property.name} (${property.id})`);

    // 4. Create a new property assignment
    console.log('\n4. Creating new property assignment...');
    const { data: assignmentData } = await makeRequest(`/api/properties/${property.id}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: johnDoe.id,
        role: 'hausmeister'
      })
    });
    
    console.log('✅ Property assignment created successfully');

    // 5. Verify the assignment was created
    console.log('\n5. Verifying assignment creation...');
    const { data: updatedPeopleData } = await makeRequest('/api/people?search=John Doe');
    const updatedJohnDoe = updatedPeopleData.people.find(p => p.firstName === 'John' && p.lastName === 'Doe');
    
    console.log(`   Updated assignments: ${updatedJohnDoe.propertyRoles.length} property, ${updatedJohnDoe.unitRoles.length} unit`);
    
    if (updatedJohnDoe.propertyRoles.length > johnDoe.propertyRoles.length) {
      console.log('✅ Assignment creation verified!');
    } else {
      console.log('❌ Assignment creation failed');
    }

    // 6. Delete the assignment
    console.log('\n6. Deleting the assignment...');
    const { data: deleteData } = await makeRequest(`/api/properties/${property.id}/people?personId=${johnDoe.id}`, {
      method: 'DELETE'
    });
    
    console.log('✅ Assignment deleted successfully');

    // 7. Verify the assignment was deleted
    console.log('\n7. Verifying assignment deletion...');
    const { data: finalPeopleData } = await makeRequest('/api/people?search=John Doe');
    const finalJohnDoe = finalPeopleData.people.find(p => p.firstName === 'John' && p.lastName === 'Doe');
    
    console.log(`   Final assignments: ${finalJohnDoe.propertyRoles.length} property, ${finalJohnDoe.unitRoles.length} unit`);
    
    if (finalJohnDoe.propertyRoles.length === johnDoe.propertyRoles.length) {
      console.log('✅ Assignment deletion verified!');
    } else {
      console.log('❌ Assignment deletion failed');
    }

    console.log('\n🎉 Test completed successfully!');

  } catch (error) {
    console.error('❌ Error testing assignment creation:', error.message);
  }
}

// Run the test
testAssignmentCreation();
