# People Management System

## Overview

The People Management System allows users to manage contacts with roles in properties and units. Users can create people with contact details and assign them to properties or units with specific roles.

## Features

### Core Functionality
- **Create People**: Add new people with first name, last name, email, phone, and notes
- **Edit People**: Update contact information for existing people
- **Delete People**: Soft delete people (mark as inactive)
- **Search People**: Search by name, email, or phone
- **Role Assignment**: Assign people to properties or units with specific roles
- **Role Management**: Remove people from properties or units

### Roles

#### Property Roles
- `hausmeister` - Building manager
- `hausverwaltung` - Property management
- `owner` - Property owner
- `property_manager` - Property manager
- `maintenance` - Maintenance staff
- `security` - Security personnel
- `other` - Other property-related roles

#### Unit Roles
- `tenant` - Primary tenant
- `co_tenant` - Co-tenant
- `subtenant` - Subtenant
- `guarantor` - Guarantor
- `emergency_contact` - Emergency contact
- `other` - Other unit-related roles

## Database Schema

### Person Model
```prisma
model Person {
  id          String   @id @default(cuid())
  firstName   String
  lastName    String
  email       String?
  phone       String?
  notes       String?
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Relationships
  propertyRoles PropertyPerson[]
  unitRoles     UnitPerson[]

  @@map("people")
}
```

### PropertyPerson Model
```prisma
model PropertyPerson {
  id        String   @id @default(cuid())
  role      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  personId   String
  person     Person   @relation(fields: [personId], references: [id], onDelete: Cascade)
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)

  @@unique([personId, propertyId, role])
  @@map("property_people")
}
```

### UnitPerson Model
```prisma
model UnitPerson {
  id        String   @id @default(cuid())
  role      String
  isActive  Boolean  @default(true)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  // Relations
  personId String
  person   Person @relation(fields: [personId], references: [id], onDelete: Cascade)
  unitId   String
  unit     Unit   @relation(fields: [unitId], references: [id], onDelete: Cascade)

  @@unique([personId, unitId, role])
  @@map("unit_people")
}
```

## API Endpoints

### People Management
- `GET /api/people` - Get all people with search and pagination
- `POST /api/people` - Create a new person
- `GET /api/people/[id]` - Get a specific person
- `PUT /api/people/[id]` - Update a person
- `DELETE /api/people/[id]` - Soft delete a person

### Property People Management
- `GET /api/properties/[id]/people` - Get people assigned to a property
- `POST /api/properties/[id]/people` - Add a person to a property
- `DELETE /api/properties/[id]/people/[personId]` - Remove a person from a property

### Unit People Management
- `GET /api/units/[id]/people` - Get people assigned to a unit
- `POST /api/units/[id]/people` - Add a person to a unit
- `DELETE /api/units/[id]/people/[personId]` - Remove a person from a unit

## User Interface

### Main People Page (`/people`)
- Search functionality
- Add new person form
- List of all people with their roles
- Edit and delete actions
- Pagination

### Property People Tab
- Available in property detail pages
- Add people to properties with roles
- List of people assigned to the property
- Remove people from properties

### Unit People Section
- Available in unit yearly overview pages
- Add people to units with roles
- List of people assigned to the unit
- Remove people from units

### Person Edit Page (`/people/[id]/edit`)
- Edit person contact information
- View current roles across properties and units

## Usage Examples

### Creating a Person
1. Navigate to `/people`
2. Click "Add Person"
3. Fill in the form with contact details
4. Click "Add Person"

### Assigning a Person to a Property
1. Navigate to a property detail page
2. Click the "People" tab
3. Click "Add Person"
4. Select a person and role
5. Click "Add Person"

### Assigning a Person to a Unit
1. Navigate to a unit yearly overview page
2. Scroll to the "People Management" section
3. Click "Add Person"
4. Select a person and role
5. Click "Add Person"

### Searching People
1. Navigate to `/people`
2. Use the search box to find people by name, email, or phone
3. Results are displayed in real-time

## Security Features

- **User Isolation**: Users can only see and manage their own people
- **Property/Unit Ownership**: Users can only assign people to their own properties/units
- **Soft Deletes**: People are marked as inactive rather than permanently deleted
- **Role Validation**: Prevents duplicate role assignments

## Testing

Run the test script to verify API functionality:
```bash
node scripts/test-people-api.js
```

## Migration

The people management system was added in migration `20250814061542_add_people_management`. To apply:

```bash
npx prisma migrate dev --name add_people_management
```

## Future Enhancements

- Bulk import/export of people
- Contact history and communication logs
- Document attachments for people
- Advanced role permissions
- Integration with external contact systems
- Email/SMS notifications
- Contact groups and tags
