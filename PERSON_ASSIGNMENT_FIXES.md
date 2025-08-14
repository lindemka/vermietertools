# Person Assignment Functionality Fixes

## Overview
This document outlines the comprehensive fixes made to the person assignment functionality for properties and units in the Vermietertools application.

## Issues Identified and Fixed

### 1. Inconsistent Session Handling
**Problem**: Some API routes used `getSession()` while others used `getUserFromSession()`, causing authentication inconsistencies.

**Solution**: Standardized all person assignment API routes to use `getUserFromSession()` for consistent authentication.

**Files Modified**:
- `app/api/properties/[id]/people/[personId]/route.ts`
- `app/api/units/[id]/people/[personId]/route.ts`

### 2. Incorrect Parameter Usage in DELETE Routes
**Problem**: The DELETE routes were using `params.personId` as the PropertyPerson/UnitPerson ID instead of the actual relationship ID, causing deletion failures.

**Solution**: Fixed the logic to:
1. Use `params.personId` to find the relationship by `personId` and `propertyId`/`unitId`
2. Use the found relationship's `id` for the actual update/delete operation

**Files Modified**:
- `app/api/properties/[id]/people/[personId]/route.ts`
- `app/api/units/[id]/people/[personId]/route.ts`

### 3. Frontend API Call Issues
**Problem**: Frontend components were passing the wrong parameters to the DELETE API endpoints.

**Solution**: Updated frontend components to pass the entire person object instead of just the ID, allowing the API to extract the correct `personId`.

**Files Modified**:
- `components/PropertyPeopleManager.tsx`
- `components/UnitPeopleManager.tsx`

### 4. Improved Error Handling and Validation
**Problem**: Error messages were in English and not user-friendly.

**Solution**: 
- Translated all error messages to German
- Improved error message clarity and user-friendliness
- Enhanced error handling in frontend components

**Files Modified**:
- `app/api/properties/[id]/people/route.ts`
- `app/api/units/[id]/people/route.ts`
- `app/api/properties/[id]/people/[personId]/route.ts`
- `app/api/units/[id]/people/[personId]/route.ts`
- `components/PropertyPeopleManager.tsx`
- `components/UnitPeopleManager.tsx`

### 5. Duplicate Assignment Prevention
**Problem**: The system allowed the same person to be assigned multiple times to the same property/unit.

**Solution**: Modified the duplicate check to prevent any person from being assigned to the same property/unit more than once, regardless of role.

**Files Modified**:
- `app/api/properties/[id]/people/route.ts`
- `app/api/units/[id]/people/route.ts`

## API Endpoints Fixed

### Property People Management
- `GET /api/properties/[id]/people` - List people assigned to a property
- `POST /api/properties/[id]/people` - Add person to property
- `PUT /api/properties/[id]/people/[personId]` - Update person role in property
- `DELETE /api/properties/[id]/people/[personId]` - Remove person from property

### Unit People Management
- `GET /api/units/[id]/people` - List people assigned to a unit
- `POST /api/units/[id]/people` - Add person to unit
- `PUT /api/units/[id]/people/[personId]` - Update person role in unit
- `DELETE /api/units/[id]/people/[personId]` - Remove person from unit

## Database Schema
The person assignment functionality uses the following database models:

### PropertyPerson
```prisma
model PropertyPerson {
  id        String   @id @default(cuid())
  role      String   // e.g., "hausmeister", "hausverwaltung", "owner"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  personId   String
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([personId, propertyId, role])
  @@map("property_people")
}
```

### UnitPerson
```prisma
model UnitPerson {
  id        String   @id @default(cuid())
  role      String   // e.g., "tenant", "co-tenant", "subtenant"
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  personId String
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  unitId   String
  unit     Unit   @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@unique([personId, unitId, role])
  @@map("unit_people")
}
```

## Available Roles

### Property Roles
- `hausmeister` - Hausmeister
- `hausverwaltung` - Hausverwaltung
- `eigentümer` - Eigentümer
- `verwalter` - Verwalter
- `wartung` - Wartung
- `sicherheit` - Sicherheit
- `sonstiges` - Sonstiges

### Unit Roles
- `tenant` - Mieter
- `co_tenant` - Mitmieter
- `subtenant` - Untermieter
- `guarantor` - Bürge
- `emergency_contact` - Notfallkontakt
- `other` - Sonstiges

## Testing
A comprehensive test script has been created to verify the functionality:

```bash
node scripts/test-person-assignments.js
```

The test covers:
1. Creating test data (user, person, property, unit)
2. Property-person assignments
3. Unit-person assignments
4. Querying assignments
5. Updating roles
6. Soft deletion
7. Duplicate assignment prevention
8. Data cleanup

## Frontend Components
The person assignment functionality is implemented through two main components:

### PropertyPeopleManager
- Manages person assignments for properties
- Provides search functionality for available people
- Allows role selection and assignment
- Supports removal of assignments

### UnitPeopleManager
- Manages person assignments for units
- Similar functionality to PropertyPeopleManager
- Tailored for unit-specific roles

## Security Features
- All endpoints require authentication
- Users can only access their own properties and units
- Soft deletion prevents data loss
- Unique constraints prevent duplicate assignments

## Error Handling
All error messages are now in German and provide clear feedback:
- Authentication errors
- Validation errors
- Not found errors
- Duplicate assignment errors
- Server errors

## Future Improvements
1. Add bulk assignment functionality
2. Implement assignment history tracking
3. Add role-based permissions
4. Create assignment templates
5. Add email notifications for assignments

## Migration Notes
- No database migrations required
- Existing assignments will continue to work
- Soft deletion ensures no data loss
- All changes are backward compatible
