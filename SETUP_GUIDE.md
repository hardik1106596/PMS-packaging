# PMS Packaging - Full Setup Guide

## Project Overview
- **Frontend**: React 18 + Vite (port 3000)
- **Backend**: Express + Prisma + PostgreSQL (port 5000)
- **Database**: PostgreSQL (required for Prisma ORM)

---

## Prerequisites

### Required Software
1. **Node.js** (v18+) - Already installed
2. **PostgreSQL** (v12+) - Required for database
3. **Git** (optional, for version control)

---

## Installation & Setup

### Step 1: Install PostgreSQL

#### On Windows:
1. Download PostgreSQL installer from https://www.postgresql.org/download/windows/
2. Run the installer
3. During installation:
   - Set password for `postgres` user (default in .env is "postgres")
   - Keep port as 5432 (default)
   - Accept default components
4. After installation, PostgreSQL runs as a Windows service

#### Verify PostgreSQL is Running:
```powershell
# Start PostgreSQL if not running
net start postgresql-x64-<version>

# Or use Windows Services to start PostgreSQL
```

### Step 2: Create Database

```powershell
# Connect to PostgreSQL
psql -U postgres

# In psql shell, create database:
CREATE DATABASE pms_packaging;
\q

# Or using one command:
createdb -U postgres pms_packaging
```

### Step 3: Setup Backend

```powershell
cd backend

# Install dependencies
npm install

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npx prisma migrate dev --name init

# (Optional) Seed initial data
node prisma/seed.js
```

### Step 4: Start Backend

```powershell
cd backend

# Development mode (with auto-reload)
npm run dev

# Or production mode
npm start
```

✅ Backend should be running on `http://localhost:5000`

### Step 5: Start Frontend

```powershell
cd frontend

# Development mode
npm run dev
```

✅ Frontend will be available on `http://localhost:3000`

---

## Verification

1. **Frontend**: Open http://localhost:3000 - Should see PMS Packaging homepage
2. **Backend API**: Open http://localhost:5000/api/health - Should see JSON response
3. **Database**: Connect to PostgreSQL to verify tables were created

---

## Environment Variables

### Backend (.env file)
```
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/pms_packaging"
JWT_SECRET=supersecretjwtkey
JWT_REFRESH_SECRET=supersecretrefreshkey
CLIENT_URL=http://localhost:3000
COOKIE_SECRET=cookiesecretkey
NODE_ENV=development
```

---

## Common Issues & Solutions

### Issue 1: PostgreSQL Connection Failed
**Error**: `Error: connect ECONNREFUSED 127.0.0.1:5432`

**Solution**:
- Check if PostgreSQL service is running:
  ```powershell
  Get-Service postgresql*
  ```
- Start PostgreSQL if stopped:
  ```powershell
  Start-Service "postgresql-x64-14"  # Adjust version number
  ```

### Issue 2: Database pms_packaging does not exist
**Error**: `FATAL: database "pms_packaging" does not exist`

**Solution**:
```powershell
# Create the database
createdb -U postgres pms_packaging

# Or in psql:
psql -U postgres
# Then: CREATE DATABASE pms_packaging;
```

### Issue 3: Port Already in Use
**Error**: `listen EADDRINUSE :::5000`

**Solution**:
```powershell
# Find process using port 5000
netstat -ano | findstr :5000

# Kill the process (replace PID with the actual process ID)
taskkill /PID <PID> /F
```

### Issue 4: Module not found errors
**Solution**: The case-sensitivity import errors have been fixed. If you see "asyncHandler" import errors, verify the import uses "AsyncHandler" with capital A.

---

## Development Workflow

### Running Both Frontend & Backend

**Terminal 1 - Backend:**
```powershell
cd backend
npm run dev
```

**Terminal 2 - Frontend:**
```powershell
cd frontend
npm run dev
```

### Database Migrations

