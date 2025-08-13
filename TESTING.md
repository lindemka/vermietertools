# Testing Guide

## 🚀 Quick Start

### **Run All Tests**
```bash
npm test
```

### **Run Tests with UI (Interactive)**
```bash
npm run test:ui
```

### **Run Tests in Headed Mode (See Browser)**
```bash
npm run test:headed
```

### **Debug Tests**
```bash
npm run test:debug
```

### **View Test Report**
```bash
npm run test:report
```

## 📋 Test Structure

### **E2E Tests** (`tests/e2e/`)
- **`user-workflow.spec.ts`**: Complete user journey testing
  - User registration
  - Property creation
  - Unit management
  - Excel-like inline editing
  - Payment status toggling
  - Year navigation
  - Mobile responsiveness
  - Error handling
  - Accessibility

### **API Tests** (`tests/api/`)
- **`database-setup.spec.ts`**: Database and API functionality
  - Database connectivity
  - User registration API
  - Property creation API
  - Unit creation API
  - Yearly overview API
  - Standard rent update API
  - Error handling

### **Test Setup** (`tests/setup/`)
- **`test-setup.ts`**: Database and test user setup

## 🎯 Test Coverage

### **User Workflow Testing**
✅ **Registration Flow**
- User registration with valid data
- Form validation
- Redirect to dashboard

✅ **Property Management**
- Property creation
- Property details view
- Navigation between properties

✅ **Unit Management**
- Unit creation (simple mode)
- Unit details view
- Unit editing

✅ **Rental Management**
- Yearly overview navigation
- Standard rent editing
- Excel-like inline editing
- Payment status toggling
- Year navigation

✅ **UI/UX Testing**
- Mobile responsiveness
- Keyboard navigation
- Accessibility features
- Error handling

### **API Testing**
✅ **Database Operations**
- User CRUD operations
- Property CRUD operations
- Unit CRUD operations
- Rental CRUD operations

✅ **Business Logic**
- Standard rent updates
- Yearly overview calculations
- Payment status management

✅ **Error Handling**
- Invalid IDs
- Missing data
- Validation errors

## 🔧 Test Configuration

### **Playwright Config** (`playwright.config.ts`)
- **Base URL**: `http://localhost:3003`
- **Browsers**: Chrome, Firefox, Safari, Mobile Chrome, Mobile Safari
- **Web Server**: Automatically starts `npm run dev`
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: On retry

### **Test Environment**
- **Database**: PostgreSQL in Docker
- **Server**: Next.js development server
- **Port**: 3003

## 🐛 Troubleshooting

### **Database Issues**
```bash
# Reset database for testing
npm run db:reset

# Check database state
npm run check-db
```

### **Server Issues**
```bash
# Restart development server
npm run dev

# Check if server is running
curl http://localhost:3003
```

### **Test Failures**
```bash
# Run tests with detailed output
npm run test:debug

# Run specific test file
npx playwright test tests/e2e/user-workflow.spec.ts

# Run tests in headed mode to see what's happening
npm run test:headed
```

### **Common Issues**

#### **"Server not running"**
```bash
# Start the development server
npm run dev

# Wait for it to be ready, then run tests
npm test
```

#### **"Database connection failed"**
```bash
# Reset database
npm run db:reset

# Run tests again
npm test
```

#### **"Element not found"**
- Check if the UI has changed
- Run tests in headed mode to see the current state
- Update selectors if needed

## 📊 Test Reports

### **HTML Report**
After running tests, view the detailed HTML report:
```bash
npm run test:report
```

### **Report Features**
- **Test Results**: Pass/fail status
- **Screenshots**: On failure
- **Videos**: On failure
- **Traces**: Step-by-step execution
- **Error Details**: Full error messages

## 🎯 Best Practices

### **Writing Tests**
1. **Use descriptive test names**
2. **Test one thing at a time**
3. **Use `test.step()` for complex workflows**
4. **Add proper assertions**
5. **Handle async operations correctly**

### **Selectors**
- **Prefer role-based selectors**: `getByRole('button', { name: 'Save' })`
- **Use labels for forms**: `getByLabel('Email')`
- **Avoid CSS selectors when possible**

### **Data Management**
- **Create test data in setup**
- **Clean up after tests**
- **Use unique identifiers**

## 🔄 Continuous Integration

### **GitHub Actions Example**
```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 20
      - run: npm ci
      - run: npm run docker:up
      - run: npm run db:sync
      - run: npm test
      - uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📝 Test Data

### **Test Users**
- **E2E Test User**: `e2etest@example.com`
- **API Test Users**: Various test emails for API tests

### **Test Properties**
- **Test Property**: Basic property for testing
- **API Test Property**: Property for API tests

### **Test Units**
- **Hauptwohnung**: Main unit for testing
- **API Test Unit**: Unit for API tests

## 🚨 Emergency Testing

If tests are completely broken:
```bash
# Complete reset
docker-compose down -v
npm run docker:up
npm run db:sync
npm run dev

# Wait for server to be ready, then test
npm test
```
