# 📦 PMS Packaging Pvt. Ltd. – Full Stack E-Commerce Platform

<p align="center">

Production-ready B2B/B2C E-Commerce Platform built using the MERN ecosystem with PostgreSQL, Razorpay, PDF Invoice Generation, Email Automation, WhatsApp Notifications and an Advanced Admin Dashboard.

</p>

<p align="center">

![React](https://img.shields.io/badge/React-18-blue?logo=react)
![Node](https://img.shields.io/badge/Node.js-Express-green?logo=node.js)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-Prisma-blue?logo=postgresql)
![Tailwind](https://img.shields.io/badge/TailwindCSS-3-38BDF8?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-success)

</p>

---

# 🚀 Overview

PMS Packaging Pvt. Ltd. is a production-grade Full Stack E-Commerce Platform developed for both **B2B and B2C customers**.

The platform allows customers to browse products, place orders, complete online payments, receive PDF invoices automatically, while administrators manage products, orders, customers, inventory and coupons through a secure dashboard.

---

# ✨ Key Features

## 🛍 Customer Features

- User Authentication
- Product Catalog
- Categories
- Product Search
- Product Filters
- Product Details
- Wishlist
- Add to Cart
- Buy Now
- Checkout
- Shipping Address
- Razorpay Payments
- Cash on Delivery
- Order Tracking
- Order History
- Customer Profile
- Password Reset
- Responsive Design

---

## ⚙ Admin Features

- Admin Dashboard
- Product Management
- Category Management
- Customer Management
- Order Management
- Coupon Management
- Inventory Management
- Sales Analytics
- Activity Logs

---

## 🤖 Automation Features

✔ Automatic Order Processing

✔ Inventory Updates

✔ Invoice PDF Generation

✔ QR Code Invoice

✔ Customer Email

✔ Owner Email

✔ WhatsApp Notification

✔ Payment Verification

✔ Activity Logging

---

# 🛒 Order Workflow

```text
Customer
      │
      ▼
Browse Products
      │
      ▼
Add to Cart / Buy Now
      │
      ▼
Checkout
      │
      ▼
Shipping Address
      │
      ▼
Payment
      │
 ┌────┴────┐
 │         │
 ▼         ▼
COD     Razorpay
 │         │
 └────┬────┘
      ▼
Create Order
      ▼
Reduce Stock
      ▼
Generate Invoice PDF
      ▼
Send Customer Email
      ▼
Send Owner Email
      ▼
Send WhatsApp Alert
      ▼
Update Admin Dashboard
      ▼
Order Completed
```

---

# 🏗 Tech Stack

## Frontend

- React.js
- Tailwind CSS
- React Router
- Axios
- Context API

---

## Backend

- Node.js
- Express.js
- Prisma ORM
- JWT Authentication
- Multer
- Express Validator

---

## Database

- PostgreSQL (Neon)

---

## Third Party Services

- Razorpay
- Nodemailer
- Twilio WhatsApp
- QRCode
- PDFKit

---

# 📂 Project Structure

```
pms-packaging
│
├── backend
│   ├── prisma
│   ├── config
│   ├── controllers
│   ├── middleware
│   ├── routes
│   ├── services
│   ├── utils
│   ├── uploads
│   ├── app.js
│   └── server.js
│
├── frontend
│   ├── components
│   ├── pages
│   ├── context
│   ├── services
│   ├── App.jsx
│   └── main.jsx
│
└── README.md
```

---

# 🔒 Security Features

- JWT Authentication
- Refresh Tokens
- Role Based Authorization
- Helmet Security
- Rate Limiting
- Password Hashing (bcrypt)
- Express Validator
- Prisma ORM Protection
- CORS Protection
- Secure Error Handling

---

# ⚡ Installation

## Clone Repository

```bash
git clone https://github.com/hardik1106596/pms-packaging.git

cd pms-packaging
```

---

## Backend

```bash
cd backend

npm install

cp .env.example .env

npx prisma generate

npx prisma migrate dev

npm run seed

npm run dev
```

Backend

```
http://localhost:5000
```

---

## Frontend

```bash
cd frontend

npm install

cp .env.example .env

npm run dev
```

Frontend

```
http://localhost:5173
```

---

# 🔑 Environment Variables

## Backend

```env
DATABASE_URL=

JWT_ACCESS_SECRET=

JWT_REFRESH_SECRET=

RAZORPAY_KEY_ID=

RAZORPAY_KEY_SECRET=

SMTP_HOST=

SMTP_PORT=

SMTP_USER=

SMTP_PASS=

TWILIO_ACCOUNT_SID=

TWILIO_AUTH_TOKEN=

TWILIO_WHATSAPP_FROM=
```

---

# 👤 Demo Accounts

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

# 🌐 Deployment

## Frontend

Vercel

---

## Backend

Render

---

## Database

Neon PostgreSQL

---

# 📸 Screenshots

```
Home Page

Product Listing

Product Details

Cart

Checkout

Payment

Admin Dashboard

Orders

Products

Customers
```

(Add screenshots here)

---

# 🚀 Future Improvements

- AI Product Recommendation
- GST Invoice
- Sales Dashboard
- Multi Vendor Support
- Reviews & Ratings
- Delivery Tracking
- Analytics Dashboard
- Mobile App

---

# 👨‍💻 Developer

**Hardik Sagadhara**

B.Tech Information Technology

Full Stack Developer

GitHub:
https://github.com/hardik1106596

LinkedIn:
https://linkedin.com/in/sagadhara-hardik-443292331

Email:
hardiksagadhara@gmail.com

---

# ⭐ Support

If you found this project useful,

⭐ Star the repository

🍴 Fork the project

📢 Share it with others

---

<p align="center">

Made with ❤️ by Hardik Sagadhara

</p>
