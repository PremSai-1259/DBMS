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
  const { showToast } = useToast();

  // Load slots for the selected date
  useEffect(() => {
    loadSlots();
  }, [selectedDate]);

  const loadSlots = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await scheduleService.getSlotsForDate(selectedDate);
      const loadedSlots = response?.data?.slots || [];
      
      if (!Array.isArray(loadedSlots) || loadedSlots.length === 0) {
        console.warn('No slots received from API', response);
        setError('No slots available for this date. Please try again.');
        setSlots([]);
      } else {
        setSlots(loadedSlots);
        setError(null);
      }
      setLocalChanges({});
      
      // Check if doctor has set any availability before on this date
      const hasAnyAvailable = loadedSlots.some(s => s.isAvailable);
      setHasSetupBefore(hasAnyAvailable);
    } catch (error) {
      console.error('Failed to load slots:', error);
      setError(`Failed to load schedule: ${error.message || 'Unknown error'}`);
      setSlots([]);
      showToast('Failed to load schedule', 'error');
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
    if (Object.keys(localChanges).length === 0) {
      showToast('No changes to save', 'warning');
      return;
    }

    // Check if at least one slot will be available after save
    const willHaveAvailable = slots.some(s => s.isAvailable);
    if (!willHaveAvailable) {
      showToast('Please set at least one slot as available before saving', 'warning');
      return;
    }

    setSaving(true);
    try {
      await scheduleService.updateMultipleSlots(selectedDate, localChanges);
      setLocalChanges({});
      
      // Update setup status
      setHasSetupBefore(true);
      
      const changedCount = Object.keys(localChanges).length;
      showToast(`✓ Schedule saved! ${changedCount} slot(s) updated.`, 'success');
    } catch (error) {
      console.error('Failed to save changes:', error);
      showToast('Failed to save schedule', 'error');
      // Reload to revert changes
      loadSlots();
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

  if (error) {
    return (
      <div className="w-full space-y-4">
        <div className="px-5 py-4 rounded-xl border-l-4 bg-red-50" style={{ borderLeft: '4px solid #e53e3e' }}>
          <div className="flex items-start gap-3">
            <span className="text-2xl flex-shrink-0">❌</span>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-[#c53030]">Error Loading Schedule</h4>
              <p className="text-xs text-[#9b2c2c] mt-1">{error}</p>
              <button
                onClick={loadSlots}
                className="mt-3 px-4 py-2 text-xs font-medium rounded-lg bg-[#e53e3e] text-white hover:bg-[#c53030] transition-all">
                Try Again
              </button>
            </div>
          </div>
        </div>
        <div className="text-center py-8">
          <p className="text-sm text-[#4a5a6a]">Please try refreshing the page or contact support if the problem persists.</p>
        </div>
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
              <p className="text-xs text-[#a16207] mt-1">The schedule data could not be loaded. This may be a database or server issue.</p>
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
