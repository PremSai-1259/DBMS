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
      <div className="flex justify-center items-center py-12">
        <div className="w-8 h-8 rounded-full border-4 border-[#e6ecf5] border-t-[#3a7bd5] animate-spin" />
      </div>
    );
  }

  if (!slots || slots.length === 0) {
    return (
      <div className="w-full space-y-4">
        <div className="px-5 py-4 rounded-xl border-l-4 bg-yellow-50" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#92400e]">No Slots Found</h4>
              <p className="text-xs text-[#a16207] mt-1">The schedule data could not be loaded. Please try again.</p>
              <button
                onClick={loadSlots}
                className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-[#f59e0b] text-white hover:bg-[#d97706] transition-all">
                Reload Schedule
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
        <div className="px-5 py-4 rounded-xl border-l-4" style={{ background: '#fef3e6', borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#92400e]">Schedule using default view</h4>
              <p className="text-xs text-[#a16207] mt-1">
                Server connection issue detected. All slots are shown below. Your changes will be saved when you click "Save Changes".
              </p>
              <button
                onClick={loadSlots}
                className="mt-2 px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                style={{ background: '#f59e0b', color: 'white' }}>
                Retry Connection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SETUP REQUIRED BANNER */}
      {isSetupRequired && (
        <div className="px-5 py-4 rounded-xl border-l-4" style={{ background: '#fef3e6', borderLeft: '4px solid #f59e0b' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">⚠️</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#92400e]">Set availability first</h4>
              <p className="text-xs text-[#a16207] mt-1">
                All slots are unavailable by default. Select at least one slot and save to start accepting appointments on this date.
              </p>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={handleSelectAll}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
                  style={{ background: '#e6f9f2', color: '#1a9e6a', border: '1px solid #1a9e6a' }}>
                  Quick: Make All Available
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS BANNER - Setup Complete */}
      {hasAvailableSlots && hasSetupBefore && Object.keys(localChanges).length === 0 && (
        <div className="px-5 py-3 rounded-xl border-l-4" style={{ background: '#e6f9f2', borderLeft: '4px solid #1a9e6a' }}>
          <div className="flex items-center gap-3">
            <span className="text-lg">✓</span>
            <p className="text-xs font-medium text-[#1a9e6a]">
              Schedule is ready! You have {availableCount} available slot{availableCount !== 1 ? 's' : ''} on this date.
            </p>
          </div>
        </div>
      )}
      {/* Header with stats */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-sm font-semibold text-[#1a2a3a]">
            Schedule for {new Date(selectedDate).toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'short' })}
          </h3>
          <p className="text-xs text-[#8a9ab0] mt-1">
            {availableCount} available slot{availableCount !== 1 ? 's' : ''} · 24 total slots
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleSelectAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{ background: '#e8f0fb', color: '#3a7bd5' }}>
            Select All
          </button>
          <button
            onClick={handleDeselectAll}
            className="px-3 py-1.5 text-xs font-medium rounded-lg transition-all"
            style={{ background: '#f8f9fc', color: '#4a5a6a', border: '1px solid #e6ecf5' }}>
            Deselect All
          </button>
        </div>
      </div>

      {/* All Slots - List View */}
      <div className="bg-[#f8f9fc] rounded-xl border border-[#e6ecf5] p-5">
        <div className="mb-4">
          <h3 className="text-sm font-semibold text-[#1a2a3a]">📋 All 24 Available Slots</h3>
          <p className="text-xs text-[#8a9ab0] mt-1">Toggle each slot to set availability. Morning (8 AM - 12 PM) | Lunch (12-1 PM - unavailable) | Afternoon (1 PM - 9 PM)</p>
        </div>

        {/* Morning Slots */}
        <div className="mb-6">
          <div className="text-xs font-semibold text-[#1a2a3a] mb-3 px-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#3a7bd5' }} />
            Morning (8:00 AM - 12:00 PM) - {morningSlots.filter(s => s.isAvailable).length} / {morningSlots.length} available
          </div>
          <div className="space-y-2">
            {morningSlots.map(slot => (
              <button
                key={slot.slotNumber}
                onClick={() => handleToggleSlot(slot.slotNumber)}
                className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-between border hover:shadow-md"
                style={
                  slot.isAvailable
                    ? { background: '#e6f9f2', border: '1px solid #1a9e6a' }
                    : { background: '#ffffff', border: '1px solid #e6ecf5' }
                }>
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center min-w-[60px]">
                    <div className="text-xs font-bold text-[#1a2a3a]">Slot {slot.slotNumber}</div>
                    <div className="text-xs font-semibold text-[#3a7bd5]">{slot.displayTime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-medium px-3 py-1.5 rounded-full ${slot.isAvailable ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                    {slot.isAvailable ? '✓ Available' : '✕ Unavailable'}
                  </div>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: slot.isAvailable ? '#1a9e6a' : '#e6ecf5' }}>
                    {slot.isAvailable && <span style={{ color: 'white' }}>✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Lunch Break Info */}
        <div className="px-4 py-3 rounded-lg mb-6" style={{ background: '#fff8e6', border: '1px solid #ffd699' }}>
          <p className="text-xs font-medium text-[#b07a00]">🍽️ Lunch Break: 12:00 PM - 1:00 PM (Slots 9-10 - Always Unavailable)</p>
        </div>

        {/* Afternoon Slots */}
        <div>
          <div className="text-xs font-semibold text-[#1a2a3a] mb-3 px-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full" style={{ background: '#3a7bd5' }} />
            Afternoon & Evening (1:00 PM - 9:00 PM) - {afternoonSlots.filter(s => s.isAvailable).length} / {afternoonSlots.length} available
          </div>
          <div className="space-y-2">
            {afternoonSlots.map(slot => (
              <button
                key={slot.slotNumber}
                onClick={() => handleToggleSlot(slot.slotNumber)}
                className="w-full px-4 py-3 rounded-lg transition-all flex items-center justify-between border hover:shadow-md"
                style={
                  slot.isAvailable
                    ? { background: '#e6f9f2', border: '1px solid #1a9e6a' }
                    : { background: '#ffffff', border: '1px solid #e6ecf5' }
                }>
                <div className="flex items-center gap-3 flex-1">
                  <div className="text-center min-w-[60px]">
                    <div className="text-xs font-bold text-[#1a2a3a]">Slot {slot.slotNumber}</div>
                    <div className="text-xs font-semibold text-[#3a7bd5]">{slot.displayTime}</div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`text-xs font-medium px-3 py-1.5 rounded-full ${slot.isAvailable ? 'bg-[#d1fae5] text-[#065f46]' : 'bg-[#f3f4f6] text-[#6b7280]'}`}>
                    {slot.isAvailable ? '✓ Available' : '✕ Unavailable'}
                  </div>
                  <div className="w-5 h-5 rounded-lg flex items-center justify-center" style={{ background: slot.isAvailable ? '#1a9e6a' : '#e6ecf5' }}>
                    {slot.isAvailable && <span style={{ color: 'white' }}>✓</span>}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Save Button */}
      {changedCount > 0 && (
        <div className="flex items-center gap-3 pt-4 border-t border-[#e6ecf5]">
          <button
            onClick={handleSaveChanges}
            disabled={saving || !slots.some(s => s.isAvailable)}
            className="px-6 py-2.5 rounded-xl text-sm font-medium text-white transition-all duration-200 hover:-translate-y-px disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg, #3a7bd5, #2d5a8e)', boxShadow: '0 4px 12px rgba(58,123,213,0.25)' }}>
            {saving ? 'Saving...' : `Save Changes (${changedCount})`}
          </button>
          <button
            onClick={loadSlots}
            disabled={saving}
            className="px-4 py-2.5 rounded-xl text-sm font-medium text-[#4a5a6a] border border-[#e6ecf5] hover:bg-[#f8f9fc] transition-all disabled:opacity-50 disabled:cursor-not-allowed">
            Cancel
          </button>
          {!slots.some(s => s.isAvailable) && (
            <p className="text-xs text-[#f59e0b] font-medium">
              Select at least one slot to save
            </p>
          )}
        </div>
      )}

      {/* Info/Guidance section */}
      <div className="bg-blue-50 rounded-xl p-4 border border-[#bfdbfe]">
        <div className="space-y-2">
          <p className="text-xs text-[#1e40af] font-semibold">📖 How to set up your schedule:</p>
          <ol className="text-xs text-[#1e40af] space-y-1 ml-4 list-decimal">
            <li>Select slots you want to be <strong>available</strong> (green)</li>
            <li>Slots you don't select stay <strong>unavailable</strong> (gray)</li>
            <li>Save your changes</li>
            <li>Patients can only book during your <strong>available slots</strong></li>
          </ol>
          <p className="text-xs text-[#1e40af] mt-3">
            <strong>Tip:</strong> Use "Select All" to quickly make all slots available, then deselect the ones you prefer not to work.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScheduleManager;
