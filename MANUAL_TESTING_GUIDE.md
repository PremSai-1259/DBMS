# Doctor Schedule Setup - Manual Testing Guide

## Pre-Testing Setup

### Required Environment
- [ ] Backend server running (`npm start` in `/backend`)
- [ ] Frontend development server running (`npm start` in `/frontend`)
- [ ] Browser: Chrome/Firefox with DevTools available
- [ ] Database: MySQL with hospital_management database populated
- [ ] Test Doctor Account: Username/Email for login

### Test Data Required
- Doctor account with no prior schedule entries
- Doctor account with existing schedule entries
- Access to calendar dates (current + 7 days ahead)

---

## Test Suite 1: Initial Setup Flow (Doctor - First Time)

### Test 1.1: Setup Banner Appears for New Date
**Objective**: Verify yellow setup banner displays when doctor has no availability set

**Steps**:
1. Login as doctor without any schedule history
2. Navigate to **Doctor Dashboard** → **Schedule** tab
3. Select a **new date** (one never configured before)
4. Observe the top of the schedule area

**Expected Results**:
- [ ] Yellow banner appears at top of schedule
- [ ] Banner shows ⚠️ icon
- [ ] Banner title reads: "Set availability first"
- [ ] Banner message explains slots are unavailable by default
- [ ] "Quick: Make All Available" button is visible
- [ ] No green success banner visible

**Pass/Fail**: _______

---

### Test 1.2: Cannot Save Without Available Slots
**Objective**: Verify system prevents saving with all slots unavailable

**Steps**:
1. On same date with yellow setup banner visible
2. Leave all slots as unavailable (gray)
3. Click the "Save Changes" button (if enabled)

**Expected Results**:
- [ ] Save button is **DISABLED** (grayed out)
- [ ] Warning text appears: "Select at least one slot to save"
- [ ] Cannot click button
- [ ] No API call is made

**Pass/Fail**: _______

---

### Test 1.3: Select All Quick Action
**Objective**: Verify "Make All Available" button works

**Steps**:
1. Still on setup banner screen
2. Click "Quick: Make All Available" button

**Expected Results**:
- [ ] All 22 slots turn **green** (available)
- [ ] Slots 9-10 (lunch) remain gray/unavailable
- [ ] "Save Changes (22)" button appears and is **ENABLED**
- [ ] Warning text disappears
- [ ] Setup banner is still visible

**Pass/Fail**: _______

---

### Test 1.4: Save Successfully
**Objective**: Verify successful save completes setup

**Steps**:
1. With all available slots showing green
2. Click "Save Changes (22)" button

**Expected Results**:
- [ ] Button shows "Saving..." state
- [ ] Toast notification appears: "✓ Schedule saved! 22 slot(s) updated."
- [ ] Toast is green/success color
- [ ] API call completes (check Network tab)
- [ ] Button becomes hidden
- [ ] Yellow setup banner **DISAPPEARS**
- [ ] Green success banner **APPEARS** with: "Schedule is ready! You have 22 available slot(s)..."

**Pass/Fail**: _______

---

### Test 1.5: Setup Persists After Refresh
**Objective**: Verify saved availability persists

**Steps**:
1. Refresh page (F5)
2. Navigate back to Schedule tab
3. Select the same date again

**Expected Results**:
- [ ] All 22 slots still show green (available)
- [ ] Green success banner shows: "Schedule is ready! You have 22 available slot(s)..."
- [ ] Yellow setup banner **NOT** visible
- [ ] No "Save Changes" button (no changes to save)

**Pass/Fail**: _______

---

## Test Suite 2: Partial Setup (Select Some Slots)

### Test 2.1: Manual Slot Selection
**Objective**: Verify doctor can select specific slots

**Steps**:
1. Select a new unconfigured date
2. Yellow setup banner visible
3. Manually click 3-4 slot buttons (toggle them green)
4. Leave other slots gray

