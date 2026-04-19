# Testing Guide - Medical Requests Feature

## Pre-Testing Checklist

- [ ] Backend server running (`npm start` in backend folder)
- [ ] Frontend dev server running (`npm run dev` in frontend folder)
- [ ] Database connected and migrations complete
- [ ] At least 2 user accounts created (1 patient, 1 doctor)
- [ ] Doctor profile is verified
- [ ] Patient profile is complete
- [ ] At least 1 appointment exists between patient and doctor

---

## Test Scenarios

### Test 1: Patient Name Display ✅
**Goal**: Verify patient name displays instead of "Patient"

**Steps**:
1. Login as patient
2. Navigate to Patient Dashboard
3. Check sidebar - left panel

**Expected**:
- [ ] Sidebar shows actual patient name (e.g., "John Smith")
- [ ] Greeting says "Hi, John" (first name only)
- [ ] Profile card header shows full name

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 2: Medical Requests Section Appears ✅
**Goal**: Verify medical requests section is visible

**Steps**:
1. Login as patient
2. Go to Patient Dashboard
3. Click "Profile" tab
4. Scroll down

**Expected**:
- [ ] "Medical Report Requests" section visible
- [ ] Section has description: "Manage requests from doctors..."
- [ ] Shows number of requests in badge

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 3: Pending Request Display ✅
**Goal**: Verify pending request shows with all details

**Prerequisites**:
- Doctor has requested access to patient's file

**Steps**:
1. Login as patient
2. Go to Profile tab
3. Check Medical Requests section

**Expected**:
- [ ] Pending section shows
- [ ] Doctor name displays: "Dr. [Name]"
- [ ] File name shows
- [ ] Date shows in format: "dd Mmm YYYY" (e.g., "15 Dec 2024")
- [ ] Buttons visible: [View Profile] [✓ Approve] [✗ Reject]
- [ ] Pending section has yellow indicator

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 4: Approve Request ✅
**Goal**: Verify approve functionality works

**Steps**:
1. In pending request, click [✓ Approve]
2. Wait for toast notification
3. Observe request status change

**Expected**:
- [ ] Toast shows: "Request approved" (Green)
- [ ] Request disappears from Pending
- [ ] Request appears in Approved section
- [ ] Approved section shows green indicator
- [ ] Doctor email field can be seen in console (logged)

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 5: Reject Request ✅
**Goal**: Verify reject functionality works

**Prerequisites**:
- Have another pending request

**Steps**:
1. In pending request, click [✗ Reject]
2. Wait for toast notification
3. Observe request status change

**Expected**:
- [ ] Toast shows: "Request rejected" (Green)
- [ ] Request disappears from Pending
- [ ] Request appears in Rejected section
- [ ] Rejected section shows red indicator

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 6: View Doctor Profile Modal ✅
**Goal**: Verify doctor profile modal opens and displays correctly

**Steps**:
1. In any request, click [View Profile]
2. Wait for modal to load
3. Check displayed information

**Expected - Header**:
- [ ] Modal title says "Doctor Profile"
- [ ] Close button (X) visible in top-right

**Expected - Doctor Info**:
- [ ] Doctor name displays: "Dr. [Name]"
- [ ] Email shows
- [ ] Specialization displays
- [ ] Experience shows: "X years"
- [ ] Hospital name shows
- [ ] Verification status shows: "✓ Verified" or "Pending"
- [ ] All info in cards with gray background

**Expected - Appointment History**:
- [ ] Heading: "Appointment History"
- [ ] If no appointments: Shows "No appointments yet"
- [ ] If appointments exist:
  - [ ] Upcoming section shows with upcoming appointments
  - [ ] Past section shows with past appointments
  - [ ] Each appointment shows:
    - Date in format "dd Mmm yyyy"
    - Time in format "HH:MM AM/PM"
    - Slot number
    - Status badge (confirmed/completed/cancelled)

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 7: Close Doctor Profile Modal ✅
**Goal**: Verify modal closes properly

**Steps**:
1. With modal open, click [X] button
2. Try clicking outside modal (on blur)

