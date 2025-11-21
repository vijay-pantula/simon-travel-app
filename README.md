# Travel Portal - Project Consultant Management System

A comprehensive travel management system for consultants with integrated flight, hotel, and car search capabilities using the Amadeus API.

## 🚀 Features

- **Flight Search** - Search and compare flight options with configurable "Best Value" scoring
- **Hotel Search** - Find hotels using Amadeus Hotel API
- **Car Rental Search** - Search for car rentals at destination
- **Project Management** - Manage projects, consultants, and assignments
- **Reimbursement Workflow** - Submit, approve, and track reimbursements
- **Email Notifications** - Automated emails for reimbursement status updates
- **File Uploads** - Receipt upload and storage
- **Role-Based Access** - Admin and Consultant roles with appropriate permissions

## 🛠️ Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **APIs**: Amadeus Travel API, Resend Email API
- **Styling**: CSS

## 📋 Prerequisites

- Node.js 18+ and npm
- Supabase account
- Amadeus API credentials (free tier available)
- Resend API key (for email notifications)

## 🔧 Setup Instructions

### 1. Clone the Repository

```bash
git clone <your-repo-url>
cd project
npm install
```

### 2. Create Supabase Project

1. Go to [supabase.com](https://supabase.com)
2. Create a new project
3. Note your project URL and anon key

### 3. Run Database Migrations

Go to Supabase Dashboard → SQL Editor and run these migrations **in order**:

1. `supabase/migrations/20251110151625_create_travel_management_schema.sql`
2. `supabase/migrations/20251110160916_fix_user_roles_rls_policies.sql`
3. `supabase/migrations/20251121000000_add_hotel_schema.sql`
4. `supabase/migrations/20251122000000_add_car_schema.sql`
5. `supabase/migrations/20251123000000_add_flight_searches.sql`

### 4. Deploy Edge Functions

```bash
# Login to Supabase
npx supabase login

# Link to your project
npx supabase link --project-ref <your-project-ref>

# Deploy functions
npx supabase functions deploy search-flights --no-verify-jwt
npx supabase functions deploy search-hotels --no-verify-jwt
npx supabase functions deploy search-cars --no-verify-jwt
npx supabase functions deploy send-reimbursement-email --no-verify-jwt
npx supabase functions deploy save-hotel-search --no-verify-jwt
npx supabase functions deploy save-car-search --no-verify-jwt
npx supabase functions deploy get-assignment-searches --no-verify-jwt
```

### 5. Set Edge Function Secrets

```bash
# Amadeus API credentials
npx supabase secrets set AMADEUS_CLIENT_ID=your_client_id
npx supabase secrets set AMADEUS_CLIENT_SECRET=your_client_secret

# Resend API key
npx supabase secrets set RESEND_API_KEY=your_resend_key
```

### 6. Configure Environment Variables

Create `.env` file in the project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 7. Run the Application

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173)

## 👤 First User Setup

1. Sign up for an account
2. Go to Supabase Dashboard → SQL Editor
3. Run this query to make yourself an admin:

```sql
INSERT INTO user_roles (user_id, role)
VALUES ('your-user-id-from-auth-users-table', 'admin');
```

## 📚 API Documentation

### Amadeus API

- Sign up at [developers.amadeus.com](https://developers.amadeus.com)
- Get your API credentials (Client ID and Secret)
- Free tier includes 2,000 API calls/month

### Resend API

- Sign up at [resend.com](https://resend.com)
- Get your API key
- Free tier includes 100 emails/day

## 🏗️ Project Structure

```
project/
├── src/
│   ├── components/
│   │   ├── admin/          # Admin-only components
│   │   └── consultant/     # Consultant components
│   ├── contexts/           # React contexts (Auth)
│   ├── lib/               # Supabase client
│   └── utils/             # Utility functions
├── supabase/
│   ├── functions/         # Edge Functions
│   └── migrations/        # Database migrations
└── public/               # Static assets
```

## 🐛 Known Issues

### PostgREST Schema Cache Issue

If you encounter "table not found" errors for `hotel_searches` or `car_searches`:

**Solution**: This is a Supabase PostgREST schema cache issue. The code is correct. To fix:
1. Create a fresh Supabase project
2. Run migrations in order
3. Deploy Edge Functions
4. Everything will work

**Why this happens**: Rare schema cache bug when tables are created in certain sequences.

## 🔐 Security

- Row Level Security (RLS) enabled on all tables
- Role-based access control (Admin/Consultant)
- Service role key used only in Edge Functions
- File uploads restricted by RLS policies

## 📝 License

MIT

## 🤝 Contributing

Contributions welcome! Please open an issue or PR.

## 📧 Support

For issues or questions, please open a GitHub issue.
