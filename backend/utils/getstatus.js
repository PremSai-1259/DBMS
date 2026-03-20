const getSlotTime = require("./getslottime");

const getStatus = (date, slot_number) => {
  const time = getSlotTime(slot_number);

  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );

  const formattedDate = new Date(date).toISOString().split("T")[0];

  const slotStart = new Date(`${formattedDate}T${time.start}:00`);
  const slotEnd = new Date(`${formattedDate}T${time.end}:00`);

  if (now < slotStart) return "upcoming";
  if (now >= slotStart && now < slotEnd) return "running";
  return "completed";
};

module.exports = getStatus;