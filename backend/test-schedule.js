#!/usr/bin/env node

/**
 * Schedule Feature Test Script
 * Tests the doctor schedule management feature
 * 
 * Usage: node test-schedule.js
 */

const axios = require('axios');

const API_BASE = 'http://localhost:3000/api';
const AUTH_TOKEN = 'your-auth-token-here'; // Replace with actual token

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
});

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
  red: '\x1b[31m',
};

function log(color, message) {
  console.log(`${colors[color] || ''}${message}${colors.reset}`);
}

async function testScheduleFeature() {
  log('bright', '\n╔════════════════════════════════════════════════════════╗');
  log('bright', '║  Doctor Schedule Management - Feature Test              ║');
  log('bright', '╚════════════════════════════════════════════════════════╝\n');

  try {
    // Test 1: Get slot times
    log('blue', '📋 Test 1: Get Slot Time Information');
    const slotTimesRes = await api.get('/schedule/slot-times');
    log('green', `✓ Retrieved ${slotTimesRes.data.totalSlots} slots`);
    console.log('  Morning slots: 1-8 (8:00 AM - 12:00 PM)');
    console.log('  Lunch break: 12:00 PM - 1:00 PM (no slots 9-10)');
    console.log('  Afternoon slots: 11-24 (1:00 PM - 9:00 PM)');

    // Test 2: Get or create schedule for today
    const today = new Date().toISOString().split('T')[0];
    log('blue', `\n📅 Test 2: Get Schedule for Today (${today})`);
    const getSlotsRes = await api.get('/schedule/date', { 
      params: { scheduleDate: today } 
    });
    log('green', `✓ Retrieved schedule with ${getSlotsRes.data.totalSlots} slots`);
    
    const availableCount = getSlotsRes.data.slots.filter(s => s.isAvailable).length;
    log('yellow', `  Available slots: ${availableCount}/${getSlotsRes.data.totalSlots}`);

    // Test 3: Update single slot
    log('blue', '\n🔄 Test 3: Update Single Slot (Slot 1)');
    const updateSlotRes = await api.post('/schedule/slot', {
      scheduleDate: today,
      slotNumber: 1,
      isAvailable: true,
    });
    log('green', `✓ ${updateSlotRes.data.message}`);

    // Test 4: Update multiple slots (morning shift)
    log('blue', '\n🔄 Test 4: Update Multiple Slots (Morning Shift 1-8)');
    const slots = {};
    for (let i = 1; i <= 8; i++) {
      slots[i] = true; // Make morning slots available
    }
    
    const bulkUpdateRes = await api.post('/schedule/bulk', {
      scheduleDate: today,
      slots: slots,
    });
    log('green', `✓ ${bulkUpdateRes.data.message}`);

    // Test 5: Verify slots updated
    log('blue', '\n✅ Test 5: Verify Slots Updated');
    const verifySlotsRes = await api.get('/schedule/date', {
      params: { scheduleDate: today }
    });
    
    const morningSlots = verifySlotsRes.data.slots
      .filter(s => s.slotNumber <= 8)
      .filter(s => s.isAvailable)
      .length;
    
    log('green', `✓ Morning slots available: ${morningSlots}/8`);
    log('yellow', `  Sample: ${verifySlotsRes.data.slots.slice(0, 3).map(s => 
      `${s.displayTime} (${s.isAvailable ? '✓' : '✗'})`
    ).join(' | ')}`);

    // Test 6: Get week schedule
    log('blue', '\n📊 Test 6: Get Week Schedule');
    const weekRes = await api.get('/schedule/week', {
      params: { startDate: today }
    });
    log('green', `✓ Retrieved week schedule for ${weekRes.data.dayCount} days`);
    
    const dayCount = Object.keys(weekRes.data.weekSchedule).length;
    log('yellow', `  Days in schedule: ${dayCount}`);

    // Test 7: Update afternoon slots
    log('blue', '\n🔄 Test 7: Update Afternoon Slots (After Lunch)');
    const afternoonSlots = {};
    for (let i = 11; i <= 24; i++) {
      afternoonSlots[i] = true; // Make afternoon slots available
    }
    
    const afternoonUpdateRes = await api.post('/schedule/bulk', {
      scheduleDate: today,
      slots: afternoonSlots,
    });
    log('green', `✓ ${afternoonUpdateRes.data.message}`);

    // Test 8: Final verification
    log('blue', '\n📊 Test 8: Final Verification - Full Day Schedule');
    const finalRes = await api.get('/schedule/date', {
      params: { scheduleDate: today }
    });
    
    const totalAvailable = finalRes.data.slots.filter(s => s.isAvailable).length;
    const totalUnavailable = finalRes.data.slots.filter(s => !s.isAvailable).length;
    
    log('green', `✓ Schedule Summary for ${today}:`);
    log('yellow', `  Total Available: ${totalAvailable}/24`);
    log('yellow', `  Total Unavailable: ${totalUnavailable}/24`);
    
    // Show slot breakdown
    const morning = finalRes.data.slots.filter(s => s.slotNumber <= 8).filter(s => s.isAvailable).length;
    const afternoon = finalRes.data.slots.filter(s => s.slotNumber >= 11).filter(s => s.isAvailable).length;
    
    log('yellow', `  Morning (8AM-12PM): ${morning}/8 available`);
    log('yellow', `  Afternoon (1PM-9PM): ${afternoon}/14 available`);

    log('bright', '\n╔════════════════════════════════════════════════════════╗');
    log('green', '║  ✓ All Tests Passed Successfully!                      ║');
    log('bright', '╚════════════════════════════════════════════════════════╝\n');

  } catch (error) {
    log('red', '\n❌ Test Failed!');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Error:', error.response.data);
    } else if (error.request) {
      console.error('No response received:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    process.exit(1);
  }
}

// Example usage without authentication (for public endpoints)
async function testPublicEndpoints() {
  log('bright', '\n╔════════════════════════════════════════════════════════╗');
  log('bright', '║  Doctor Schedule - Public Endpoints Test               ║');
  log('bright', '╚════════════════════════════════════════════════════════╝\n');

  const publicApi = axios.create({
    baseURL: API_BASE,
    headers: { 'Content-Type': 'application/json' },
  });

  try {
    log('blue', '📋 Getting Slot Time Information (Public)');
    const res = await publicApi.get('/schedule/slot-times');
    log('green', `✓ Retrieved ${res.data.totalSlots} slots`);
    
    console.log('\n📅 Sample Slots:');
    res.data.slots.slice(0, 5).forEach(slot => {
      console.log(`  Slot ${slot.slot}: ${slot.start} - ${slot.end}`);
    });
    
    console.log('  ...');
    console.log('\n🍽️  Lunch Break: 12:00 PM - 1:00 PM (Slots 9-10 skipped)');
    console.log('  ...');
    
    res.data.slots.slice(-3).forEach(slot => {
      console.log(`  Slot ${slot.slot}: ${slot.start} - ${slot.end}`);
    });

    log('green', '\n✓ Public endpoint test passed!');

  } catch (error) {
    log('red', '❌ Public endpoint test failed!');
    console.error(error.message);
    process.exit(1);
  }
}

// Run tests
if (process.argv.includes('--public-only')) {
  testPublicEndpoints();
} else if (!AUTH_TOKEN || AUTH_TOKEN === 'your-auth-token-here') {
  log('yellow', '⚠️  Note: AUTH_TOKEN not set, running public endpoint test only\n');
  testPublicEndpoints();
} else {
  testScheduleFeature();
}
