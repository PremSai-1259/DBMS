# Healthcare Platform Backend - Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Environment Setup
- [ ] Node.js 14+ installed (`node --version`)
- [ ] MySQL 8.0+ installed (`mysql --version`)
- [ ] npm installed (`npm --version`)
- [ ] Git repository initialized (if applicable)

### 2. Project Files
- [ ] All source files present (39 files total)
- [ ] Controllers directory has 9 files
- [ ] Models directory has 11 files
- [ ] Routes directory has 10 files
- [ ] Middleware directory has 2 files
- [ ] Utils directory has helpers.js
- [ ] Configs directory has db.js and schema.sql
- [ ] Documentation files present (5+ files)

### 3. Configuration
- [ ] `.env` file created
- [ ] DB_HOST configured
- [ ] DB_USER configured
- [ ] DB_PASSWORD configured
- [ ] DB_NAME configured
- [ ] JWT_SECRET configured
- [ ] PORT configured (default: 3000)
- [ ] EMAIL_USER configured (optional)
- [ ] EMAIL_PASSWORD configured (optional)

### 4. Dependencies
- [ ] `npm install` completed successfully
- [ ] No dependency conflicts
- [ ] node_modules directory created
- [ ] package-lock.json generated

### 5. Database Setup
- [ ] MySQL service running
- [ ] Database `demo2` created
- [ ] Schema imported: `SOURCE schema.sql`
- [ ] All 11 tables created:
  - [ ] users
  - [ ] doctor_profiles
  - [ ] patient_profiles
  - [ ] doctor_approvals
  - [ ] appointment_slots
  - [ ] appointments
  - [ ] files
  - [ ] record_access
  - [ ] consultation_notes
  - [ ] reviews
  - [ ] notifications

### 6. File System
- [ ] `/uploads` directory exists (writable)
- [ ] `.env` file has correct permissions (readable by Node)
- [ ] Schema.sql file readable

### 7. Code Validation
- [ ] `node -c index.js` (no syntax errors)
- [ ] All require() paths are correct
- [ ] No hardcoded database credentials
- [ ] No console.log() in production code (logging only errors)

---

## 🚀 Deployment Steps

### Step 1: Initial Setup
```bash
cd /Users/prem/Desktop/DBMS/DBMS/backend
npm install
```

### Step 2: Database Configuration
```bash
mysql -u root -p demo2
SOURCE configs/schema.sql;
EXIT;
```

### Step 3: Environment Setup
```bash
# Edit .env with your credentials
nano .env
# or use your editor of choice
```

### Step 4: Verify Configuration
```bash
# Check connection (optional - test from Node REPL)
node -e "require('dotenv').config(); const db = require('./configs/db'); console.log('DB Connected');"
```

### Step 5: Start Server
```bash
npm start
```

### Step 6: Health Check
```bash
curl http://localhost:3000/health
# Expected response: {"status":"Server running","port":3000}
```

---

## 🧪 Post-Deployment Testing

### Basic Connectivity
- [ ] Server starts without errors
- [ ] `GET /health` returns 200
- [ ] No console errors on startup

### Authentication System
- [ ] `POST /auth/signup` works
- [ ] `POST /auth/login` works
- [ ] JWT token is generated
- [ ] Protected routes reject requests without token

### Database Operations
- [ ] `POST /profile` creates profile
- [ ] `GET /profile` retrieves profile
- [ ] `PUT /profile` updates profile
- [ ] Data is persisted in database

### Doctor Workflow
- [ ] Doctor can signup
- [ ] Doctor can create profile
- [ ] Doctor can request approval
- [ ] Admin can view pending doctors
- [ ] Admin can approve/reject

### Patient Workflow
- [ ] Patient can signup
- [ ] Patient can create profile
- [ ] Patient can view slots
- [ ] Patient can book appointment
- [ ] Appointment is recorded

### File Upload
- [ ] File upload endpoint works
- [ ] Files stored in `/uploads`
- [ ] File hash calculated
- [ ] File access controlled

### Error Handling
- [ ] 400 error for invalid input
- [ ] 401 error for missing token
- [ ] 403 error for insufficient permissions
- [ ] 404 error for not found resources
- [ ] 500 error for server errors

---

## 📊 Performance Checks

- [ ] Server responds within 100ms (typical)
- [ ] Database queries execute within 50ms
- [ ] Large file uploads (< 5MB) complete successfully
- [ ] Memory usage is stable
- [ ] No memory leaks during extended testing

