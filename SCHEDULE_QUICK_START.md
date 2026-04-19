# Schedule Feature - Quick Start Guide

## 🚀 For Doctors: 30-Second Getting Started

### Step 1: Navigate to Schedule
1. Login to your doctor dashboard
2. Click on **Schedule** tab (📅) in the left sidebar

### Step 2: Pick a Date
1. A calendar appears at the top showing 7 days
2. Click on any date you want to set your availability
3. The date will be highlighted in blue

### Step 3: Set Your Availability
**Option A: Manual Selection**
- Click each time slot to toggle it
- Green = Available ✓
- Gray = Not Available

**Option B: Quick Actions**
- **Select All** - Makes all slots available (green)
- **Deselect All** - Makes all slots unavailable (gray)

### Step 4: Save
1. After making changes, click **"Save Changes"** button
2. You'll see a green notification saying "Slot updated successfully"
3. Done! Your schedule is saved

---

## 📋 Slot Times at a Glance

```
MORNING (8 AM - 12 PM)    [8 slots]
┌─────────────────────────┐
│ 8:00-8:30  8:30-9:00    │
│ 9:00-9:30  9:30-10:00   │
│ 10:00-10:30 10:30-11:00 │
│ 11:00-11:30 11:30-12:00 │
└─────────────────────────┘

LUNCH BREAK 12 PM - 1 PM  [No slots]
🍽️  [No appointments]

AFTERNOON (1 PM - 9 PM)   [14 slots]
┌─────────────────────────┐
│ 1:00-1:30  1:30-2:00    │
│ 2:00-2:30  2:30-3:00    │
│ ... (continuing every 30 mins)
│ 8:00-8:30  8:30-9:00    │
└─────────────────────────┘
```

**Total: 24 slots per day, 30 minutes each**

---

## ✅ Key Features

| Feature | What It Does |
|---------|-------------|
| **24 Slots** | 8 morning + 14 afternoon slots |
| **30 Min Each** | Each slot is exactly 30 minutes |
| **Color Coded** | Green = Available, Gray = Not Available |
| **Select All** | Quickly make all slots available |
| **Deselect All** | Quickly make all slots unavailable |
| **Save Changes** | All changes saved to database |
| **Default** | All slots start as unavailable (your choice) |

---

## 🎯 Common Tasks

### Make Only Morning Available
1. Click "Select All" button
2. Manually deselect afternoon slots (1-9 PM)
3. Deselect slot 12 (lunch start)
4. Click "Save Changes"

### Make Only Afternoon Available
1. Click "Deselect All" button
2. Manually select afternoon slots only (1-9 PM)
3. Click "Save Changes"

### Copy Yesterday's Schedule
1. Select yesterday's date
2. Click "Select All"
3. Click "Save Changes"
4. Select today's date
5. Click "Select All"
6. Click "Save Changes"

### Set Standard Working Hours (9 AM - 5 PM)
1. Deselect morning slots 1-2 (8-9 AM)
2. Keep slots 3-8 (9 AM - 12 PM) selected
3. Keep afternoon slots 11-20 selected (1-5 PM)
4. Deselect slots 21-24 (5-9 PM)
5. Click "Save Changes"

---

## 💡 Tips & Tricks

- **Fast Setup**: Use "Select All" then manually deselect exceptions
- **Multiple Days**: Set one date perfectly, then copy to other dates
- **Lunch Break**: Slots 9-10 (12-1 PM) are always unavailable (good for lunch!)
- **Any Day**: You can set schedules weeks in advance
- **Changes Instant**: Patients immediately see your available slots

---

## ❓ FAQ

**Q: What if I make a mistake?**
A: Click "Cancel" button before saving. If you already saved, just go back and change it.

**Q: Are my changes saved automatically?**
A: No, click "Save Changes" button to confirm. You'll see a green notification.

**Q: Can I set the same schedule for multiple days?**
A: Not in one action. Set for one day, then repeat for other days. Future version will have copy/repeat feature.

**Q: What time format is this?**
A: 24-hour format (e.g., 13:00 = 1 PM, 20:00 = 8 PM)

**Q: Can I have different break times?**
A: Currently, lunch break is fixed 12 PM - 1 PM. Custom breaks coming in future.

**Q: What if I'm sick and can't see patients?**
A: Make all slots unavailable for that day.

---

## 📞 Need Help?

- Check the green status box at bottom for tips
- Read full docs: SCHEDULE_FEATURE_DOCUMENTATION.md
- Contact admin if issues persist

---

## 🎉 You're All Set!

Your schedule is now managed professionally. Patients can only book during your available slots. Enjoy!
