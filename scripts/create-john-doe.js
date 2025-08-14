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

async function createJohnDoe() {
  console.log('🧪 Creating John Doe with assignments...\n');

  try {
    // 1. Login
    console.log('1. Logging in...');
    const { response: loginResponse, data: loginData } = await makeRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'testpassword123'
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

    // 2. Create John Doe
    console.log('\n2. Creating John Doe...');
    const { data: johnDoeData } = await makeRequest('/api/people', {
      method: 'POST',
      body: JSON.stringify({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        phone: '+49123456789',
        notes: 'Test person'
      })
    });
    console.log('✅ John Doe created:', `${johnDoeData.firstName} ${johnDoeData.lastName}`);

    // 3. Create a property
    console.log('\n3. Creating a property...');
    const { data: propertyData } = await makeRequest('/api/properties', {
      method: 'POST',
      body: JSON.stringify({
        name: 'WA12',
        address: 'Teststraße 12, 12345 Teststadt',
        description: 'Test property for John Doe'
      })
    });
    console.log('✅ Property created:', propertyData.property.name);

    // 4. Create units
    console.log('\n4. Creating units...');
    const units = [
      { name: '1.OG rechts', type: 'wohnung', monthlyRent: 800.00 },
      { name: 'EG links', type: 'wohnung', monthlyRent: 750.00 }
    ];

    for (const unit of units) {
      const { data: unitData } = await makeRequest('/api/units', {
        method: 'POST',
        body: JSON.stringify({
          ...unit,
          propertyId: propertyData.property.id
        })
      });
      console.log(`✅ Unit created: ${unitData.unit.name}`);
    }

    // 5. Assign John Doe to property and units
    console.log('\n5. Assigning John Doe...');
    
    // Assign to property as hausmeister
    await makeRequest(`/api/properties/${propertyData.property.id}/people`, {
      method: 'POST',
      body: JSON.stringify({
        personId: johnDoeData.id,
        role: 'hausmeister'
      })
    });
    console.log('✅ John Doe assigned to property as hausmeister');

    // Get units and assign John Doe to them
    const { data: unitsData } = await makeRequest(`/api/units?propertyId=${propertyData.property.id}`);
    
    for (const unit of unitsData.units) {
      await makeRequest(`/api/units/${unit.id}/people`, {
        method: 'POST',
        body: JSON.stringify({
          personId: johnDoeData.id,
          role: 'tenant'
        })
      });
      console.log(`✅ John Doe assigned to unit ${unit.name} as tenant`);
    }

    console.log('\n🎉 John Doe setup completed!');
    console.log('📋 Test Data:');
    console.log('- John Doe ID:', johnDoeData.id);
    console.log('- Property ID:', propertyData.property.id);
    console.log('- Units:', unitsData.units.map(u => u.name).join(', '));
    console.log('\n🌐 You can now test the removal in the browser at: http://localhost:3003/people');

  } catch (error) {
    console.error('❌ Error creating John Doe:', error.message);
  }
}

// Run the setup
createJohnDoe();