**Expected Results**:
- [ ] Clicked slots turn green
- [ ] Unclicked slots stay gray
- [ ] "Save Changes (3)" button appears
- [ ] Button is **ENABLED**
- [ ] Can deselect slots by clicking again (turn gray)
- [ ] Slot count updates in button

**Pass/Fail**: _______

---

### Test 2.2: Save Partial Selection
**Objective**: Verify partial selections save correctly

**Steps**:
1. Have 3-4 slots selected as green
2. Click "Save Changes (3)"

**Expected Results**:
- [ ] Save completes successfully
- [ ] Toast shows: "✓ Schedule saved! 3 slot(s) updated."
- [ ] Green success banner appears with count: "3 available slot(s)"
- [ ] Yellow warning banner disappears

**Pass/Fail**: _______

---

### Test 2.3: Verify Partial Persistence
**Objective**: Verify partial selections persist correctly

**Steps**:
1. Refresh page
2. Navigate to Schedule
3. Select same date

**Expected Results**:
- [ ] Only 3-4 slots show green
- [ ] Remaining slots show gray
- [ ] Green success banner shows: "3 available slot(s)"
- [ ] Can add more available slots

**Pass/Fail**: _______

---

## Test Suite 3: Modify Existing Schedule

### Test 3.1: Modify Existing Availability
**Objective**: Verify doctor can modify already-configured schedule

**Steps**:
1. Select a date with existing availability (e.g., from Test 2.3 with 3 slots)
2. Toggle one gray slot to green
3. Toggle one green slot to gray
4. Observe state

**Expected Results**:
- [ ] New slot turns green
- [ ] Previously available slot turns gray
- [ ] "Save Changes (2)" appears (2 changes tracked)
- [ ] Green success banner shows current count: "3 available slot(s)" (before save)

**Pass/Fail**: _______

---

### Test 3.2: Save Modifications
**Objective**: Verify modifications save correctly

**Steps**:
1. With 2 changes pending
2. Click "Save Changes (2)"

**Expected Results**:
- [ ] Save completes
- [ ] Toast shows: "✓ Schedule saved! 2 slot(s) updated."
- [ ] Green success banner updates to new count
- [ ] Button disappears
- [ ] No errors

**Pass/Fail**: _______

---

### Test 3.3: Verify Modifications Persist
**Objective**: Verify modifications persist across sessions

**Steps**:
1. Refresh page
2. Select same date

**Expected Results**:
- [ ] New slot is green
- [ ] Previously available slot is gray
- [ ] Count reflects changes
- [ ] No inconsistencies

**Pass/Fail**: _______

---

## Test Suite 4: Deselect All Scenario

### Test 4.1: Deselect All Button
**Objective**: Verify "Deselect All" button works

**Steps**:
1. Select any date with slots available
2. Click "Deselect All" button in the header

**Expected Results**:
- [ ] All slots turn **gray** (unavailable)
- [ ] "Save Changes (X)" button appears
- [ ] Button is **DISABLED** (cannot save all unavailable)
- [ ] Warning text shows: "Select at least one slot to save"

**Pass/Fail**: _______

---

### Test 4.2: Cannot Save After Deselect All
**Objective**: Verify cannot commit "no availability" state

**Steps**:
1. After deselecting all slots
2. Attempt to click save button

**Expected Results**:
- [ ] Button remains disabled
- [ ] No API call is made
- [ ] System prevents all-unavailable state

**Pass/Fail**: _______

---

### Test 4.3: Cancel Returns to Previous State
**Objective**: Verify cancel reverts changes

**Steps**:
1. Deselect all slots
2. Click "Cancel" button

**Expected Results**:
- [ ] Slots revert to previous saved state
- [ ] "Save Changes" button disappears
- [ ] Green success banner reappears with correct count

**Pass/Fail**: _______

---

## Test Suite 5: Error Handling

