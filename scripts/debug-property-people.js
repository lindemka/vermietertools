const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugPropertyPeople() {
  try {
    // First, login to get session
    console.log('🔐 Logging in...');
    const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'password123'
      })
    });

    if (!loginResponse.ok) {
      console.error('❌ Login failed:', await loginResponse.text());
      return;
    }

    const cookies = loginResponse.headers.get('set-cookie');
    console.log('✅ Login successful');

    // Get all properties
    console.log('\n🏢 Getting properties...');
    const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
      headers: { 'Cookie': cookies }
    });

    if (!propertiesResponse.ok) {
      console.error('❌ Failed to get properties:', await propertiesResponse.text());
      return;
    }

    const properties = await propertiesResponse.json();
    console.log('📋 Properties found:', properties.properties?.length || 0);

    // Check each property for people
    for (const property of properties.properties || []) {
      console.log(`\n🏠 Property: ${property.name} (${property.id})`);
      
      const peopleResponse = await fetch(`http://localhost:3003/api/properties/${property.id}/people`, {
        headers: { 'Cookie': cookies }
      });

      if (peopleResponse.ok) {
        const people = await peopleResponse.json();
        console.log(`   👥 People assigned: ${people.length}`);
        people.forEach(person => {
          console.log(`      - ${person.person.firstName} ${person.person.lastName} (${person.role})`);
        });
      } else {
        console.log(`   ❌ Failed to get people: ${await peopleResponse.text()}`);
      }
    }

    // Also check all people and their assignments
    console.log('\n👥 Getting all people...');
    const allPeopleResponse = await fetch('http://localhost:3003/api/people', {
      headers: { 'Cookie': cookies }
    });

    if (allPeopleResponse.ok) {
      const allPeople = await allPeopleResponse.json();
      console.log(`📋 Total people: ${allPeople.people.length}`);
      
      allPeople.people.forEach(person => {
        console.log(`\n👤 ${person.firstName} ${person.lastName}:`);
        console.log(`   Property assignments: ${person.propertyRoles?.length || 0}`);
        person.propertyRoles?.forEach(role => {
          console.log(`      - ${role.property.name} (${role.role})`);
        });
        console.log(`   Unit assignments: ${person.unitRoles?.length || 0}`);
        person.unitRoles?.forEach(role => {
          console.log(`      - ${role.unit.name} in ${role.unit.property.name} (${role.role})`);
        });
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugPropertyPeople();
