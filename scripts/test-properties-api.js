const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testPropertiesAPI() {
  console.log('🧪 Testing Properties API...');
  
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
  
  // 2. Get properties
  console.log('🏢 Getting properties...');
  const propertiesResponse = await fetch('http://localhost:3003/api/properties', {
    headers: { 'Cookie': cookies }
  });
  
  if (!propertiesResponse.ok) {
    console.error('❌ Failed to get properties');
    return;
  }
  
  const propertiesData = await propertiesResponse.json();
  console.log(`📊 Found ${propertiesData.properties.length} properties`);
  
  propertiesData.properties.forEach((property, index) => {
    console.log(`\n🏢 Property ${index + 1}:`);
    console.log(`   Name: ${property.name}`);
    console.log(`   ID: ${property.id}`);
    console.log(`   Address: ${property.address}`);
    console.log(`   Active: ${property.isActive}`);
    console.log(`   Units: ${property.units?.length || 0}`);
  });
  
  // 3. Check for WA12 specifically
  const wa12 = propertiesData.properties.find(p => p.name === 'WA12');
  if (wa12) {
    console.log(`\n✅ Found WA12: ${wa12.id}`);
    console.log(`   Address: ${wa12.address}`);
    console.log(`   Active: ${wa12.isActive}`);
    console.log(`   Units: ${wa12.units?.length || 0}`);
    
    if (wa12.units) {
      wa12.units.forEach((unit, index) => {
        console.log(`   Unit ${index + 1}: ${unit.name} (${unit.id})`);
      });
    }
  } else {
    console.log('\n❌ WA12 not found');
  }
  
  console.log('🎉 Properties API test completed!');
}

testPropertiesAPI().catch(console.error);
