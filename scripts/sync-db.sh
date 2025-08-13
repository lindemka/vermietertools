#!/bin/bash

echo "🔄 Starting database synchronization..."

# Check if Docker containers are running
echo "📦 Checking Docker containers..."
if ! docker ps | grep -q "vermietertools-db"; then
    echo "❌ Database container not running. Starting Docker Compose..."
    docker-compose up -d db
    sleep 5
fi

# Check database connection
echo "🔌 Testing database connection..."
if ! docker exec vermietertools-db pg_isready -U postgres; then
    echo "❌ Database not ready. Waiting..."
    sleep 10
fi

# Reset database and push schema
echo "🗄️ Resetting database schema..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermietertools"
npx prisma db push --force-reset

# Generate Prisma client
echo "🔧 Generating Prisma client..."
export DATABASE_URL="postgresql://postgres:postgres@localhost:5432/vermietertools"
npx prisma generate

# Verify tables exist
echo "✅ Verifying database tables..."
docker exec vermietertools-db psql -U postgres -d vermietertools -c "\dt"

echo "🎉 Database synchronization complete!"
echo ""
echo "📋 Next steps:"
echo "1. Restart your Next.js development server: npm run dev"
echo "2. Create a test user and property to verify everything works"
echo ""
echo "🔧 If you need to reset everything:"
echo "   docker-compose down -v && docker-compose up -d db && ./scripts/sync-db.sh"
