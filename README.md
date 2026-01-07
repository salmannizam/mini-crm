# Mini CRM - Role-Based Lead Management System

A comprehensive CRM system built with Next.js, MongoDB, and TypeScript. Features role-based access control, lead management, follow-ups, comments, and activity tracking.

## Features

- **Authentication & Authorization**
  - JWT-based authentication with HTTP-only cookies
  - Role-based access control (Admin/User)
  - Middleware-based route protection

- **User Management (Admin Only)**
  - Create, activate/deactivate users
  - View all users with lead counts
  - Soft delete functionality

- **Lead Management**
  - Create, view, edit leads
  - Status tracking (New, Contacted, Follow-Up, Converted, Lost)
  - Lead assignment (Admin can assign to any user)
  - Search and filter capabilities
  - Pagination

- **Follow-Ups**
  - Schedule multiple follow-ups per lead
  - Overdue follow-ups highlighting
  - Timeline view

- **Comments System**
  - Multiple comments per lead
  - Admin comments visually marked
  - Read-only history

- **Activity Logs**
  - Track all lead activities
  - Status changes, reassignments, comments
  - Full history timeline

- **Dashboards**
  - Admin dashboard with comprehensive statistics
  - User dashboard with personal metrics
  - Recent activity timeline

## Tech Stack

- **Frontend:** Next.js 16 (App Router), TypeScript, TailwindCSS
- **Backend:** Next.js API Routes
- **Database:** MongoDB with Mongoose
- **Auth:** JWT + HTTP-only cookies
- **UI Components:** Custom components inspired by ShadCN UI
- **Validation:** Zod
- **Date Handling:** Day.js
- **Icons:** Lucide React

## Getting Started

### Prerequisites

- Node.js 18+ 
- MongoDB (local or cloud instance)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd practice
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:
```env
MONGODB_URI=mongodb://localhost:27017/mini-crm
JWT_SECRET=your-super-secret-jwt-key-change-in-production
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
NODE_ENV=development
```

4. Seed the database with initial admin user:
```bash
npm run seed
```

5. Start the development server:
```bash
npm run dev
```

6. Open [http://localhost:3000](http://localhost:3000) in your browser.

### Default Admin Credentials

After running the seed script, you can login with:
- **Email:** admin@example.com (or your ADMIN_EMAIL)
- **Password:** admin123 (or your ADMIN_PASSWORD)

**Important:** Change the default password after first login!

## Project Structure

```
practice/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── auth/          # Authentication endpoints
│   │   ├── users/         # User management endpoints
│   │   ├── leads/         # Lead management endpoints
│   │   └── dashboard/     # Dashboard data endpoint
│   ├── dashboard/         # Dashboard page
│   ├── leads/             # Lead pages
│   ├── users/             # User management page
│   └── login/             # Login page
├── components/            # React components
│   ├── ui/               # Reusable UI components
│   ├── layout/           # Layout components
│   ├── dashboard/        # Dashboard components
│   ├── leads/            # Lead-related components
│   └── users/            # User management components
├── lib/                  # Utility functions
│   ├── auth.ts          # Client-side auth utilities
│   ├── server-auth.ts   # Server-side auth utilities
│   ├── db.ts            # Database connection
│   ├── validations.ts   # Zod schemas
│   └── constants.ts     # Constants and enums
├── models/              # Mongoose models
│   ├── User.ts          # User model
│   └── Lead.ts          # Lead model
├── scripts/             # Utility scripts
│   └── seed.ts         # Database seed script
└── middleware.ts        # Next.js middleware
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout

### Users (Admin Only)
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user by ID
- `PATCH /api/users/:id` - Update user
- `DELETE /api/users/:id` - Soft delete user

### Leads
- `GET /api/leads` - Get leads (with pagination, search, filters)
- `POST /api/leads` - Create lead
- `GET /api/leads/:id` - Get lead by ID
- `PATCH /api/leads/:id` - Update lead
- `DELETE /api/leads/:id` - Soft delete lead
- `POST /api/leads/:id/comments` - Add comment
- `POST /api/leads/:id/followups` - Add follow-up

### Dashboard
- `GET /api/dashboard` - Get dashboard data (role-based)

## User Roles

### Admin
- Full access to all features
- Can create and manage users
- Can view and manage all leads
- Can assign leads to any user
- Can see all statistics

### User
- Can only view own leads
- Can create own leads
- Can edit own leads
- Can add comments and follow-ups to own leads
- Can view own dashboard

## Security Features

- Password hashing with bcrypt
- JWT tokens stored in HTTP-only cookies
- Input validation with Zod
- Role-based route protection
- Soft delete (no hard deletes)
- Inactive users cannot login

## Development

### Running in Development Mode
```bash
npm run dev
```

### Building for Production
```bash
npm run build
npm start
```

### Seeding Database
```bash
npm run seed
```

## License

This project is private and proprietary.
# mini-crm
