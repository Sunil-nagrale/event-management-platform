# EventHub - Event Management Platform

A production-ready full-stack event management platform built with Node.js, Express, MongoDB, and EJS. Features role-based access control, event booking, Razorpay payments, email notifications, and comprehensive admin/organizer dashboards.

## Features

- **Authentication**: Signup, login, logout, password reset with Passport.js
- **Roles**: Admin, Organizer, Attendee with protected routes
- **Events**: CRUD, categories, search, filtering, image upload (Cloudinary)
- **Bookings**: Register, cancel, capacity validation, ticket generation
- **Payments**: Razorpay integration with success/failure flows
- **Email**: Welcome, registration, ticket, and password reset emails (Nodemailer)
- **Dashboards**: Admin analytics, organizer revenue, user profile & history
- **UI**: Bootstrap 5, responsive design, dark mode, pagination, flash messages

## Tech Stack

| Layer | Technology |
|-------|------------|
| Runtime | Node.js 18+ |
| Framework | Express.js |
| Database | MongoDB Atlas + Mongoose |
| Views | EJS + Bootstrap 5 |
| Auth | Passport.js + express-session |
| Payments | Razorpay |
| Images | Cloudinary |
| Email | Nodemailer |
| Deployment | Render |

## Project Structure

```
├── config/          # Database, Passport, Cloudinary, Razorpay
├── controllers/     # Route handlers (MVC)
├── middleware/      # Auth, validation, upload, error handling
├── models/          # User, Event, Booking, Payment schemas
├── routes/          # RESTful route definitions
├── views/           # EJS templates
├── public/          # CSS, JS assets
├── utils/           # Email, helpers
├── seeds/           # Database seed script
├── app.js           # Express app configuration
└── server.js        # Entry point
```

## Prerequisites

- Node.js 18 or higher
- MongoDB Atlas account (or local MongoDB)
- Cloudinary account (optional, for image uploads)
- Razorpay account (optional, for payments)
- Gmail or SMTP credentials (optional, for emails)

## Local Setup

### 1. Clone and install

```bash
git clone <your-repo-url>
cd event-management-platform
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
NODE_ENV=development
PORT=3000
SESSION_SECRET=your-random-secret-key

MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/event-platform

CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret

EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your@gmail.com
EMAIL_PASS=your-app-password
EMAIL_FROM=EventHub <your@gmail.com>

APP_URL=http://localhost:3000
```

### 3. Seed the database

```bash
npm run seed
```

This creates:
- Admin, organizer, and attendee test accounts
- 30 sample events (technology, cultural, workshops, concerts, hackathons)

**Test credentials after seeding:**

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@eventhub.com | admin123 |
| Organizer | priya@organizer.com | organizer123 |
| Attendee | attendee@eventhub.com | attendee123 |

### 4. Start the server

```bash
# Development (with auto-reload)
npm run dev

# Production
npm start
```

Visit **http://localhost:3000**

## MongoDB Atlas Setup

1. Create a free cluster at [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Create a database user with read/write permissions
3. Whitelist your IP (or `0.0.0.0/0` for development)
4. Copy the connection string and set `MONGODB_URI` in `.env`
5. Replace `<password>` with your database user password

## API Routes

| Method | Route | Description |
|--------|-------|-------------|
| GET | `/` | Home page |
| GET | `/events` | Browse/search events |
| GET | `/events/:id` | Event details |
| POST | `/events` | Create event (organizer) |
| GET | `/auth/login` | Login page |
| POST | `/auth/register` | Register user |
| POST | `/bookings/events/:eventId` | Register for free event |
| POST | `/payments/create-order/:eventId` | Create Razorpay order |
| GET | `/admin` | Admin dashboard |
| GET | `/organizer` | Organizer dashboard |
| GET | `/user` | User dashboard |
| GET | `/health` | Health check endpoint |

## Deploy on Render

### Option A: Using render.yaml (Blueprint)

1. Push code to GitHub
2. In Render Dashboard → **New** → **Blueprint**
3. Connect your repository — Render reads `render.yaml` automatically
4. Set environment variables in the Render dashboard

### Option B: Manual Web Service

1. Push code to GitHub
2. Render Dashboard → **New** → **Web Service**
3. Connect repository
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment**: Node
5. Add environment variables from `.env.example`
6. Set `NODE_ENV=production` and `APP_URL=https://your-app.onrender.com`

### Post-deployment

```bash
# Run seed on Render shell (one time)
npm run seed
```

Or connect via Render Shell from the dashboard.

### Render Environment Variables

Set these in the Render dashboard:

- `MONGODB_URI` — MongoDB Atlas connection string
- `SESSION_SECRET` — Random secure string
- `CLOUDINARY_*` — Cloudinary credentials
- `RAZORPAY_*` — Razorpay test/live keys
- `EMAIL_*` — SMTP credentials
- `APP_URL` — Your Render URL (e.g. `https://eventhub.onrender.com`)
- `NODE_ENV` — `production`

## Optional Integrations

### Cloudinary (Image Uploads)

Without Cloudinary configured, events can still be created — images just won't upload. Seed data uses placeholder images.

### Razorpay (Payments)

Use test keys from [Razorpay Dashboard](https://dashboard.razorpay.com). Test card: `4111 1111 1111 1111`.

### Nodemailer (Emails)

Without email configured, messages are logged to the console in development.

## License

MIT
