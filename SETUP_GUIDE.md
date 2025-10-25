# RD & Company CRM - Complete Setup Guide

This guide will help you set up both the React frontend and PHP backend for the RD & Company CRM system.

## Prerequisites

- Node.js (v14 or higher)
- PHP (v7.4 or higher)
- MySQL (v5.7 or higher)
- Web server (Apache/Nginx) or XAMPP/WAMP

## Backend Setup (PHP + MySQL)

### 1. Database Setup
1. Start your MySQL server
2. Run the setup script:
   ```bash
   cd php-backend
   php setup.php
   ```
   This will:
   - Create the database `rd_company_crm`
   - Create the users table
   - Insert sample users with password `password123`

### 2. Web Server Setup
1. Copy the `php-backend` folder to your web server directory:
   - **XAMPP**: `C:\xampp\htdocs\php-backend`
   - **WAMP**: `C:\wamp64\www\php-backend`
   - **Apache**: `/var/www/html/php-backend`

2. Start your web server (Apache/Nginx)

3. Test the API by visiting:
   - `http://localhost/php-backend/api/verify.php` (should return authentication error)

### 3. Sample Users
The setup creates these users (password: `password123`):
- `admin@rdcompany.com` - Admin role
- `manager@rdcompany.com` - Manager role  
- `sales@rdcompany.com` - Sales role
- `office@rdcompany.com` - Office role
- `client@rdcompany.com` - Client role

## Frontend Setup (React)

### 1. Install Dependencies
```bash
cd material-dashboard-react
npm install
```

### 2. Configure API URL
Update `src/config/api.js` if your PHP backend is not at `http://localhost/php-backend`:
```javascript
export const API_CONFIG = {
  BASE_URL: "http://your-domain/php-backend", // Update this
  // ... rest of config
};
```

### 3. Start Development Server
```bash
npm start
```

The app will open at `http://localhost:3000`

## Testing the Integration

### 1. Test Login
1. Go to the login page
2. Try logging in with:
   - Email: `admin@rdcompany.com`
   - Password: `password123`
3. You should be redirected to the dashboard

### 2. Test Logout
1. Click the logout button in the navbar
2. You should be redirected back to the login page

### 3. Test Session Persistence
1. Login successfully
2. Refresh the page
3. You should remain logged in

## API Endpoints

### Login
- **URL**: `POST /api/login.php`
- **Body**: `{"email": "admin@rdcompany.com", "password": "password123"}`
- **Response**: User data and session creation

### Logout  
- **URL**: `POST /api/logout.php`
- **Response**: Session destruction confirmation

### Verify Session
- **URL**: `GET /api/verify.php`
- **Response**: Current user data if authenticated

## Troubleshooting

### Common Issues

1. **CORS Errors**
   - Make sure both frontend and backend are running
   - Check that API URLs are correct

2. **Database Connection Errors**
   - Verify MySQL is running
   - Check database credentials in `config/database.php`

3. **Session Issues**
   - Ensure PHP sessions are enabled
   - Check that cookies are being set

4. **API Not Found**
   - Verify the PHP backend is in the correct web server directory
   - Check that Apache/Nginx is serving PHP files

### Debug Steps

1. Check browser console for JavaScript errors
2. Check browser Network tab for failed API calls
3. Check PHP error logs
4. Test API endpoints directly with Postman/curl

## File Structure

```
project/
├── material-dashboard-react/     # React frontend
│   ├── src/
│   │   ├── config/api.js        # API configuration
│   │   └── contexts/AuthContext.js # Authentication logic
│   └── package.json
├── php-backend/                  # PHP backend
│   ├── api/                     # API endpoints
│   ├── config/                  # Database configuration
│   ├── models/                  # Data models
│   ├── database/                # Database schema
│   └── setup.php               # Setup script
└── SETUP_GUIDE.md              # This file
```

## Next Steps

Once authentication is working, you can:
1. Add more API endpoints for other features
2. Implement user management
3. Add more role-based permissions
4. Deploy to production servers

## Security Notes

For production deployment:
1. Change default passwords
2. Use HTTPS
3. Implement proper CORS policies
4. Add input validation and sanitization
5. Use environment variables for sensitive data
6. Implement rate limiting
