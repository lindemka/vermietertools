# Database Synchronization Guide

## 🚀 Quick Commands

### **Easy Sync (Recommended)**
```bash
npm run db:sync
```

### **Complete Reset (Destructive)**
```bash
npm run db:reset
```

### **Check Database State**
```bash
npm run check-db
```

## 🔧 Manual Steps

### **1. Environment Setup**
Make sure `.env.local` exists with:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermietertools"
```

### **2. Database Container**
```bash
# Start database
npm run docker:up

# Restart database
npm run docker:restart

# Stop everything
npm run docker:down
```

### **3. Schema Operations**
```bash
# Force reset and push schema
npm run db:push:reset

# Generate Prisma client
npm run db:generate

# Pull schema from database
npx prisma db pull
```

## 🐛 Troubleshooting

### **Issue: "Environment variable not found: DATABASE_URL"**
**Solution:**
```bash
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermietertools"
npx prisma db push --force-reset
```

### **Issue: "Unknown argument rentAmount"**
**Solution:**
```bash
npm run db:sync
# Then restart the development server
npm run dev
```

### **Issue: Database container not running**
**Solution:**
```bash
docker-compose up -d db
sleep 5
npm run db:sync
```

### **Issue: Tables don't exist after sync**
**Solution:**
```bash
# Check if database exists
docker exec vermietertools-db psql -U postgres -c "\l"

# Check tables in correct database
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\dt"

# If tables don't exist, force reset
npm run db:push:reset
```

## 📋 Verification Steps

### **1. Check Database Connection**
```bash
docker exec vermietertools-db pg_isready -U postgres
```

### **2. Check Tables Exist**
```bash
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\dt"
```

### **3. Check Table Structure**
```bash
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\d rentals"
```

### **4. Test API**
```bash
curl -X POST http://localhost:3003/api/units/test-id/yearly-overview \
  -H "Content-Type: application/json" \
  -d '{"month":1,"year":2025,"isPaid":false,"notes":"","rentAmount":500,"utilitiesAmount":90}'
```

## 🎯 Common Workflows

### **Fresh Setup**
```bash
npm run docker:up
npm run db:sync
npm run dev
```

### **Schema Changes**
```bash
# Edit prisma/schema.prisma
npm run db:push:reset
npm run db:generate
npm run dev
```

### **Database Issues**
```bash
npm run db:reset
npm run dev
```

## 📝 Notes

- **Always restart the development server** after schema changes
- **The database container must be running** before any Prisma operations
- **Environment variables** must be set correctly for Prisma to work
- **Force reset** (`--force-reset`) will delete all data - use with caution
- **Unit IDs** change after database resets - you'll need to create new test data

## 🔄 Sync Script Details

The `scripts/sync-db.sh` script:
1. Checks if Docker containers are running
2. Tests database connection
3. Exports DATABASE_URL environment variable
4. Resets database schema with `--force-reset`
5. Generates Prisma client
6. Verifies tables exist

## 🚨 Emergency Reset

If everything is broken:
```bash
# Stop everything
docker-compose down -v

# Start fresh
docker-compose up -d db
sleep 10
npm run db:sync
npm run dev
```
