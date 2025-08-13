#!/bin/bash

echo "🔍 Checking database state..."

# Check if container is running
if ! docker ps | grep -q "vermietertools-db"; then
    echo "❌ Database container not running"
    exit 1
fi

# Check database connection
if ! docker exec vermietertools-db pg_isready -U postgres; then
    echo "❌ Database not ready"
    exit 1
fi

echo "✅ Database container is running and ready"

# Check tables
echo "📋 Checking tables..."
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\dt"

# Check rentals table structure if it exists
echo ""
echo "🏗️ Checking rentals table structure..."
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\d rentals" 2>/dev/null || echo "❌ rentals table does not exist"

echo ""
echo "🎯 Quick fixes:"
echo "  npm run db:sync    - Sync database with schema"
echo "  npm run db:reset   - Complete reset (destructive)"
echo "  npm run db:push:reset - Force push schema"
