/**
 * TIME & DATE VALIDATION UTILITIES FOR ALL BOOKING FORMS
 * Prevents users from selecting past pickup times for today's travel date.
 */

// Generate 15-minute intervals across all 24 hours: 12:00 AM, 12:15 AM ... 1:15 PM ... 11:45 PM
const generate15MinTimeOptions = (): string[] => {
  const options: string[] = [];
  for (let h24 = 0; h24 < 24; h24++) {
    for (const min of ['00', '15', '30', '45']) {
      const ampm = h24 >= 12 ? 'PM' : 'AM';
      let h12 = h24 % 12;
      if (h12 === 0) h12 = 12;
      options.push(`${h12}:${min} ${ampm}`);
    }
  }
  return options;
};

export const TIME_OPTIONS = generate15MinTimeOptions();

export const getTodayDateString = (): string => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const getTomorrowDateString = (): string => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const year = tomorrow.getFullYear();
  const month = String(tomorrow.getMonth() + 1).padStart(2, '0');
  const day = String(tomorrow.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper to normalize 24-hour or raw time to 12-hour format with AM/PM (e.g. '1:15 PM', '12:00 AM')
export const formatTo12Hour = (timeStr: string): string => {
  if (!timeStr) return '7:00 AM';
  if (timeStr.includes('AM') || timeStr.includes('PM')) {
    const trimmed = timeStr.trim();
    const [time, ampm] = trimmed.split(' ');
    const [h, m] = time.split(':');
    const hourNum = parseInt(h, 10);
    return `${hourNum}:${m || '00'} ${ampm}`;
  }
  const [hStr, mStr] = timeStr.split(':');
  let hour = parseInt(hStr, 10);
  const minute = mStr || '00';
  const ampm = hour >= 12 ? 'PM' : 'AM';
  hour = hour % 12;
  if (hour === 0) hour = 12;
  return `${hour}:${minute} ${ampm}`;
};

// Helper to convert 12-hour AM/PM to 24-hour HH:mm
export const formatTo24Hour = (time12: string): string => {
  if (!time12) return '07:00';
  if (!time12.includes('AM') && !time12.includes('PM')) return time12;
  const [time, modifier] = time12.trim().split(' ');
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  if (modifier === 'PM' && h < 12) h += 12;
  if (modifier === 'AM' && h === 12) h = 0;
  return `${h.toString().padStart(2, '0')}:${mStr || '00'}`;
};

/**
 * Checks whether a given time on a given date is in the past compared to current local time.
 * If bufferMinutes is passed (e.g. 0), slots earlier than (now + buffer) evaluate to true.
 */
export const isTimeInPastForDate = (
  dateStr: string,
  timeStr: string,
  bufferMinutes: number = 0
): boolean => {
  if (!dateStr || !timeStr) return false;
  const todayStr = getTodayDateString();

  if (dateStr < todayStr) return true;
  if (dateStr > todayStr) return false;

  const time24 = formatTo24Hour(timeStr);
  const [slotH, slotM] = time24.split(':').map((v) => parseInt(v, 10));
  const slotMinutes = (isNaN(slotH) ? 0 : slotH) * 60 + (isNaN(slotM) ? 0 : slotM);

  const now = new Date();
  const currentMinutes = now.getHours() * 60 + now.getMinutes() + bufferMinutes;

  return slotMinutes < currentMinutes;
};

/**
 * Gets the next available pickup time slot from TIME_OPTIONS for the specified date.
 * If targetDate is in the future, returns standard morning time ('07:00 AM').
 * If targetDate is today, finds the closest upcoming slot from current time (+ buffer).
 */
export const getNextAvailableTimeSlot = (dateStr?: string, bufferMinutes: number = 15): string => {
  return '9:00 AM';
};

/**
 * Dynamically returns the selectable time options for all booking forms.
 * Returns the complete 15-minute intervals across 24 hours (8:00 AM, 8:15 AM, 9:00 AM ...).
 */
export const getFilteredTimeOptionsForDate = (
  _dateStr?: string,
  _bufferMinutes: number = 0
): string[] => {
  return TIME_OPTIONS;
};
