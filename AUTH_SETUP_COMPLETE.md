# Authentication Setup Complete ✅

## What Was Fixed

### 1. Added JWT_SECRET to .env
```env
JWT_SECRET=profitFirst
```

### 2. Created Authentication Routes
**File**: `routes/authRoutes.js`

Endpoints created:
- `POST /api/auth/signup` - Register new user
- `POST /api/auth/google-signup` - Register with Google OAuth
- `POST /api/auth/login` - Login with email/password
- `GET /api/auth/users/:id` - Get user information
- `GET /api/auth/verify-email/:token` - Email verification (placeholder)

### 3. Updated User Model
**File**: `models/User.js`

Added fields:
- `firstName` - User's first name
- `lastName` - User's last name
- `password` - Hashed password
- `googleAuth` - Boolean flag for Google OAuth users
- `isAdmin` - Admin flag

Made optional:
- `shopifyStore` - Not required for initial signup
- `shopifyAccessToken` - Not required for initial signup

### 4. Registered Auth Routes
**File**: `server.js`

Added:
```javascript
app.use('/api/auth', require('./routes/authRoutes'));
```

### 5. Installed Dependencies
```bash
npm install bcryptjs jsonwebtoken
```

## Existing Users

Your database already has 2 users with hashed passwords:

1. **Tanesh Purohit**
   - Email: taneshpurohit09@gmail.com
   - User ID: 68c812b0afc4892c1f8128e3
   - Password: Already hashed (bcrypt)

2. **Anurag Dutta**
   - Email: duttanurag321@gmail.com
   - User ID: 6882270af4c676a67f2fb70d
   - Password: Already hashed (bcrypt)

## How to Test

### 1. Start Backend Server
```bash
npm start
```

Expected output:
```
Server running on port 6000
MongoDB Connected: localhost
```

### 2. Test Login (Manual)

Using curl:
```bash
curl -X POST http://localhost:6000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"taneshpurohit09@gmail.com","password":"YOUR_PASSWORD"}'
```

Using Postman:
- Method: POST
- URL: http://localhost:6000/api/auth/login
- Body (JSON):
```json
{
  "email": "taneshpurohit09@gmail.com",
  "password": "YOUR_PASSWORD"
}
```

### 3. Test Signup

```bash
curl -X POST http://localhost:6000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com",
    "password": "test123"
  }'
```

### 4. Run Automated Tests
```bash
node test-login.js
```

## Frontend Integration

The frontend is already configured to use these endpoints:

### Login Flow
1. User enters email/password
2. Frontend calls `POST /api/auth/login`
3. Backend validates credentials
4. Returns JWT token and userId
5. Frontend stores in localStorage
6. Redirects to onboarding/dashboard

### Signup Flow
1. User fills signup form
2. Frontend calls `POST /api/auth/signup`
3. Backend creates user with hashed password
4. Returns success message
5. Frontend redirects to login

### Google OAuth Flow
1. User clicks "Sign up with Google"
2. Google OAuth popup
3. Frontend gets user info from Google
4. Frontend calls `POST /api/auth/google-signup`
5. Backend creates user without password
6. Frontend redirects to login

## Authentication Flow

```
User Login
    ↓
Frontend (Login.jsx)
    ↓ POST /api/auth/login
Backend (authRoutes.js)
    ↓ Query MongoDB
Find User
    ↓ bcrypt.compare()
Verify Password
    ↓ jwt.sign()
Generate Token
    ↓
Return { token, userId }
    ↓
Frontend stores in localStorage
    ↓
Redirect to Dashboard
```

## Security Features

✅ **Password Hashing**: bcrypt with salt rounds (10)
✅ **JWT Tokens**: 7-day expiration
✅ **Password Validation**: Checked before login
✅ **Duplicate Email Check**: Prevents duplicate signups
✅ **Secure Password Storage**: Never returned in API responses

## Common Issues & Solutions

### Issue 1: "Invalid email or password"
**Cause**: Wrong credentials or user doesn't exist
**Solution**: 
- Verify email is correct
- Check if user exists in database
- Ensure password is correct

### Issue 2: "User already exists"
**Cause**: Email already registered
**Solution**: Use login instead of signup

### Issue 3: "Please login with Google"
**Cause**: User signed up with Google OAuth
**Solution**: Use Google login button

### Issue 4: Token expired
**Cause**: JWT token older than 7 days
**Solution**: Login again to get new token

## Testing Checklist

- [ ] Backend server starts successfully
- [ ] Can signup new user
- [ ] Can login with existing user
- [ ] JWT token is generated
- [ ] Token is stored in localStorage
- [ ] Can get user info with token
- [ ] Wrong password is rejected
- [ ] Duplicate email is rejected
- [ ] Google signup works
- [ ] Frontend redirects after login

## Next Steps

1. **Test Login**: Try logging in with existing users
2. **Test Signup**: Create a new test account
3. **Frontend Testing**: Open frontend and test login/signup UI
4. **Password Reset**: Implement forgot password functionality (optional)
5. **Email Verification**: Implement email verification (optional)

## API Response Examples

### Successful Login
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "userId": "68c812b0afc4892c1f8128e3"
}
```

### Failed Login
```json
{
  "success": false,
  "message": "Invalid email or password"
}
```

### Successful Signup
```json
{
  "success": true,
  "message": "Signup successful! You can now login.",
  "userId": "68c812b0afc4892c1f8128e3"
}
```

### Get User Info
```json
{
  "success": true,
  "data": {
    "_id": "68c812b0afc4892c1f8128e3",
    "firstName": "Tanesh",
    "lastName": "Purohit",
    "email": "taneshpurohit09@gmail.com",
    "isActive": true,
    "createdAt": "2024-01-15T10:30:00.000Z"
  },
  "isAdmin": false
}
```

## Environment Variables

Make sure your `.env` has:
```env
PORT=6000
MONGODB_URI=mongodb://localhost:27017/profitfirstuser
JWT_SECRET=profitFirst
NODE_ENV=production
```

## Files Modified/Created

### Created:
1. `routes/authRoutes.js` - Authentication endpoints
2. `test-login.js` - Test script
3. `AUTH_SETUP_COMPLETE.md` - This documentation

### Modified:
1. `.env` - Added JWT_SECRET
2. `models/User.js` - Added auth fields
3. `server.js` - Registered auth routes
4. `client/vite.config.js` - Fixed proxy port

## Support

If login still doesn't work:
1. Check backend console for errors
2. Check browser console for errors
3. Verify MongoDB is running
4. Verify backend is on port 6000
5. Check if user exists in database
6. Verify password is correct

## Password Information

⚠️ **Important**: I don't know the passwords for existing users. They are hashed in the database. 

To test login:
1. Either know the original password
2. Or create a new test user with known password
3. Or reset password in database (see below)

### Reset Password for Testing

If you need to reset a user's password to "test123":

```bash
node -e "
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/profitfirstuser')
  .then(async () => {
    const User = require('./models/User');
    const hashedPassword = await bcrypt.hash('test123', 10);
    await User.updateOne(
      { email: 'taneshpurohit09@gmail.com' },
      { password: hashedPassword }
    );
    console.log('Password reset to: test123');
    process.exit(0);
  });
"
```

## Status

✅ Authentication routes created
✅ User model updated
✅ JWT secret configured
✅ Dependencies installed
✅ Routes registered in server
✅ Frontend already configured
✅ Existing users compatible

🎯 **Ready to test!** Start the backend and try logging in.
