const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function checkBlueEntry() {
  console.log('🔍 Checking for blue entry...');
  
  // 1. Login
  console.log('🔐 Logging in...');
  const loginResponse = await fetch('http://localhost:3003/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
  });
  
  if (!loginResponse.ok) {
    console.error('❌ Login failed');
    return;
  }
  
  const cookies = loginResponse.headers.get('set-cookie');
  console.log('✅ Login successful');
  
  // 2. Get all people
  console.log('👥 Getting all people...');
  const peopleResponse = await fetch('http://localhost:3003/api/people', {
    headers: { 'Cookie': cookies }
  });
  
  if (!peopleResponse.ok) {
    console.error('❌ Failed to get people');
    return;
  }
  
  const peopleData = await peopleResponse.json();
  console.log(`📊 Found ${peopleData.people.length} people`);
  
  // 3. Check each person for blue entries
  peopleData.people.forEach((person, index) => {
    console.log(`\n👤 ${index + 1}. ${person.firstName} ${person.lastName} (${person.id}):`);
    console.log(`   Email: ${person.email || 'N/A'}`);
    console.log(`   Phone: ${person.phone || 'N/A'}`);
    console.log(`   Notes: ${person.notes || 'N/A'}`);
    console.log(`   Property Roles: ${person.propertyRoles.length}`);
    console.log(`   Unit Roles: ${person.unitRoles.length}`);
    
    if (person.propertyRoles.length > 0) {
      console.log('   Property Roles:');
      person.propertyRoles.forEach(role => {
        console.log(`     - ${role.property.name} (${role.role}) - ID: ${role.id}`);
      });
    }
    
    if (person.unitRoles.length > 0) {
      console.log('   Unit Roles:');
      person.unitRoles.forEach(role => {
        console.log(`     - ${role.unit.name} in ${role.unit.property.name} (${role.role}) - ID: ${role.id}`);
      });
    }
  });
  
  // 4. Get WA12 property people specifically
  console.log('\n🏢 Getting WA12 property people...');
  const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
    headers: { 'Cookie': cookies }
  });
  
  if (!propertiesResponse.ok) {
    console.error('❌ Failed to get properties');
    return;
  }
  
  const propertiesData = await propertiesResponse.json();
  const wa12 = propertiesData.properties.find(p => p.name === 'WA12');
  
  if (wa12) {
    console.log(`✅ Found WA12: ${wa12.id}`);
    
    const wa12PeopleResponse = await fetch(`http://localhost:3003/api/properties/${wa12.id}/people`, {
      headers: { 'Cookie': cookies }
    });
    
    if (wa12PeopleResponse.ok) {
      const wa12PeopleData = await wa12PeopleResponse.json();
      console.log(`📊 WA12 has ${wa12PeopleData.length} people assigned`);
      
      wa12PeopleData.forEach((assignment, index) => {
        console.log(`\n🏢 WA12 Assignment ${index + 1}:`);
        console.log(`   Person: ${assignment.person.firstName} ${assignment.person.lastName} (${assignment.person.id})`);
        console.log(`   Role: ${assignment.role}`);
        console.log(`   Assignment ID: ${assignment.id}`);
        console.log(`   Person Email: ${assignment.person.email || 'N/A'}`);
        console.log(`   Person Phone: ${assignment.person.phone || 'N/A'}`);
        console.log(`   Person Notes: ${assignment.person.notes || 'N/A'}`);
      });
    }
  }
  
  // 5. Check for any orphaned assignments
  console.log('\n🔍 Checking for orphaned assignments...');
  const allAssignments = [];
  
  peopleData.people.forEach(person => {
    person.propertyRoles.forEach(role => {
      allAssignments.push({
        type: 'property',
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        assignmentId: role.id,
        propertyId: role.property.id,
        propertyName: role.property.name,
        role: role.role
      });
    });
    
    person.unitRoles.forEach(role => {
      allAssignments.push({
        type: 'unit',
        personId: person.id,
        personName: `${person.firstName} ${person.lastName}`,
        assignmentId: role.id,
        unitId: role.unit.id,
        unitName: role.unit.name,
        propertyId: role.unit.property.id,
        propertyName: role.unit.property.name,
        role: role.role
      });
    });
  });
  
  console.log(`📊 Total assignments found: ${allAssignments.length}`);
  allAssignments.forEach((assignment, index) => {
    console.log(`   ${index + 1}. ${assignment.personName} - ${assignment.type} assignment to ${assignment.propertyName} (${assignment.role})`);
  });
}

checkBlueEntry().catch(console.error);
