import { useState, useEffect } from 'react';
import { scheduleService } from '../services/scheduleService';
import useToast from '../hooks/useToast';

const ScheduleManager = ({ selectedDate }) => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [localChanges, setLocalChanges] = useState({});
  const [hasSetupBefore, setHasSetupBefore] = useState(true);
  const [isUsingFallback, setIsUsingFallback] = useState(false);
  const { showToast } = useToast();

  // Generate all 24 slots as fallback when API fails
  const generateFallbackSlots = () => {
    const slotTimes = [
      { slot: 1, start: '08:00', end: '08:30' },
      { slot: 2, start: '08:30', end: '09:00' },
      { slot: 3, start: '09:00', end: '09:30' },
      { slot: 4, start: '09:30', end: '10:00' },
      { slot: 5, start: '10:00', end: '10:30' },
      { slot: 6, start: '10:30', end: '11:00' },
      { slot: 7, start: '11:00', end: '11:30' },
      { slot: 8, start: '11:30', end: '12:00' },
      { slot: 11, start: '13:00', end: '13:30' },
      { slot: 12, start: '13:30', end: '14:00' },
      { slot: 13, start: '14:00', end: '14:30' },
      { slot: 14, start: '14:30', end: '15:00' },
      { slot: 15, start: '15:00', end: '15:30' },
      { slot: 16, start: '15:30', end: '16:00' },
      { slot: 17, start: '16:00', end: '16:30' },
      { slot: 18, start: '16:30', end: '17:00' },
      { slot: 19, start: '17:00', end: '17:30' },
      { slot: 20, start: '17:30', end: '18:00' },
      { slot: 21, start: '18:00', end: '18:30' },
      { slot: 22, start: '18:30', end: '19:00' },
      { slot: 23, start: '19:00', end: '19:30' },
      { slot: 24, start: '19:30', end: '20:00' },
    ];

    const convertTo12Hour = (time24) => {
      const [hours, minutes] = time24.split(':').map(Number);
      const period = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;
      return `${String(displayHours).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${period}`;
    };

    return slotTimes.map(slot => ({
      slotNumber: slot.slot,
      startTime: slot.start,
      endTime: slot.end,
      displayTime: `${convertTo12Hour(slot.start)} - ${convertTo12Hour(slot.end)}`,
      isAvailable: false,
      isBooked: false,
    }));
  };

  // Load slots for the selected date
  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    setIsUsingFallback(false);
    try {
      const response = await scheduleService.getSlotsForDate(selectedDate);
      const loadedSlots = response?.data?.slots || [];
      
      if (!Array.isArray(loadedSlots) || loadedSlots.length === 0) {
        console.warn('No slots received from API, using fallback', response);
        // Use fallback slots when API returns empty
        const fallbackSlots = generateFallbackSlots();
        setSlots(fallbackSlots);
        setIsUsingFallback(true);
        setHasSetupBefore(false);
      } else {
        setSlots(loadedSlots);
        setError(null);
        setIsUsingFallback(false);
        // Check if doctor has set any availability before on this date
        const hasAnyAvailable = loadedSlots.some(s => s.isAvailable);
        setHasSetupBefore(hasAnyAvailable);
      }
      setLocalChanges({});
    } catch (error) {
      console.error('Failed to load slots:', error);
      // Use fallback slots when API fails
      const fallbackSlots = generateFallbackSlots();
      setSlots(fallbackSlots);
      setIsUsingFallback(true);
      setHasSetupBefore(false);
      showToast('Using default schedule (API error - changes will be saved locally)', 'warning');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleSlot = (slotNumber) => {
    const slot = slots.find(s => s.slotNumber === slotNumber);
    if (!slot) return;

    const newStatus = !slot.isAvailable;
    
    // Update local state
    setSlots(slots.map(s =>
      s.slotNumber === slotNumber
        ? { ...s, isAvailable: newStatus }
        : s
    ));

    // Track local changes
    setLocalChanges({
      ...localChanges,
      [slotNumber]: newStatus,
    });
  };

  const handleSaveChanges = async () => {
    console.log('💾 Save button clicked');
    console.log('📊 Local changes:', localChanges);
    console.log('📊 Changes count:', Object.keys(localChanges).length);

    if (Object.keys(localChanges).length === 0) {
      console.warn('⚠️ No changes to save');
      showToast('No changes to save', 'warning');
      return;
    }

    // Get all currently available slots
    const availableSlots = slots.filter(s => s.isAvailable);
    console.log('✅ Currently available slots:', availableSlots.map(s => s.slotNumber));

    if (availableSlots.length === 0) {
      console.warn('⚠️ No available slots selected');
      showToast('Please set at least one slot as available before saving', 'warning');
      return;
    }

    setSaving(true);
    try {
      // Convert available slots to the format expected by API
      const slotsToSave = {};
      availableSlots.forEach(slot => {
        slotsToSave[slot.slotNumber] = true;
      });

      console.log('📤 Sending to API:');
      console.log('   - selectedDate:', selectedDate);
      console.log('   - slotsToSave:', slotsToSave);
      console.log('   - availableCount:', availableSlots.length);

      const response = await scheduleService.updateMultipleSlots(selectedDate, slotsToSave);
      
      console.log('✅ API Response:', response?.data);
      
      setLocalChanges({});
      setHasSetupBefore(true);
      setIsUsingFallback(false);
      
      // Build detailed success message
      const slotList = availableSlots.map(s => `${s.slotNumber} (${s.displayTime})`).join(', ');
      showToast(
        `✓ Schedule saved! ${availableSlots.length} slot(s) available: ${slotList}`,
        'success'
      );
      
      console.log(`✅ Schedule saved successfully`);
    } catch (error) {
      console.error('❌ Failed to save changes:', error);
      const errorMsg = error?.response?.data?.error || error.message || 'Unknown error';
      console.error('   Error details:', errorMsg);
      showToast('Failed to save schedule: ' + errorMsg, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleSelectAll = () => {
    const allSlots = {};
    slots.forEach(s => {
      allSlots[s.slotNumber] = true;
    });
    setSlots(slots.map(s => ({ ...s, isAvailable: true })));
    setLocalChanges(allSlots);
  };

  const handleDeselectAll = () => {
    const allSlots = {};
    slots.forEach(s => {
      allSlots[s.slotNumber] = false;
    });
    setSlots(slots.map(s => ({ ...s, isAvailable: false })));
    setLocalChanges(allSlots);
  };

  const availableCount = slots.filter(s => s.isAvailable).length;
  const changedCount = Object.keys(localChanges).length;

  // Group slots by period
  const morningSlots = slots.filter(s => s.slotNumber <= 8);
  const afternoonSlots = slots.filter(s => s.slotNumber >= 11);

  if (loading) {
    return (
      <div className="flex flex-col justify-center items-center py-16 gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
          <div className="absolute inset-2 rounded-full border-4 border-transparent border-r-[#3a7bd5] animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1s' }} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#1a2a3a]">Loading your schedule...</p>
          <p className="text-xs text-[#8a9ab0] mt-1">Please wait a moment</p>
        </div>
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="px-6 py-5 rounded-2xl border-2 bg-gradient-to-r from-[#fee2e2] to-[#fca5a5]" style={{ borderColor: '#dc2626' }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#991b1b]">Unable to Load Schedule</h4>
              <p className="text-xs text-[#b91c1c] mt-1.5">The schedule data could not be loaded. This might be a temporary issue.</p>
              <button
                onClick={loadSlots}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                style={{ background: '#dc2626', color: 'white' }}>
                🔄 Try Again
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Check if any slots are available now or after pending changes
  const hasAvailableSlots = slots.some(s => s.isAvailable);
  const isSetupRequired = !hasAvailableSlots && !hasSetupBefore;

  return (
    <div className="w-full space-y-6">
      {/* FALLBACK MODE WARNING BANNER */}
      {isUsingFallback && (
        <div className="px-6 py-5 rounded-2xl border-2" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#92400e]">Temporary Connection Mode</h4>
              <p className="text-xs text-[#a16207] mt-1.5">
                There's a temporary issue connecting to the server. Using default schedule view. Your changes will be saved when you click "Save Changes".
              </p>
              <button
                onClick={loadSlots}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                style={{ background: '#f59e0b', color: 'white' }}>
                🔄 Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP REQUIRED BANNER */}
      {isSetupRequired && (
        <div className="px-6 py-5 rounded-2xl border-2" style={{ background: '#fef3c7', borderColor: '#fcd34d' }}>
          <div className="flex items-start gap-4">
            <span className="text-3xl flex-shrink-0">⚡</span>
            <div className="flex-1">
              <h4 className="text-sm font-bold text-[#92400e]">First Time Setup Required!</h4>
              <p className="text-xs text-[#a16207] mt-1.5">
                Select your available time slots below to start accepting patient appointments. All slots are unavailable by default.
              </p>
              <button
                onClick={handleSelectAll}
                className="mt-3 px-4 py-2 text-xs font-bold rounded-lg transition-all transform hover:scale-105 active:scale-95"
                style={{ background: '#f59e0b', color: 'white' }}>
                🚀 Quick Setup: Make All Available
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS BANNER - Setup Complete */}
      {hasAvailableSlots && hasSetupBefore && Object.keys(localChanges).length === 0 && (
        <div className="px-6 py-4 rounded-2xl border-2 bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5]" style={{ borderColor: '#10b981' }}>
          <div className="flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-[#065f46]">
                Schedule is ready! 
              </p>
              <p className="text-xs text-[#047857] mt-0.5">
                You have {availableCount} available slot{availableCount !== 1 ? 's' : ''} on this date. Patients can now book appointments during these times.
              </p>
            </div>
          </div>
        </div>
      )}
      {/* Header with stats */}
      <div className="bg-gradient-to-r from-[#3a7bd5] to-[#2d5a8e] rounded-2xl p-6 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold flex items-center gap-2">
              <span className="text-2xl">📆</span> 
              Schedule for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
            </h3>
            <p className="text-sm mt-2 opacity-90">
              You have <span className="font-bold text-lg">{availableCount}</span> available slot{availableCount !== 1 ? 's' : ''} out of 24 total
            </p>
          </div>
          <div className="text-right">
            <div className="text-4xl font-bold">{availableCount}</div>
            <div className="text-sm opacity-90 mt-1">Slots Open</div>
          </div>
        </div>
      </div>

      {/* All Slots - Grid View */}
      <div className="bg-gradient-to-br from-[#f8f9fc] to-[#f0f4f9] rounded-2xl border border-[#e6ecf5] p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-base font-bold text-[#1a2a3a] flex items-center gap-2">
              <span className="text-xl">📅</span> Schedule Overview
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => handleSelectAll()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all transform hover:scale-105"
                style={{ background: '#e6f9f2', color: '#1a9e6a', border: '1px solid #1a9e6a' }}>
                ✓ Select All
              </button>
              <button
                onClick={() => handleDeselectAll()}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg transition-all transform hover:scale-105"
                style={{ background: '#fee2e2', color: '#dc2626', border: '1px solid #dc2626' }}>
                ✕ Deselect All
              </button>
            </div>
          </div>
          <p className="text-xs text-[#8a9ab0]">Click on any slot to toggle availability. Green = Available, Gray = Unavailable</p>
        </div>

        {/* Morning Slots */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#e6ecf5]">
            <div>
              <h4 className="text-sm font-bold text-[#1a2a3a] flex items-center gap-2">
                <span className="text-lg">🌅</span> Morning (8:00 AM - 12:00 PM)
              </h4>
              <p className="text-xs text-[#8a9ab0] mt-1">{morningSlots.filter(s => s.isAvailable).length} / {morningSlots.length} slots available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {morningSlots.map(slot => (
              <button
                key={slot.slotNumber}
                onClick={() => handleToggleSlot(slot.slotNumber)}
                className="relative group p-4 rounded-xl transition-all duration-300 transform hover:scale-105 border-2"
                style={
                  slot.isAvailable
                    ? {
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        borderColor: '#16a34a',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                      }
                    : {
                        background: '#ffffff',
                        borderColor: '#e5e7eb'
                      }
                }>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1a2a3a]">{slot.slotNumber}</div>
                  <div className="text-xs font-semibold text-[#3a7bd5] mt-2">{slot.displayTime}</div>
                  <div className={`text-xs font-bold mt-3 px-2 py-1 rounded-full inline-block ${slot.isAvailable ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                    {slot.isAvailable ? '✓' : '○'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lunch Break Info */}
        <div className="px-5 py-4 rounded-xl mb-8 flex items-start gap-3" style={{ background: '#fef3c7', border: '2px solid #fcd34d' }}>
          <span className="text-2xl flex-shrink-0">🍽️</span>
          <div>
            <p className="text-sm font-bold text-[#92400e]">Lunch Break</p>
            <p className="text-xs text-[#a16207] mt-0.5">12:00 PM - 1:00 PM (Slots 9-10 are always unavailable)</p>
          </div>
        </div>

        {/* Afternoon Slots */}
        <div>
          <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-[#e6ecf5]">
            <div>
              <h4 className="text-sm font-bold text-[#1a2a3a] flex items-center gap-2">
                <span className="text-lg">🌤️</span> Afternoon & Evening (1:00 PM - 9:00 PM)
              </h4>
              <p className="text-xs text-[#8a9ab0] mt-1">{afternoonSlots.filter(s => s.isAvailable).length} / {afternoonSlots.length} slots available</p>
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {afternoonSlots.map(slot => (
              <button
                key={slot.slotNumber}
                onClick={() => handleToggleSlot(slot.slotNumber)}
                className="relative group p-4 rounded-xl transition-all duration-300 transform hover:scale-105 border-2"
                style={
                  slot.isAvailable
                    ? {
                        background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
                        borderColor: '#16a34a',
                        boxShadow: '0 4px 12px rgba(22, 163, 74, 0.15)'
                      }
                    : {
                        background: '#ffffff',
                        borderColor: '#e5e7eb'
                      }
                }>
                <div className="text-center">
                  <div className="text-lg font-bold text-[#1a2a3a]">{slot.slotNumber}</div>
                  <div className="text-xs font-semibold text-[#3a7bd5] mt-2">{slot.displayTime}</div>
                  <div className={`text-xs font-bold mt-3 px-2 py-1 rounded-full inline-block ${slot.isAvailable ? 'bg-[#dcfce7] text-[#166534]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                    {slot.isAvailable ? '✓' : '○'}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button Section */}
      {changedCount > 0 ? (
        <div className="bg-gradient-to-r from-[#ecfdf5] to-[#d1fae5] rounded-2xl p-6 border-2 border-[#10b981] shadow-lg">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1">
              <p className="text-sm font-bold text-[#065f46] flex items-center gap-2">
                <span className="text-xl">✨</span> You have {changedCount} unsaved change{changedCount > 1 ? 's' : ''}
              </p>
              <p className="text-xs text-[#047857] mt-1">
                {!slots.some(s => s.isAvailable) 
                  ? '⚠️ Select at least one slot to save' 
                  : `Ready to save ${slots.filter(s => s.isAvailable).length} available slot${slots.filter(s => s.isAvailable).length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveChanges}
                disabled={saving || !slots.some(s => s.isAvailable)}
                className="px-6 py-3 rounded-xl text-sm font-bold text-white transition-all duration-300 transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg"
                style={{ 
                  background: slots.some(s => s.isAvailable) 
                    ? 'linear-gradient(135deg, #10b981, #059669)' 
                    : '#9ca3af',
                  boxShadow: slots.some(s => s.isAvailable) ? '0 4px 14px rgba(16, 185, 129, 0.4)' : 'none'
                }}>
                {saving ? '💾 Saving...' : `✓ Save Changes (${changedCount})`}
              </button>
              <button
                onClick={loadSlots}
                disabled={saving}
                className="px-5 py-3 rounded-xl text-sm font-semibold text-[#4b5563] bg-white border-2 border-[#e5e7eb] hover:bg-[#f3f4f6] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
                ✕ Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gradient-to-r from-[#f0f9ff] to-[#e0f2fe] rounded-2xl p-6 border-2 border-[#0ea5e9] text-center">
          <p className="text-sm font-semibold text-[#0369a1]">✅ Your schedule is all set!</p>
          <p className="text-xs text-[#0c4a6e] mt-1">Make changes to update your availability</p>
        </div>
      )}

      {/* Info/Guidance section */}
      <div className="bg-gradient-to-r from-[#dbeafe] to-[#dbeafe] rounded-2xl p-6 border-2 border-[#3b82f6]">
        <div className="space-y-3">
          <p className="text-sm font-bold text-[#1e40af] flex items-center gap-2">
            <span className="text-lg">📖</span> How to Set Your Schedule
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <div className="flex gap-3 bg-white rounded-lg p-3 border border-[#bfdbfe]">
              <span className="text-2xl flex-shrink-0">1️⃣</span>
              <div>
                <p className="text-xs font-semibold text-[#1e40af]">Click Slots to Toggle</p>
                <p className="text-xs text-[#3730a3] mt-0.5">Select the time slots when you're available</p>
              </div>
            </div>
            <div className="flex gap-3 bg-white rounded-lg p-3 border border-[#bfdbfe]">
              <span className="text-2xl flex-shrink-0">2️⃣</span>
              <div>
                <p className="text-xs font-semibold text-[#1e40af]">Green = Available</p>
                <p className="text-xs text-[#3730a3] mt-0.5">Selected slots will be highlighted in green</p>
              </div>
            </div>
            <div className="flex gap-3 bg-white rounded-lg p-3 border border-[#bfdbfe]">
              <span className="text-2xl flex-shrink-0">3️⃣</span>
              <div>
                <p className="text-xs font-semibold text-[#1e40af]">Save Your Changes</p>
                <p className="text-xs text-[#3730a3] mt-0.5">Click the Save button to store your schedule</p>
              </div>
            </div>
            <div className="flex gap-3 bg-white rounded-lg p-3 border border-[#bfdbfe]">
              <span className="text-2xl flex-shrink-0">4️⃣</span>
              <div>
                <p className="text-xs font-semibold text-[#1e40af]">Patients Can Book</p>
                <p className="text-xs text-[#3730a3] mt-0.5">Patients can only book during your available slots</p>
              </div>
            </div>
          </div>
          <div className="mt-4 p-3 rounded-lg bg-white border border-[#bfdbfe]">
            <p className="text-xs text-[#1e40af] font-semibold">💡 Pro Tip:</p>
            <p className="text-xs text-[#3730a3] mt-1">Use "Select All" to make all slots available, then unselect the ones you'd prefer to skip.</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
