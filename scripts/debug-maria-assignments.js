const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function debugMariaAssignments() {
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

    // Get Maria Müller from people API
    console.log('\n👥 Getting Maria Müller...');
    const peopleResponse = await fetch('http://localhost:3003/api/people', {
      headers: { 'Cookie': cookies }
    });

    if (!peopleResponse.ok) {
      console.error('❌ Failed to get people:', await peopleResponse.text());
      return;
    }

    const people = await peopleResponse.json();
    const maria = people.people.find(p => p.firstName === 'Maria' && p.lastName === 'Müller');
    
    if (!maria) {
      console.error('❌ Maria Müller not found');
      return;
    }

    console.log(`✅ Found Maria Müller: ${maria.id}`);
    console.log(`   Name: ${maria.firstName} ${maria.lastName}`);
    console.log(`   Email: ${maria.email}`);
    console.log(`   Phone: ${maria.phone}`);
    console.log(`   Notes: ${maria.notes}`);

    // Check property assignments
    console.log('\n🏢 Property Assignments:');
    if (maria.propertyRoles && maria.propertyRoles.length > 0) {
      maria.propertyRoles.forEach(role => {
        console.log(`   - ${role.property.name} (${role.role})`);
      });
    } else {
      console.log('   - No property assignments');
    }

    // Check unit assignments
    console.log('\n🏠 Unit Assignments:');
    if (maria.unitRoles && maria.unitRoles.length > 0) {
      maria.unitRoles.forEach(role => {
        console.log(`   - ${role.unit.name} in ${role.unit.property.name} (${role.role})`);
      });
    } else {
      console.log('   - No unit assignments');
    }

    // Get all properties and check their people
    console.log('\n🏢 Checking all properties for Maria...');
    const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
      headers: { 'Cookie': cookies }
    });

    if (propertiesResponse.ok) {
      const properties = await propertiesResponse.json();
      
      for (const property of properties.properties || []) {
        console.log(`\n   Property: ${property.name}`);
        const propertyPeopleResponse = await fetch(`http://localhost:3003/api/properties/${property.id}/people`, {
          headers: { 'Cookie': cookies }
        });

        if (propertyPeopleResponse.ok) {
          const propertyPeople = await propertyPeopleResponse.json();
          const mariaInProperty = propertyPeople.find(pp => pp.person.id === maria.id);
          if (mariaInProperty) {
            console.log(`     - Maria Müller (${mariaInProperty.role})`);
          }
        }
      }
    }

    // Get all units and check their people
    console.log('\n🏠 Checking all units for Maria...');
    const unitsResponse = await fetch('http://localhost:3003/api/units', {
      headers: { 'Cookie': cookies }
    });

    if (unitsResponse.ok) {
      const units = await unitsResponse.json();
      
      for (const unit of units.units || []) {
        const unitPeopleResponse = await fetch(`http://localhost:3003/api/units/${unit.id}/people`, {
          headers: { 'Cookie': cookies }
        });

        if (unitPeopleResponse.ok) {
          const unitPeople = await unitPeopleResponse.json();
          const mariaInUnit = unitPeople.find(up => up.person.id === maria.id);
          if (mariaInUnit) {
            console.log(`   - ${unit.name} in ${unit.property.name} (${mariaInUnit.role})`);
          }
        }
      }
    }

  } catch (error) {
    console.error('❌ Error:', error);
  }
}

debugMariaAssignments();
