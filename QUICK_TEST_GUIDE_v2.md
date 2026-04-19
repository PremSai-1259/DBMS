# Quick Start - Testing New Features

## What's New in This Update

### For Patients
1. ✅ **Revoke Access** - Remove doctor access to your reports
2. ✅ **Better Request Management** - Pending/Approved/Rejected sections clearly separated
3. ✅ **View Doctor Profiles** - Click "View Profile" to see doctor info and appointment history

### For Doctors  
1. ✅ **Access Reports Tab** - NEW section in Doctor Dashboard
2. ✅ **Search Accessible Reports** - Find reports by patient name or report name
3. ✅ **Access Statistics** - See total, active, and expiring soon counts

---

## How to Test Locally

### Prerequisites
```
✅ Backend running: npm start (in backend folder)
✅ Frontend running: npm run dev (in frontend folder)
✅ MySQL connected
✅ Test accounts ready
```

### Test as Patient

**1. Login and Find Medical Requests**
```
1. Go to http://localhost:5173
2. Login with patient account
3. Navigate to "Patient Dashboard"
4. Click "Profile" tab
5. Scroll down to "Medical Report Requests" section
```

**Expected Result**:
- Section title: "Medical Report Requests"
- Three subsections: Pending (yellow), Approved (green), Rejected (red)
- Display counts for each section

---

**2. Approve a Request**
```
1. Find a pending request in the Pending section
2. Click "✓ Approve" button
3. Wait for success toast
4. Observe request move to Approved section
```

**Expected Result**:
- Green success toast: "Request approved"
- Request disappears from Pending
- Same request now in Approved section
- Shows "Approved [date]"

---

**3. View Doctor Profile**
```
1. In any request (Pending/Approved/Rejected), click "View Profile"
2. Wait for modal to load
3. Review doctor information
4. Check appointment history
```

**Expected Result**:
- Modal overlay with blur background
- Doctor name, specialization, experience, hospital
- "✓ Verified" or "Pending" status
- Two appointment sections: "Upcoming" and "Past Appointments"
- Each appointment shows date, time, slot number, status

---

**4. Revoke Access**
```
1. Go to "Approved" section
2. Find approved request
3. Click "Revoke" button
4. Confirm in dialog
5. Wait for success toast
```

**Expected Result**:
- Confirmation dialog appears: "Are you sure you want to revoke access?"
- After confirmation, green toast: "Access revoked successfully"
- Request disappears from Approved section

---

### Test as Doctor

**1. Open Access Reports**
```
1. Login with doctor account
2. Go to Doctor Dashboard
3. Click "Access Reports" tab (middle tab)
```

**Expected Result**:
- Page title: "Medical Report Access"
- Subtitle: "View and manage patient medical reports..."
- Search bar at top
- List of accessible reports (if any)

---

**2. Search Reports**
```
1. In Access Reports tab, use search box
2. Type patient name (e.g., "John")
3. View filtered results
4. Clear and search by report name
```

**Expected Result**:
- Results filter in real-time
- Shows "Found X reports"
- Can search by patient name or report name

---

**3. View Report Details**
```
1. In Access Reports tab
2. See report cards showing:
   - Report name
   - Patient name
   - Approval date
   - Expiration date (if set)
3. Check statistics at bottom
```

**Expected Result**:
- Patient names displayed with 👤 icon
- Approval dates shown
- Expiration dates shown in red if present
- Stats show: Total, Active, Expiring soon

---

## Common Issues & Solutions

### Issue: Doctor Profile Modal Not Opening
**Solution**:
1. Check browser console for errors
2. Verify backend is running on port 5000
3. Check network tab in DevTools for failed requests
4. Ensure patient has appointment with doctor

### Issue: Revoke Button Not Working
**Solution**:
1. Clear browser cache
2. Restart frontend dev server
3. Check if backend endpoint `/access/revoke/:requestId` exists
4. Look for error message in toast

### Issue: No Reports Showing in Doctor View
**Solution**:
1. Verify at least one request is approved
2. Ensure logged in as correct doctor
3. Check if reports are in "approved" status
4. Refresh page (F5)

### Issue: Search Not Working
**Solution**:
1. Clear search box
2. Retype slowly to see results
3. Check exact spelling of patient/report name
4. Look for special characters

---

## Testing Tips

✅ **Use DevTools** to check for JavaScript errors  
✅ **Check Network tab** to see API requests/responses  
✅ **Use console.log** to debug state values  
✅ **Test on mobile** by resizing browser window  
✅ **Test data persistence** by refreshing page (F5)  

---

## File Changes Summary

**New Components**:
- `frontend/src/components/DoctorAccessReports.jsx` - 450+ lines

**Modified Components**:
- `frontend/src/components/MedicalRequests.jsx` - Added handleRevoke
- `frontend/src/pages/DoctorDashboard.jsx` - Added Access Reports tab

**Backend** (No changes needed):
- Already has all required endpoints
- Routes correctly ordered
- Controllers working

---

## Performance Baseline

**Expected Load Times**:
```
- Access Reports tab open: < 1 second
- Search filter: Instant (client-side)
- Modal open: < 1 second
- Approve/Revoke: < 2 seconds
- Page refresh: < 3 seconds
```

---

## Troubleshooting Checklist

- [ ] Backend console shows no errors
- [ ] Frontend console shows no errors
- [ ] Network requests return 200 status
- [ ] API responses have correct data
- [ ] Component renders without crashing
- [ ] All buttons are clickable
- [ ] Toasts appear for all actions
- [ ] Data persists on refresh
- [ ] Search filters work correctly
- [ ] Modal opens and closes properly

---

## Next Steps After Testing

1. ✅ All features working → Go to production
2. ❌ Issues found → Check error messages → Fix bugs
3. ⚠️ Performance slow → Check network tab → Optimize

---

## Support Resources

- **FEATURE_COMPLETE_v2.md** - Complete feature documentation
- **TESTING_GUIDE_MEDICAL_REQUESTS.md** - 22 test scenarios  
- **MEDICAL_REQUESTS_QUICK_START.md** - Quick reference
- **SYSTEM_ARCHITECTURE_DATA_FLOW.md** - Architecture details

---

**Happy Testing!** 🚀

All features are ready for manual testing. Use this guide to verify everything works correctly before deployment.
