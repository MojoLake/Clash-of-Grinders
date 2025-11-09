# Supabase Local Development

This folder contains your Supabase configuration and migrations for local development.

## Quick Start

### 1. Install Prerequisites

```bash
# Install Docker Desktop (required)
# Download from: https://www.docker.com/products/docker-desktop/

# Install Supabase CLI
brew install supabase/tap/supabase
```

### 2. Initialize (First Time Only)

```bash
# Initialize Supabase in this project
supabase init

# This creates config.toml if it doesn't exist
```

### 3. Start Local Supabase

```bash
# Start all Supabase services locally
npm run supabase:start
# or
supabase start
```

**First run:** Downloads Docker images (~2-3 minutes)  
**Subsequent runs:** Starts in ~10 seconds

### 4. Get Your Local Credentials

After `supabase start`, you'll see:

```
         API URL: http://127.0.0.1:54321
      Studio URL: http://127.0.0.1:54323
 Publishable key: sb_publishable_...  (this is your anon key)
      Secret key: sb_secret_...        (this is your service_role key)
```

## Key Mapping

| Old Term (in docs) | New Term (in CLI output) | Your Value                                       |
| ------------------ | ------------------------ | ------------------------------------------------ |
| `anon key`         | `Publishable key`        | `sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH` |
| `service_role key` | `Secret key`             | `sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz`      |

## Your `.env.local` should be:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH
SUPABASE_SERVICE_ROLE_KEY=sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz
```

## Documentation Update Needed

The README should be updated to reflect the new terminology. Here's what needs to change in `supabase/README.md`:

```markdown:supabase/README.md
<code_block_to_apply_changes_from>
```

         API URL: http://127.0.0.1:54321
      Studio URL: http://127.0.0.1:54323

Publishable key: sb*publishable*... (this is your anon key)
Secret key: sb*secret*... (this is your service_role key)

````

### 5. Create `.env.local`

Create a file called `.env.local` in the project root:

```bash
NEXT_PUBLIC_SUPABASE_URL=http://127.0.0.1:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=<paste-publishable-key-here>
SUPABASE_SERVICE_ROLE_KEY=<paste-secret-key-here>
````

### 6. Access Local Studio

Open in browser: **http://localhost:54323**

This is your local Supabase dashboard (like the online version).

### 7. Create Test Users

**Option A: Via Studio UI (easiest)**

- Go to http://localhost:54323
- Click: Authentication → Users → Add user
- Fill in email/password

**Option B: Via curl**

```bash
curl -X POST 'http://localhost:54321/auth/v1/signup' \
  -H "apikey: YOUR_LOCAL_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "options": {
      "data": {
        "display_name": "Test User"
      }
    }
  }'
```

## Folder Structure

```
supabase/
├── README.md              # This file
├── config.toml            # Local Supabase configuration
├── seed.sql              # Test data (runs on db reset)
└── migrations/           # Database migrations
    ├── 20250109000000_initial_schema.sql
    └── 20250109000001_auto_create_profiles.sql
```

## Useful Commands

### Start/Stop

```bash
npm run supabase:start      # Start local Supabase
npm run supabase:stop       # Stop local Supabase
npm run supabase:restart    # Restart
npm run supabase:status     # Check status
npm run supabase:studio     # Open Studio in browser
```

### Database

```bash
npm run supabase:reset      # Fresh DB + run all migrations
npm run db:migrate my_name  # Create new migration file
npm run db:push            # Push migrations to production
```

### Manual Commands

```bash
supabase db reset          # Fresh start
supabase migration new X   # Create migration
supabase db diff           # Compare local vs remote
supabase db pull           # Pull remote schema
```

## Migrations

### Current Migrations

1. **20250109000000_initial_schema.sql**

   - Creates `profiles` table
   - Creates `rooms` table
   - Creates `room_memberships` table
   - Creates `sessions` table
   - Sets up RLS policies

2. **20250109000001_auto_create_profiles.sql**
   - Automatically creates profiles when users sign up
   - No manual profile creation needed!

### Creating New Migrations

```bash
# Create a new migration
npm run db:migrate add_feature_x

# Edit the generated file
# Add your SQL changes

# Test locally
npm run supabase:reset

# Push to production when ready
npm run db:push
```

## Development Workflow

### Daily Development

```bash
# 1. Start Supabase (if not already running)
npm run supabase:start

# 2. Start Next.js
npm run dev

# 3. Code away!
# - Next.js: http://localhost:3000
# - Studio: http://localhost:54323

# 4. Need fresh DB?
npm run supabase:reset
```

### Making DB Changes

```bash
# 1. Create migration
npm run db:migrate my_change

# 2. Edit: supabase/migrations/YYYYMMDDHHMMSS_my_change.sql
# Add your SQL

# 3. Apply locally
npm run supabase:reset

# 4. Test in your app

# 5. When ready, push to production
npm run db:push
```

## Troubleshooting

### Docker Not Running

**Error:** Cannot connect to Docker daemon

**Fix:**

```bash
# Start Docker Desktop
open -a Docker
# Wait for it to start, then retry
```

### Port Already in Use

**Error:** Port 54321 already allocated

**Fix:**

```bash
npm run supabase:stop
# Then start again
npm run supabase:start
```

### Migrations Failing

**Error:** Migration failed

**Fix:**

```bash
# Check your SQL syntax in migration files
# Common issues:
# - Missing semicolons
# - Wrong table order (foreign keys)
# - Typos in table/column names

# After fixing:
npm run supabase:reset
```

### Wrong Environment

**Error:** Network error / Can't connect

**Fix:**
Check your `.env.local`:

```bash
# Should be localhost, not supabase.co
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
```

### Nuclear Option (Fresh Start)

If everything is broken:

```bash
npm run supabase:stop
rm -rf .supabase
npm run supabase:start
```

## Seed Data

The `seed.sql` file runs automatically during `supabase db reset`.

To add test data:

1. Create users via Studio UI first
2. Copy their UUIDs
3. Edit `seed.sql` with real UUIDs
4. Run `npm run supabase:reset`

## Production Deployment

When ready to deploy migrations:

```bash
# 1. Link to your remote project (first time only)
supabase link --project-ref your-project-ref

# 2. Push migrations
npm run db:push

# 3. Update .env.production with production credentials
```

## Resources

- 📚 Full Guide: [planning/12-LOCAL-DEVELOPMENT-SETUP.md](../planning/12-LOCAL-DEVELOPMENT-SETUP.md)
- 🌐 Supabase Docs: https://supabase.com/docs/guides/cli
- 🐳 Docker Desktop: https://www.docker.com/products/docker-desktop/