Add new fields to database:
```powershell
cd backend
npx prisma migrate dev --name <description>
```

View database GUI:
```powershell
cd backend
npx prisma studio
```

---

## Project Structure

```
pms-packaging/
├── backend/
│   ├── src/
│   │   ├── app.js                 # Express app setup
│   │   ├── server.js              # Server entry point
│   │   ├── config/                # Configuration files
│   │   ├── controllers/           # Route handlers
│   │   ├── middleware/            # Custom middleware
│   │   ├── routes/                # API routes
│   │   ├── services/              # Business logic
│   │   ├── utils/                 # Helper functions
│   │   └── uploads/               # Uploaded files (invoices, images)
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema
│   │   └── seed.js                # Seed data
│   ├── package.json
│   └── .env                       # Environment variables
│
└── frontend/
    ├── src/
    │   ├── App.jsx                # Main app component
    │   ├── components/            # React components
    │   ├── context/               # React context
    │   ├── pages/                 # Page components
    │   ├── services/              # API calls
    │   └── index.css              # Global styles
    ├── vite.config.js
    ├── tailwind.config.js
    └── package.json
```

---

## Features

### Backend
- ✅ User authentication (JWT)
- ✅ Product management
- ✅ Order processing
- ✅ Payment integration (Razorpay)
- ✅ Invoice generation
- ✅ Admin dashboard
- ✅ Wishlist & Reviews
- ✅ Email notifications
- ✅ WhatsApp notifications

### Frontend
- ✅ Responsive design (Tailwind CSS)
- ✅ Product browsing
- ✅ Shopping cart
- ✅ User authentication
- ✅ Order tracking
- ✅ Admin panel

---

## Additional Commands

### Backend
```powershell
cd backend

# Install dependencies
npm install

# Start development server (with auto-reload)
npm run dev

# Start production server
npm start

# Generate Prisma Client
npm run prisma:generate

# Run database migrations
npx prisma migrate dev

# Seed database
node prisma/seed.js

# View database UI
npx prisma studio

# Check for audit vulnerabilities
npm audit
npm audit fix
```

### Frontend
```powershell
cd frontend

# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Check for audit vulnerabilities
npm audit
npm audit fix
```

---

## API Endpoints

### Health Check
- `GET /api/health` - Check API status

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `POST /api/auth/logout` - User logout

### Products
- `GET /api/products` - List all products
- `GET /api/products/:id` - Get product details
- `POST /api/products` - Create product (admin only)
- `PUT /api/products/:id` - Update product (admin only)
- `DELETE /api/products/:id` - Delete product (admin only)

### Orders
- `GET /api/orders` - List user orders
- `POST /api/checkout` - Create order
- `GET /api/orders/:orderNumber` - Get order details

### Payments
- `POST /api/payments/razorpay` - Razorpay payment endpoint

---

## Troubleshooting

### Server won't start
1. Check environment variables in `.env`
2. Verify PostgreSQL is running
3. Check if port 5000 is already in use
4. Look at error messages in terminal

### Frontend not connecting to backend
1. Verify backend is running on port 5000
2. Check `CLIENT_URL` in backend `.env` matches frontend URL
3. Check browser console for CORS errors

### Database migration errors
1. Verify DATABASE_URL is correct
2. Check PostgreSQL is running
3. Ensure database exists and is accessible
4. Delete `node_modules/.prisma` folder and run migrations again

---

## Next Steps

1. ✅ Setup PostgreSQL database
2. ✅ Run backend migrations
3. ✅ Start both backend and frontend servers
4. ✅ Open http://localhost:3000 in browser
5. ✅ Test user registration and login
6. ✅ Browse products and create orders
7. ✅ Access admin dashboard

---

## Support

For issues or questions, check:
- Backend logs (terminal where `npm run dev` is running)
- Browser console (F12 in frontend)
- PostgreSQL logs
- `.env` file configuration

Good luck with your PMS Packaging project! 🚀
