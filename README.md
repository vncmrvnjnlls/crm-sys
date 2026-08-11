# IntelliCRM — Customer Relationship Management System

A **Customer Relationship Management (CRM) System** built with the **MERN Stack (MongoDB, Express.js, React, Node.js)**.  
This system helps businesses manage customer interactions, track sales activities, and improve team collaboration.

The platform centralizes customer data and provides tools for managing **leads, customers, deals, tasks, and teams** — with real-time notifications and role-based access control.

---

## 🌐 Live Demo

- **Frontend:** https://intellicrm-system.vercel.app
- **Backend API:** https://intellicrm-api.up.railway.app

---

## 🧰 Tech Stack

**Frontend**

- React + Vite
- Tailwind CSS
- Socket.io Client
- Axios

**Backend**

- Node.js + Express.js
- MongoDB + Mongoose
- Socket.io
- JWT Authentication (Access + Refresh Tokens)
- Nodemailer (Gmail SMTP)

**Database**

- MongoDB Atlas

**Deployment**

- Frontend → Vercel
- Backend → Railway
- Database → MongoDB Atlas

---

## 👥 User Roles

| Role          | Access                                                              |
| ------------- | ------------------------------------------------------------------- |
| Admin         | Full access — users, teams, leads, customers, deals, tasks, reports |
| Sales Manager | Team overview, leads, customers, deals, tasks                       |
| Sales Agent   | Leads, customers, deals, tasks (team required)                      |
| Support Staff | Dashboard only                                                      |

---

## 🚀 Local Development Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vncmrvnjnlls/crm-sys.git
```

### 2. Backend Setup

```bash
cd backend_crm
npm install
```

Create a `.env` file inside `backend_crm`:

```env
PORT=5000
MONGO_URI=mongodb://localhost:27017/yourdbname
JWT_SECRET=your_random_secret_key
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
CLIENT_URL=http://localhost:5173
```

Run the backend:

```bash
# Development
npm run dev

# Production
npm start
```

### 3. Frontend Setup

```bash
cd frontend_crm
npm install
```

Create a `.env` file inside `frontend_crm`:

```env
VITE_API_URL=http://backend_IP:5000
```

Run the frontend:

```bash
npm run dev
```

### 4. Running the Full Application Locally

1. Make sure **MongoDB** is running locally
2. Start the backend — `cd backend_crm && npm run dev`
3. Start the frontend — `cd frontend_crm && npm run dev`
4. Open `http://localhost:5173`

---

## 🌍 Production Deployment

| Service  | Platform      | URL                                              |
| -------- | ------------- | ------------------------------------------------ |
| Frontend | Vercel        | https://intellicrm-system.vercel.app             |
| Backend  | Railway       | https://intellicrm-api.up.railway.app            |
| Database | MongoDB Atlas | —                                                |

**Backend environment variables (Railway):**

```env
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=your_secret
GMAIL_USER=yourgmail@gmail.com
GMAIL_APP_PASSWORD=xxxx xxxx xxxx xxxx
CLIENT_URL=https://intellicrm-system.vercel.app
NODE_ENV=production
```

**Frontend environment variables (Vercel):**

```env
VITE_API_URL=https://intellicrm-api.up.railway.app
```

---

## 📝 Notes

- Profile picture uploads are stored on the server filesystem — in production these are ephemeral on Railway and will reset on redeploy. A cloud storage solution (Cloudinary or S3) is recommended for persistent uploads.
- The refresh token is stored in an httpOnly cookie for security.
- Socket.io is used for real-time notifications and live updates.
