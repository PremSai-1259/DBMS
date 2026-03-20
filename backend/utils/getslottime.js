const getSlotTime = (slot) => {
  let startHour = 8;
  let totalMinutes = (slot - 1) * 30;

  let hour = startHour + Math.floor(totalMinutes / 60);
  let minutes = totalMinutes % 60;

  // Skip break (12–1)
  if (hour >= 12) hour += 1;

  let start = `${hour.toString().padStart(2, "0")}:${minutes === 0 ? "00" : minutes}`;

  // End time
  let endMinutes = totalMinutes + 30;
  let endHour = startHour + Math.floor(endMinutes / 60);
  let endMin = endMinutes % 60;

  if (endHour >= 12) endHour += 1;

  let end = `${endHour.toString().padStart(2, "0")}:${endMin === 0 ? "00" : endMin}`;

  return { start, end };
};

module.exports = getSlotTime;