import { test, expect } from '@playwright/test';

test.describe('Database Setup and API Tests', () => {
  test('Verify database is properly set up', async ({ request }) => {
    // Test that the server is running
    const response = await request.get('/');
    expect(response.status()).toBe(200);
  });

  test('Test user registration API', async ({ request }) => {
    const userData = {
      name: 'API Test User',
      email: `apitest-${Date.now()}@example.com`,
      password: 'password123'
    };

    const response = await request.post('/api/auth/register', {
      data: userData
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.user).toBeDefined();
    expect(result.user.email).toBe(userData.email);
  });

  test('Test property creation API', async ({ request }) => {
    // First create a user
    const userResponse = await request.post('/api/auth/register', {
      data: {
        name: 'Property Test User',
        email: `propertytest-${Date.now()}@example.com`,
        password: 'password123'
      }
    });
    
    const userResult = await userResponse.json();
    const userId = userResult.user.id;

    // Create a property
    const propertyData = {
      name: 'API Test Property',
      address: 'API Test Address 123',
      description: 'API Test Property Description'
    };

    const response = await request.post('/api/properties', {
      data: propertyData
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.property).toBeDefined();
    expect(result.property.name).toBe(propertyData.name);
  });

  test('Test unit creation API', async ({ request }) => {
    // Create user and property first
    const userResponse = await request.post('/api/auth/register', {
      data: {
        name: 'Unit Test User',
        email: `unittest-${Date.now()}@example.com`,
        password: 'password123'
      }
    });
    
    const userResult = await userResponse.json();
    
    const propertyResponse = await request.post('/api/properties', {
      data: {
        name: 'Unit Test Property',
        address: 'Unit Test Address 123',
        description: 'Unit Test Property Description'
      }
    });
    
    const propertyResult = await propertyResponse.json();
    const propertyId = propertyResult.property.id;

    // Create a unit
    const unitData = {
      name: 'API Test Unit',
      type: 'Wohnung',
      monthlyRent: 1000,
      monthlyUtilities: 150,
      size: '75m²',
      description: 'API Test Unit Description'
    };

    const response = await request.post(`/api/properties/${propertyId}/units`, {
      data: unitData
    });

    expect(response.status()).toBe(201);
    
    const result = await response.json();
    expect(result.unit).toBeDefined();
    expect(result.unit.name).toBe(unitData.name);
    expect(result.unit.monthlyRent).toBe(unitData.monthlyRent);
  });

  test('Test yearly overview API', async ({ request }) => {
    // Create user, property, and unit
    const userResponse = await request.post('/api/auth/register', {
      data: {
        name: 'Overview Test User',
        email: `overviewtest-${Date.now()}@example.com`,
        password: 'password123'
      }
    });
    
    const propertyResponse = await request.post('/api/properties', {
      data: {
        name: 'Overview Test Property',
        address: 'Overview Test Address 123',
        description: 'Overview Test Property Description'
      }
    });
    
    const propertyResult = await propertyResponse.json();
    
    const unitResponse = await request.post(`/api/properties/${propertyResult.property.id}/units`, {
      data: {
        name: 'Overview Test Unit',
        type: 'Wohnung',
        monthlyRent: 1200,
        monthlyUtilities: 200,
        size: '80m²',
        description: 'Overview Test Unit Description'
      }
    });
    
    const unitResult = await unitResponse.json();
    const unitId = unitResult.unit.id;

    // Test yearly overview GET
    const getResponse = await request.get(`/api/units/${unitId}/yearly-overview?year=2025`);
    expect(getResponse.status()).toBe(200);
    
    const getResult = await getResponse.json();
    expect(getResult.yearlyOverview).toBeDefined();
    expect(getResult.yearlyOverview).toHaveLength(12); // 12 months

    // Test yearly overview POST (create/update rental)
    const rentalData = {
      month: 1,
      year: 2025,
      rentAmount: 1200,
      utilitiesAmount: 200,
      isPaid: false,
      notes: 'API Test Note'
    };

    const postResponse = await request.post(`/api/units/${unitId}/yearly-overview`, {
      data: rentalData
    });

    expect(postResponse.status()).toBe(201);
    
    const postResult = await postResponse.json();
    expect(postResult.rental).toBeDefined();
    expect(postResult.rental.rentAmount).toBe(rentalData.rentAmount);
    expect(postResult.rental.utilitiesAmount).toBe(rentalData.utilitiesAmount);
  });

  test('Test standard rent update API', async ({ request }) => {
    // Create user, property, and unit
    const userResponse = await request.post('/api/auth/register', {
      data: {
        name: 'Standard Rent Test User',
        email: `standardrenttest-${Date.now()}@example.com`,
        password: 'password123'
      }
    });
    
    const propertyResponse = await request.post('/api/properties', {
      data: {
        name: 'Standard Rent Test Property',
        address: 'Standard Rent Test Address 123',
        description: 'Standard Rent Test Property Description'
      }
    });
    
    const propertyResult = await propertyResponse.json();
    
    const unitResponse = await request.post(`/api/properties/${propertyResult.property.id}/units`, {
      data: {
        name: 'Standard Rent Test Unit',
        type: 'Wohnung',
        monthlyRent: 1000,
        monthlyUtilities: 150,
        size: '75m²',
        description: 'Standard Rent Test Unit Description'
      }
    });
    
    const unitResult = await unitResponse.json();
    const unitId = unitResult.unit.id;

    // Test standard rent update
    const standardRentData = {
      monthlyRent: 1300,
      monthlyUtilities: 250,
      effectiveFromMonth: 1,
      effectiveFromYear: 2025,
      forceUpdate: false
    };

    const response = await request.put(`/api/units/${unitId}/standard-rent`, {
      data: standardRentData
    });

    expect(response.status()).toBe(200);
    
    const result = await response.json();
    expect(result.unit).toBeDefined();
    expect(result.unit.monthlyRent).toBe(standardRentData.monthlyRent);
    expect(result.unit.monthlyUtilities).toBe(standardRentData.monthlyUtilities);
  });

  test('Test error handling for invalid requests', async ({ request }) => {
    // Test invalid unit ID
    const response = await request.get('/api/units/invalid-id/yearly-overview');
    expect(response.status()).toBe(404);
    
    // Test invalid property ID
    const propertyResponse = await request.get('/api/properties/invalid-id');
    expect(propertyResponse.status()).toBe(404);
  });
});