**Expected**:
- [ ] Clicking [X] closes modal
- [ ] Clicking outside closes modal
- [ ] Background blur disappears
- [ ] Returns to profile tab

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 8: Approved Requests Display ✅
**Goal**: Verify approved requests show in correct section

**Prerequisites**:
- Have approved at least 1 request

**Steps**:
1. Login as patient
2. Go to Profile tab
3. Check Approved section

**Expected**:
- [ ] Section title: "Approved (X)" showing count
- [ ] Green indicator dot
- [ ] Each card shows:
  - Doctor name
  - File name
  - "Approved [date]" info
  - Expiration date if set
  - [View Profile] and [Revoke] buttons
- [ ] Different styling from pending (green background)

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 9: Rejected Requests Display ✅
**Goal**: Verify rejected requests show in correct section

**Prerequisites**:
- Have rejected at least 1 request

**Steps**:
1. Login as patient
2. Go to Profile tab
3. Check Rejected section

**Expected**:
- [ ] Section title: "Rejected (X)" showing count
- [ ] Red indicator dot
- [ ] Each card shows:
  - Doctor name
  - File name
  - "Rejected [date]" info
  - [View Profile] button (no action buttons)
- [ ] Styled as read-only (lighter red background)

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 10: Empty State ✅
**Goal**: Verify empty state when no requests

**Prerequisites**:
- Patient with no medical requests

**Steps**:
1. Login as patient with no requests
2. Go to Profile tab

**Expected**:
- [ ] Medical Requests section shows
- [ ] Message: "No requests yet"
- [ ] Icon: 📁 (folder)
- [ ] Explanation: "Doctors can request access to your..."

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 11: Loading State ✅
**Goal**: Verify loading indicator works

**Steps**:
1. Add network throttling (DevTools)
2. Refresh profile tab
3. Watch for loading indicator

**Expected**:
- [ ] Spinner appears while loading
- [ ] Spinner stops after data loads
- [ ] Data displays correctly

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 12: Profile Data Accuracy ✅
**Goal**: Verify displayed data matches database

**Steps**:
1. Login as patient
2. Check profile details
3. Compare with database

**Expected**:
- [ ] Patient name matches users.name
- [ ] Email matches users.email
- [ ] Phone matches patient_profiles.phone
- [ ] Age matches patient_profiles.age
- [ ] Blood group matches patient_profiles.blood_group
- [ ] Gender matches patient_profiles.gender

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 13: Doctor Info Accuracy ✅
**Goal**: Verify doctor profile data is correct

**Steps**:
1. Click View Profile on any request
2. Compare info with database

**Expected**:
- [ ] Name matches users.name
- [ ] Email matches users.email
- [ ] Specialization matches doctor_profiles.specialization
- [ ] Experience matches doctor_profiles.experience
- [ ] Hospital matches doctor_profiles.hospital_name
- [ ] Address matches doctor_profiles.address
- [ ] Verification matches doctor_profiles.is_verified
- [ ] Rating matches doctor_profiles.average_rating

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 14: Appointment History Accuracy ✅
**Goal**: Verify appointment data is correct

**Steps**:
1. View doctor profile
2. Check appointment history
3. Verify against database

**Expected**:
- [ ] All appointments with this doctor show
- [ ] Dates match appointment_slots.slot_date
- [ ] Times match slot_start_time and slot_end_time
- [ ] Slot numbers correct
- [ ] Status matches appointments.status
- [ ] Upcoming appointments separated correctly
- [ ] Past appointments separated correctly

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 15: Responsive Design ✅
**Goal**: Verify UI works on different screen sizes

**Steps**:
1. Test on Mobile (375px)
2. Test on Tablet (768px)
3. Test on Desktop (1440px)

**Expected - Mobile**:
- [ ] Medical Requests section full width
- [ ] Cards stack vertically
- [ ] Buttons don't overlap
- [ ] Modal is readable
- [ ] All text visible without scrolling horizontally

**Expected - Tablet**:
- [ ] Profile details and upload side-by-side (2 cols)
- [ ] Medical requests full width
- [ ] Modal properly centered
- [ ] All controls easily clickable

