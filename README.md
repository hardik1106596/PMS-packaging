# 📦 PMS Packaging Pvt. Ltd.
### Production-Grade Full-Stack B2B/B2C E-Commerce Platform

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Neon-blue?logo=postgresql)
![Prisma](https://img.shields.io/badge/Prisma-ORM-2D3748?logo=prisma)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)
![JWT](https://img.shields.io/badge/Auth-JWT-orange)
![License](https://img.shields.io/badge/License-MIT-success)

A **modern, production-ready B2B/B2C E-Commerce Platform** built using **React**, **Node.js**, **Express**, **Prisma**, and **PostgreSQL**.

The platform includes complete customer shopping functionality, secure authentication, Razorpay payments, invoice generation with QR codes, transactional emails, WhatsApp order notifications, inventory management, analytics dashboard, coupon management, and an enterprise-level admin panel.

---

# 🚀 Features

## 👤 Customer Features

- User Registration & Login
- JWT Authentication
- Refresh Token Authentication
- Forgot Password
- Reset Password
- User Profile
- Edit Profile
- Change Password
- Product Search
- Product Filters
- Product Categories
- Product Details
- Product Images Gallery
- Related Products
- Wishlist
- Shopping Cart
- Add to Cart
- Buy Now
- Quantity Management
- Coupon Support
- Checkout
- Multiple Shipping Addresses
- Razorpay Payment
- Cash On Delivery
- Order History
- Order Tracking
- Download Invoice
- Email Invoice
- Contact Page
- About Page

---

# 🛒 Product Features

- Categories
- Brands
- Product Images
- Product Variants
- Stock Management
- Featured Products
- Best Sellers
- New Arrivals
- Related Products
- Product Rating Ready
- SEO Friendly URLs

---

# 💳 Payment Features

- Razorpay Integration
- Online Payment
- Cash On Delivery
- Payment Verification
- Payment Status
- Transaction Logs
- Payment History
- Secure Checkout

---

# 📄 Invoice Features

- Automatic Invoice Generation
- Professional PDF Invoice
- QR Code on Invoice
- Invoice Number Generation
- GST Ready Layout
- Download Invoice
- Email Invoice

---

# 📧 Email Automation

Automatically sends emails for

- Welcome Email
- Order Confirmation
- Invoice PDF
- Payment Success
- Password Reset
- Admin Order Notification

---

# 📱 WhatsApp Integration

After successful order

Owner receives

- Customer Name
- Order Number
- Total Amount
- Payment Method
- Order Summary

using WhatsApp API.

---

# 📊 Admin Dashboard

Complete Admin Panel includes

- Dashboard
- Product Management
- Category Management
- Customer Management
- Order Management
- Coupon Management
- Banner Management
- Inventory Management
- Payment Management
- Analytics
- Sales Reports
- Activity Logs

---

# 🔐 Security Features

- JWT Authentication
- Refresh Tokens
- HTTP Only Cookies
- Password Hashing (bcrypt)
- Helmet Security
- Express Rate Limiter
- CORS Protection
- Role Based Authorization
- Input Validation
- SQL Injection Protection
- XSS Protection
- Centralized Error Handling
- Secure Environment Variables

---

# 🛠 Tech Stack

## Frontend

- React
- React Router
- Tailwind CSS
- Axios
- Context API
- React Hook Form

---

## Backend

- Node.js
- Express.js
- Prisma ORM
- PostgreSQL
- JWT
- bcrypt
- Multer
- Nodemailer
- Razorpay SDK
- PDFKit
- QRCode
- Express Validator

---

## Database

- PostgreSQL (Neon)

---

## Cloud & Deployment

- Vercel
- Render
- Neon PostgreSQL

---

# 📁 Project Structure

```text
pms-packaging
│
├── backend
│   ├── prisma
│   ├── src
│   │   ├── config
│   │   ├── controllers
│   │   ├── middleware
│   │   ├── routes
│   │   ├── services
│   │   ├── utils
│   │   ├── uploads
│   │   ├── app.js
│   │   └── server.js
│   │
│   ├── package.json
│   └── .env.example
│
├── frontend
│   ├── src
│   │   ├── components
│   │   ├── context
│   │   ├── pages
│   │   ├── services
│   │   ├── App.jsx
│   │   └── main.jsx
│   │
│   ├── package.json
│   └── .env.example
│
└── README.md
```

---

# 🔄 Complete Order Workflow

```text
Customer

↓

Register / Login

↓

Browse Products

↓

Add to Cart

↓

Checkout

↓

Fill Shipping Address

↓

Apply Coupon (Optional)

↓

Select Payment Method

↓

Razorpay / COD

↓

Payment Verification

↓

Order Created

↓

Stock Updated

↓

Invoice Generated

↓

QR Code Generated

↓

PDF Created

↓

Invoice Stored

↓

Customer Email Sent

↓

Admin Email Sent

↓

WhatsApp Notification Sent

↓

Activity Logged

↓

Admin Dashboard Updated
```

---

# ⚙️ Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/pms-packaging.git

cd pms-packaging
```

---

# Backend Setup

```bash
cd backend

npm install

cp .env.example .env
```

Configure `.env`

```env
DATABASE_URL=

PORT=5000

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

RAZORPAY_WEBHOOK_SECRET=

SMTP_HOST=smtp.gmail.com

SMTP_PORT=587

SMTP_USER=

SMTP_PASS=

TWILIO_ACCOUNT_SID=

TWILIO_AUTH_TOKEN=

TWILIO_WHATSAPP_FROM=

CLIENT_URL=http://localhost:5173
```

Generate Prisma Client

```bash
npx prisma generate
```

Run Migrations

```bash
npx prisma migrate dev --name init
```

Seed Database

```bash
npm run seed
```

Start Backend

```bash
npm run dev
```

Backend

```
http://localhost:5000
```

---

# Frontend Setup

```bash
cd frontend

npm install

cp .env.example .env
```

Configure

```env
VITE_API_URL=http://localhost:5000/api
```

Run

```bash
npm run dev
```

Frontend

```
http://localhost:5173
```

---

# Default Login

## Admin

```
Email

admin@pmspackaging.com

Password

Admin@123
```

---

## Customer

```
Email

customer@example.com

Password

Customer@123
```

---

# Environment Variables

| Variable | Description |
|------------|-------------|
| DATABASE_URL | PostgreSQL Database |
| JWT_ACCESS_SECRET | JWT Secret |
| JWT_REFRESH_SECRET | Refresh Token Secret |
| SMTP_HOST | SMTP Host |
| SMTP_PORT | SMTP Port |
| SMTP_USER | Gmail |
| SMTP_PASS | Gmail App Password |
| RAZORPAY_KEY_ID | Razorpay Key |
| RAZORPAY_KEY_SECRET | Razorpay Secret |
| RAZORPAY_WEBHOOK_SECRET | Razorpay Webhook |
| CLIENT_URL | Frontend URL |
| VITE_API_URL | Backend URL |
| TWILIO_ACCOUNT_SID | Twilio SID |
| TWILIO_AUTH_TOKEN | Twilio Token |
| TWILIO_WHATSAPP_FROM | WhatsApp Sender |

---

# API Modules

- Authentication API
- User API
- Product API
- Category API
- Cart API
- Wishlist API
- Coupon API
- Order API
- Payment API
- Invoice API
- Admin API
- Analytics API

---

# Production Deployment

## Frontend

Deploy on

- Vercel

```bash
vercel --prod
```

---

## Backend

Deploy on

- Render

Build Command

```bash
npm install && npx prisma generate
```

Start Command

```bash
npm start
```

---

## Database

Deploy on

- Neon PostgreSQL

---

# Performance Optimizations

- Prisma ORM
- Database Indexing
- Lazy Loading
- Image Optimization
- Code Splitting
- Axios Interceptors
- Refresh Token Flow
- Optimized Queries
- Pagination
- Protected Routes

---

# Future Improvements

- Product Reviews
- Product Ratings
- Return & Refund
- Multi Vendor Support
- GST Billing
- Inventory Analytics
- Multi Language
- Push Notifications
- PWA Support
- AI Product Recommendations

---

# License

This project is licensed under the **MIT License**.

---

# Author

**Hardik Sagadhara**

B.Tech Information Technology

Full Stack Developer

GitHub:
https://github.com/hardik1106596

LinkedIn:
https://www.linkedin.com/

---

# ⭐ Support

If you like this project,

⭐ Star the repository

🍴 Fork it

💡 Contribute

🚀 Build something amazing!