### Test 5.1: Network Error During Save
**Objective**: Verify graceful error handling

**Steps**:
1. Stop backend server or disable network
2. Make changes to slots
3. Try to save
4. Restore network/restart server

**Expected Results**:
- [ ] Toast shows: "Failed to save schedule"
- [ ] Red/error color for notification
- [ ] Slots revert to previous state after cancel
- [ ] No data corruption
- [ ] Recovery possible after network restored

**Pass/Fail**: _______

---

### Test 5.2: API Error Response
**Objective**: Verify backend validation error handling

**Steps**:
1. Monitor Network tab (DevTools)
2. Make some slots available
3. Modify frontend to bypass validation (for testing)
4. Send POST with all slots: false
5. Observe response

**Expected Results**:
- [ ] Backend returns 400 status
- [ ] Error message: "At least one slot must be set as available"
- [ ] Frontend shows error toast
- [ ] Data not saved in database

**Pass/Fail**: _______

---

## Test Suite 6: Date Navigation

### Test 6.1: Switch Between Dates
**Objective**: Verify state resets correctly when changing dates

**Steps**:
1. Configure Date A with 5 available slots
2. Save successfully
3. Switch to Date B (new, unconfigured)
4. Observe banners and state

**Expected Results**:
- [ ] Yellow setup banner appears for Date B
- [ ] Green success banner gone
- [ ] Slots all show gray for Date B
- [ ] Previous state preserved for Date A

**Pass/Fail**: _______

---

### Test 6.2: Return to Previously Configured Date
**Objective**: Verify state doesn't change

**Steps**:
1. From Date B, switch back to Date A

**Expected Results**:
- [ ] Green success banner shows for Date A
- [ ] 5 slots show as available (from Test 6.1)
- [ ] No data loss or revert

**Pass/Fail**: _______

---

### Test 6.3: Rapid Date Switching
**Objective**: Verify no race conditions

**Steps**:
1. Quickly click between 3-4 different dates
2. Allow page to load each time
3. Check data consistency

**Expected Results**:
- [ ] No data corruption
- [ ] Each date shows correct state
- [ ] No duplicate banner displays
- [ ] No console errors

**Pass/Fail**: _______

---

## Test Suite 7: UI/UX Verification

### Test 7.1: Mobile Responsiveness
**Objective**: Verify layout works on mobile

**Steps**:
1. Open DevTools (F12)
2. Click device toggle (responsive mode)
3. Test on iPhone 12 viewport
4. Test on iPad viewport
5. Navigate through schedule features

**Expected Results**:
- [ ] Banners stack properly
- [ ] Buttons are clickable (no too small)
- [ ] Text is readable
- [ ] No horizontal scroll needed
- [ ] Layout adapts correctly

**Pass/Fail**: _______

---

### Test 7.2: Color Contrast and Accessibility
**Objective**: Verify accessibility standards

**Steps**:
1. Review banner colors in different lighting
2. Check if banner text is readable against background
3. Verify icon usage (not just color)
4. Test keyboard navigation (Tab through buttons)

**Expected Results**:
- [ ] Yellow banner text readable on light background
- [ ] Green banner text readable
- [ ] Icons present (not relying on color alone)
- [ ] Keyboard users can navigate all buttons
- [ ] Tab order is logical

**Pass/Fail**: _______

---

### Test 7.3: Toast Notifications
**Objective**: Verify toast messages

**Steps**:
1. Perform various save operations
2. Observe toast notifications
3. Check positioning and duration

**Expected Results**:
- [ ] Toast appears at top/bottom consistently
- [ ] Message is clear and specific
- [ ] Auto-dismisses after ~3-4 seconds
- [ ] Can dismiss manually if needed
- [ ] No overlapping toasts

**Pass/Fail**: _______

---

## Test Suite 8: Integration with Booking System

### Test 8.1: Verify Patients See Available Slots
**Objective**: Verify patient booking only shows available slots