**Expected - Desktop**:
- [ ] Optimal spacing maintained
- [ ] Multi-column layouts work
- [ ] Modal has good margins
- [ ] No horizontal scroll

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 16: Error Handling ✅
**Goal**: Verify error messages display correctly

**Steps**:
1. Go offline and try to load requests
2. Try invalid data scenarios
3. Check toast messages

**Expected**:
- [ ] Network error: Shows toast with error message
- [ ] Invalid request: Shows appropriate error
- [ ] Failed action: Shows "Failed to..." message
- [ ] Error doesn't crash the page

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 17: Button States ✅
**Goal**: Verify buttons disable during loading

**Steps**:
1. Start approving a request
2. Quickly observe button state
3. Let action complete

**Expected**:
- [ ] Button shows disabled state during action
- [ ] Button text doesn't change
- [ ] Button becomes enabled after action
- [ ] No duplicate submissions possible

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 18: Date Formatting ✅
**Goal**: Verify dates format correctly across the UI

**Steps**:
1. Check all dates in medical requests
2. Check dates in doctor profile modal
3. Verify consistency

**Expected**:
- [ ] All dates in format: "dd Mmm yyyy" (e.g., "15 Dec 2024")
- [ ] All times in 12-hour format: "HH:MM AM/PM"
- [ ] No timezone issues
- [ ] Consistent across all components

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 19: Role-Based Access ✅
**Goal**: Verify doctors can't see medical requests

**Steps**:
1. Login as doctor
2. Go to profile/dashboard
3. Check for medical requests section

**Expected**:
- [ ] Medical Requests section NOT visible for doctors
- [ ] No console errors
- [ ] Doctor profile tab works normally

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

### Test 20: Data Persistence ✅
**Goal**: Verify data persists across page reloads

**Steps**:
1. Approve a request
2. Refresh page (F5)
3. Check request status

**Expected**:
- [ ] Request still in Approved section
- [ ] Status persists correctly
- [ ] No data loss on refresh

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

**Notes**: _________________

---

## Performance Testing

### Test 21: Load Time
**Goal**: Verify acceptable performance

**Steps**:
1. Open DevTools Performance tab
2. Go to profile tab
3. Record time to interactive

**Expected**:
- [ ] Medical requests section loads within 2 seconds
- [ ] Modal opens within 1 second
- [ ] No janky animations

**Actual**: _________________ seconds

**Status**: ☐ Pass ☐ Fail

---

### Test 22: Large Dataset
**Goal**: Verify performance with many requests

**Prerequisites**:
- Create 50+ medical requests in database

**Steps**:
1. Login as patient
2. Go to profile tab
3. Check rendering performance

**Expected**:
- [ ] Page doesn't freeze
- [ ] Scrolling smooth
- [ ] No console errors
- [ ] All requests visible

**Actual**: _________________

**Status**: ☐ Pass ☐ Fail

---

## Bug Report Template

```markdown
### Bug Report: [Title]

**Severity**: 🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low

**Steps to Reproduce**:
1. ...
2. ...
3. ...

**Expected Behavior**:
- ...

**Actual Behavior**:
- ...

**Screenshots/Videos**: [Attach if applicable]

**Environment**:
- Browser: ...
- Device: ...
- OS: ...
- Timestamp: ...

**Console Errors**: [Paste if any]

**Additional Notes**:
- ...
```

---

## Sign-Off

| Item | Status | Tester | Date | Notes |
|------|--------|--------|------|-------|
| All 22 tests | ☐ Pass | _____ | ____ | _____ |
| No critical bugs | ☐ Pass | _____ | ____ | _____ |
| Performance OK | ☐ Pass | _____ | ____ | _____ |
| Ready for deploy | ☐ Yes | _____ | ____ | _____ |

---

## Deployment Checklist

Before deploying to production:

- [ ] All tests pass
- [ ] No console warnings or errors
- [ ] Performance acceptable
- [ ] Mobile/tablet/desktop all work
- [ ] Database backups taken
- [ ] Backend server updated
- [ ] Frontend assets built
- [ ] Cache cleared
- [ ] Test users notified
- [ ] Monitoring set up