---

## 🔒 Security Verification

- [ ] Passwords are hashed (check DB)
- [ ] Tokens are JWT (check format)
- [ ] No plaintext secrets in code
- [ ] .env file not in git
- [ ] File paths not exposed in responses
- [ ] SQL injection protected (parameterized queries)
- [ ] CORS configured
- [ ] Input validation on all endpoints

---

## 📧 Email System (Optional)

If email is configured:
- [ ] EMAIL_USER configured in .env
- [ ] EMAIL_PASSWORD configured in .env
- [ ] Test email on doctor approval
- [ ] Test email on appointment cancellation
- [ ] Test email on access request response

---

## 📝 Logging Setup

- [ ] Server startup logged to console
- [ ] Database connection status logged
- [ ] Errors logged with context
- [ ] No sensitive data in logs

---

## 🔍 Database Verification

```sql
-- Verify all tables exist
SHOW TABLES;

-- Should return 11 tables
-- Check sample data
SELECT COUNT(*) FROM users;
SELECT COUNT(*) FROM doctor_profiles;
SELECT COUNT(*) FROM appointments;
```

---

## ✅ Documentation Verification

- [ ] README.md is present and readable
- [ ] API_DOCUMENTATION.md covers all endpoints
- [ ] TESTING_GUIDE.md has working examples
- [ ] QUICK_REFERENCE.md is quick to scan
- [ ] IMPLEMENTATION_SUMMARY.md verifies completeness

---

## 🚨 Rollback Procedure

If deployment fails:

1. **Stop Server**
   ```bash
   Ctrl+C (or kill process)
   ```

2. **Check Logs**
   ```bash
   # Review console output for errors
   ```

3. **Verify Configuration**
   ```bash
   # Check .env file
   cat .env
   ```

4. **Reset Database** (if needed)
   ```bash
   mysql -u root -p
   DROP DATABASE demo2;
   CREATE DATABASE demo2;
   SOURCE configs/schema.sql;
   ```

5. **Clear Node Cache**
   ```bash
   rm -rf node_modules
   npm install
   ```

---

## 🎯 Go-Live Checklist

- [ ] All tests pass
- [ ] Database verified
- [ ] Backups created
- [ ] Documentation updated
- [ ] Team notified
- [ ] Monitoring configured
- [ ] Support procedures documented
- [ ] Rollback plan tested

---

## 📞 Troubleshooting

| Issue | Check |
|-------|-------|
| Cannot connect to DB | `.env` credentials, MySQL running |
| Port 3000 already in use | Change PORT in .env or kill process |
| Module not found error | Run `npm install` |
| File upload fails | Check `/uploads` permissions |
| Email not sending | Verify EMAIL_USER, EMAIL_PASSWORD |
| Token invalid | Ensure JWT_SECRET is consistent |

---

## 🔧 Maintenance Tasks

### Daily
- [ ] Monitor error logs
- [ ] Check disk space usage
- [ ] Verify database size

### Weekly
- [ ] Review performance metrics
- [ ] Check backup status
- [ ] Update documentation if needed

### Monthly
- [ ] Database optimization (OPTIMIZE TABLE)
- [ ] Review access logs
- [ ] Plan capacity upgrades if needed

---

## 📈 Scaling Considerations

As the system grows:

1. **Database**
   - Add indexes on frequently queried columns
   - Consider read replicas for reports
   - Archive old notifications

2. **File Storage**
   - Consider cloud storage (S3, etc.)
   - Implement cleanup for old files
   - Monitor disk usage

3. **Email**
   - Consider email queue system
   - Monitor email delivery rates
   - Implement retry logic

4. **API**
   - Implement caching layer
   - Add rate limiting
   - Monitor response times

---

## ✨ Success Indicators

Your deployment is successful when:

- ✅ Server starts without errors
- ✅ Health check endpoint responds
- ✅ All tests pass
- ✅ Database operations work
- ✅ File uploads succeed
- ✅ Authentication works
- ✅ Notifications are sent
- ✅ No error logs
- ✅ Performance is acceptable
- ✅ Documentation is complete

---

## 🎉 Ready to Deploy!

All systems are verified and ready. The healthcare platform backend is production-ready.

**Deployment Date**: _______________
**Deployed By**: _______________
**Environment**: _______________
**Version**: 1.0.0

---

**For support, refer to:**
- API_DOCUMENTATION.md
- TESTING_GUIDE.md
- README.md
