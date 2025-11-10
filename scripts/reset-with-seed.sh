#!/bin/bash

# Reset database with test user and seed data
# This script automates the process of resetting the DB and creating test data

set -e

echo "🔄 Resetting database..."
supabase db reset

echo ""
echo "👤 Creating test user..."

# Get the anon key from the local Supabase config
ANON_KEY=$(grep 'anon_key' supabase/.temp/project-ref/config.toml | cut -d'"' -f2 || echo "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0")

# Create test user via Auth API
RESPONSE=$(curl -s -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@local.dev",
    "password": "test1234",
    "options": {
      "data": {
        "display_name": "Test User"
      }
    }
  }')

# Extract user ID from response
USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to create user. Response:"
  echo $RESPONSE
  exit 1
fi

echo "✅ Test user created with ID: $USER_ID"
echo ""
echo "📝 Creating seed data..."

# Run seed data with the actual user ID
psql "postgresql://postgres:postgres@localhost:54322/postgres" <<EOF
DO \$\$
DECLARE
  test_user_id UUID := '$USER_ID';
  morning_room_id UUID;
  night_room_id UUID;
BEGIN
  -- Create test rooms
  INSERT INTO rooms (name, description, created_by)
  VALUES ('Morning Grinders', 'Early bird study group', test_user_id)
  RETURNING id INTO morning_room_id;

  INSERT INTO rooms (name, description, created_by)
  VALUES ('Night Owls', 'Late night coding sessions', test_user_id)
  RETURNING id INTO night_room_id;

  -- Add room memberships
  INSERT INTO room_memberships (room_id, user_id, role)
  VALUES 
    (morning_room_id, test_user_id, 'owner'),
    (night_room_id, test_user_id, 'owner');

  -- Create a sample session
  INSERT INTO sessions (user_id, room_id, started_at, ended_at, duration_seconds)
  VALUES (
    test_user_id,
    morning_room_id,
    NOW() - INTERVAL '2 hours',
    NOW() - INTERVAL '30 minutes',
    5400  -- 90 minutes
  );

  RAISE NOTICE 'Seed data created successfully for user %', test_user_id;
END \$\$;
EOF

echo ""
echo "✅ Database reset complete!"
echo ""
echo "📋 Test credentials:"
echo "   Email: test@local.dev"
echo "   Password: test1234"
echo "   User ID: $USER_ID"
echo ""
echo "🎯 Next steps:"
echo "   1. Visit http://localhost:3000/login"
echo "   2. Login with the credentials above"
echo "   3. View your test rooms and session data"

