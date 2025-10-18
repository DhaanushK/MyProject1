# Environment Setup Guide

## 🔧 Initial Setup

### 1. Backend Environment Configuration

1. Navigate to the `finalyear-backend` directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` with your actual values:

```bash
# Server Configuration
PORT=5001
NODE_ENV=development

# Database Configuration
MONGO_URI=mongodb://localhost:27017/your_database_name

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-here

# Google Sheets Configuration
GOOGLE_SPREADSHEET_ID=your-google-spreadsheet-id
GOOGLE_PROJECT_ID=your-google-project-id
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----"

# Email Configuration (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Frontend URL (for CORS)
FRONTEND_URL=http://localhost:5173
```

### 2. Frontend Environment Configuration

1. Navigate to the `finalyear-frontend` directory
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Edit `.env` with your actual values:

```bash
# Frontend Configuration
VITE_API_URL=http://localhost:5001
VITE_GOOGLE_SPREADSHEET_ID=your-google-spreadsheet-id
```

## 🔐 Security Notes

- **Never commit `.env` files to Git**
- **Always use environment variables for sensitive data**
- **Keep your Google service account credentials secure**
- **Rotate keys and secrets regularly**

## 🚀 Running the Application

### Backend:
```bash
cd finalyear-backend
npm install
npm start
```

### Frontend:
```bash
cd finalyear-frontend
npm install
npm run dev
```

## 📋 Required Environment Variables

### Backend (.env):
- `JWT_SECRET` - For JWT token signing
- `MONGO_URI` - MongoDB connection string
- `GOOGLE_SPREADSHEET_ID` - Your Google Sheets ID
- `GOOGLE_PROJECT_ID` - Google Cloud project ID
- `GOOGLE_SERVICE_ACCOUNT_EMAIL` - Service account email
- `GOOGLE_PRIVATE_KEY` - Service account private key

### Frontend (.env):
- `VITE_GOOGLE_SPREADSHEET_ID` - Same as backend spreadsheet ID
- `VITE_API_URL` - Backend server URL (usually http://localhost:5001)