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

async function removeJohnDoeAssignments() {
  console.log('🧪 Removing John Doe Assignments...\n');

  try {
    // 1. Login to existing test user
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

    // 2. Get user info
    console.log('\n2. Getting user info...');
    const { data: userInfo } = await makeRequest('/api/auth/me');
    console.log('✅ User info retrieved:', userInfo.email);

    // 3. Get all people to find John Doe
    console.log('\n3. Getting all people...');
    const { data: peopleData } = await makeRequest('/api/people');
    const johnDoe = peopleData.people.find(person => 
      person.firstName === 'John' && person.lastName === 'Doe'
    );
    
    if (!johnDoe) {
      console.log('❌ John Doe not found in people list');
      return;
    }
    
    console.log('✅ John Doe found:', `${johnDoe.firstName} ${johnDoe.lastName} (ID: ${johnDoe.id})`);

    // 4. Get all properties
    console.log('\n4. Getting all properties...');
    const { data: propertiesData } = await makeRequest('/api/properties');
    console.log('✅ Found', propertiesData.properties.length, 'properties');

    // 5. Remove John Doe from all property assignments
    for (const property of propertiesData.properties) {
      console.log(`\n5. Checking property: ${property.name} (ID: ${property.id})`);
      
      try {
        // Get property people
        const { data: propertyPeople } = await makeRequest(`/api/properties/${property.id}/people`);
        
        // Check if John Doe is assigned to this property
        const johnDoeAssignment = propertyPeople.find(assignment => assignment.person.id === johnDoe.id);
        
        if (johnDoeAssignment) {
          console.log(`   - John Doe is assigned as ${johnDoeAssignment.role}`);
          
          // Remove John Doe from property
          await makeRequest(`/api/properties/${property.id}/people?personId=${johnDoe.id}`, {
            method: 'DELETE'
          });
          console.log(`   ✅ Removed John Doe from property ${property.name}`);
        } else {
          console.log(`   - John Doe not assigned to this property`);
        }
      } catch (error) {
        console.log(`   ❌ Error checking property ${property.name}:`, error.message);
      }
    }

    // 6. Get all units and remove John Doe from unit assignments
    console.log('\n6. Checking all units...');
    for (const property of propertiesData.properties) {
      try {
        // Get units for this property
        const { data: unitsData } = await makeRequest(`/api/units?propertyId=${property.id}`);
        
        for (const unit of unitsData.units) {
          console.log(`   Checking unit: ${unit.name} (ID: ${unit.id})`);
          
          try {
            // Get unit people
            const { data: unitPeople } = await makeRequest(`/api/units/${unit.id}/people`);
            
            // Check if John Doe is assigned to this unit
            const johnDoeUnitAssignment = unitPeople.find(assignment => assignment.person.id === johnDoe.id);
            
            if (johnDoeUnitAssignment) {
              console.log(`     - John Doe is assigned as ${johnDoeUnitAssignment.role}`);
              
              // Remove John Doe from unit
              await makeRequest(`/api/units/${unit.id}/people?personId=${johnDoe.id}`, {
                method: 'DELETE'
              });
              console.log(`     ✅ Removed John Doe from unit ${unit.name}`);
            } else {
              console.log(`     - John Doe not assigned to this unit`);
            }
          } catch (error) {
            console.log(`     ❌ Error checking unit ${unit.name}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error getting units for property ${property.name}:`, error.message);
      }
    }

    // 7. Verify all assignments are removed
    console.log('\n7. Verifying all assignments are removed...');
    let totalAssignments = 0;
    
    for (const property of propertiesData.properties) {
      try {
        const { data: propertyPeople } = await makeRequest(`/api/properties/${property.id}/people`);
        const johnDoeAssignments = propertyPeople.filter(assignment => assignment.person.id === johnDoe.id);
        totalAssignments += johnDoeAssignments.length;
        
        if (johnDoeAssignments.length > 0) {
          console.log(`   ❌ John Doe still has ${johnDoeAssignments.length} assignment(s) in property ${property.name}`);
        } else {
          console.log(`   ✅ John Doe has no assignments in property ${property.name}`);
        }
      } catch (error) {
        console.log(`   ❌ Error verifying property ${property.name}:`, error.message);
      }
    }
    
    for (const property of propertiesData.properties) {
      try {
        const { data: unitsData } = await makeRequest(`/api/units?propertyId=${property.id}`);
        
        for (const unit of unitsData.units) {
          try {
            const { data: unitPeople } = await makeRequest(`/api/units/${unit.id}/people`);
            const johnDoeUnitAssignments = unitPeople.filter(assignment => assignment.person.id === johnDoe.id);
            totalAssignments += johnDoeUnitAssignments.length;
            
            if (johnDoeUnitAssignments.length > 0) {
              console.log(`   ❌ John Doe still has ${johnDoeUnitAssignments.length} assignment(s) in unit ${unit.name}`);
            } else {
              console.log(`   ✅ John Doe has no assignments in unit ${unit.name}`);
            }
          } catch (error) {
            console.log(`   ❌ Error verifying unit ${unit.name}:`, error.message);
          }
        }
      } catch (error) {
        console.log(`   ❌ Error getting units for property ${property.name}:`, error.message);
      }
    }

    console.log('\n🎉 John Doe assignment removal completed!');
    console.log(`📊 Total remaining assignments: ${totalAssignments}`);
    
    if (totalAssignments === 0) {
      console.log('✅ All John Doe assignments have been successfully removed!');
    } else {
      console.log('⚠️  Some assignments may still exist');
    }

  } catch (error) {
    console.error('❌ Error removing John Doe assignments:', error.message);
  }
}

// Run the removal
removeJohnDoeAssignments();