**Steps**:
1. As doctor: Configure Date X with slots 1-3 available
2. Save successfully
3. Logout
4. Login as patient
5. Try to book appointment for Date X
6. Check which slots appear as bookable

**Expected Results**:
- [ ] Only slots 1-3 appear as available for booking
- [ ] Other slots are grayed out or hidden
- [ ] Can successfully book slot 1, 2, or 3
- [ ] Cannot book unavailable slots

**Pass/Fail**: _______

---

### Test 8.2: Patients Cannot Book Unavailable Slots
**Objective**: Verify booking system respects availability

**Steps**:
1. As patient: Try to book unavailable slot (slot 11, 12, etc.)
2. Check API response

**Expected Results**:
- [ ] Slot shows as unavailable
- [ ] Cannot click/select it
- [ ] If forced via API, backend rejects with error
- [ ] Booking does not create

**Pass/Fail**: _______

---

## Test Suite 9: Multiple Doctors Scenario

### Test 9.1: Doctor A Configuration
**Objective**: Verify isolated schedule per doctor

**Steps**:
1. Login as Doctor A
2. Configure Date X with slots 1-5 available
3. Save

**Expected Results**:
- [ ] Schedule saved for Doctor A
- [ ] Database shows Doctor A ID with correct slots

**Pass/Fail**: _______

---

### Test 9.2: Doctor B Independent Configuration
**Objective**: Verify Doctor B doesn't see Doctor A's schedule

**Steps**:
1. Logout
2. Login as Doctor B
3. Navigate to Schedule for same Date X
4. Check which slots appear available

**Expected Results**:
- [ ] Yellow setup banner appears (no prior configuration)
- [ ] Slots all show gray (unavailable)
- [ ] Doctor B's schedule is independent
- [ ] Doctor A's configuration doesn't affect Doctor B

**Pass/Fail**: _______

---

## Test Suite 10: Edge Cases

### Test 10.1: Select One Slot Then Save
**Objective**: Verify minimal setup works

**Steps**:
1. New date, yellow banner visible
2. Select only 1 slot (toggle it green)
3. Save

**Expected Results**:
- [ ] Save succeeds
- [ ] Toast: "✓ Schedule saved! 1 slot(s) updated."
- [ ] Green banner shows: "1 available slot(s)"
- [ ] Can add more slots later

**Pass/Fail**: _______

---

### Test 10.2: All 22 Slots Available (Maximum)
**Objective**: Verify maximum slots work

**Steps**:
1. New date, click "Select All"
2. Verify all 22 slots green (9-10 not included)
3. Save

**Expected Results**:
- [ ] All 22 slots save successfully
- [ ] Toast shows: "22 slot(s) updated"
- [ ] Green banner shows: "22 available slot(s)"
- [ ] No performance issues

**Pass/Fail**: _______

---

### Test 10.3: Half Day Availability
**Objective**: Verify partial day configurations

**Steps**:
1. New date
2. Select slots 1-8 (morning only)
3. Leave 11-24 (afternoon/evening) gray
4. Save

**Expected Results**:
- [ ] Only morning slots available
- [ ] Afternoon slots unavailable
- [ ] Patient can only book morning
- [ ] Setup correct

**Pass/Fail**: _______

---

## Summary Report

**Total Tests**: 50
**Tests Passed**: _____ / 50
**Tests Failed**: _____ / 50
**Pass Rate**: _____%

**Critical Issues Found**:
- [ ] None
- [ ] [List critical issues]

**Minor Issues Found**:
- [ ] None
- [ ] [List minor issues]

**Blockers for Deployment**:
- [ ] None found - READY FOR DEPLOYMENT
- [ ] [List blockers]

**Recommendations**:
- [List any recommendations]

---

**Tester Name**: ________________________
**Test Date**: ________________________
**Sign-Off**: ________________________

---

**Notes**:
[Space for additional notes, observations, or edge cases discovered]
