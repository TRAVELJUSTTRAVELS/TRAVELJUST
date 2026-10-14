import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  X,
  Calendar as CalendarIcon,
  Check,
  Sparkles,
  Clock,
  Compass,
  Maximize2,
} from 'lucide-react';

interface CalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  maxDate?: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  title?: string;
  align?: 'left' | 'right';
  rangeStartDate?: string; // If this is Return Date, the Pickup Date
  rangeEndDate?: string;   // If this is Pickup Date, the Return Date
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  isOpen,
  onClose,
  selectedDate,
  minDate,
  maxDate,
  onSelectDate,
  title = 'Select Date',
  align = 'left',
  rangeStartDate,
  rangeEndDate,
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);
  const [hoveredDate, setHoveredDate] = useState<string | null>(null);

  // Format YYYY-MM-DD helper
  const formatToYMD = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  // Helper to get local date (zeroed hours)
  const getTodayLocal = () => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  };

  const today = getTodayLocal();
  const todayStr = formatToYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const effectiveMinStr = minDate || todayStr;

  // View mode: 'single' (1 month) or 'dual' (2 months full view)
  const [isDualMonth, setIsDualMonth] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return true;
  });

  // Calculate days difference between two dates in YYYY-MM-DD
  const getDaysDifference = (fromYmd: string, toYmd: string): number => {
    const fParts = fromYmd.split('-').map(Number);
    const tParts = toYmd.split('-').map(Number);
    const fUtc = Date.UTC(fParts[0], fParts[1] - 1, fParts[2]);
    const tUtc = Date.UTC(tParts[0], tParts[1] - 1, tParts[2]);
    return Math.round((tUtc - fUtc) / (1000 * 60 * 60 * 24));
  };

  // Parse YYYY-MM-DD safely into local Date object
  const parseDate = (dStr?: string) => {
    if (!dStr) return getTodayLocal();
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    const d = new Date(dStr);
    if (!isNaN(d.getTime())) {
      return new Date(d.getFullYear(), d.getMonth(), d.getDate());
    }
    return getTodayLocal();
  };

  const initialDate = parseDate(selectedDate || effectiveMinStr);
  const [{ year: viewYear, month: viewMonth }, setViewState] = useState<{ year: number; month: number }>(() => ({
    year: initialDate.getFullYear(),
    month: initialDate.getMonth(),
  }));

  // Toggle quick month / year selector
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);

  // Sync view when opened or selectedDate changes
  useEffect(() => {
    if (isOpen) {
      const d = parseDate(selectedDate || effectiveMinStr);
      setViewState({
        year: d.getFullYear(),
        month: d.getMonth(),
      });
      setShowMonthYearPicker(false);
      setHoveredDate(null);
    }
  }, [isOpen, selectedDate, effectiveMinStr]);

  // Click outside listener
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      const target = e.target as HTMLElement | null;
      if (!popoverRef.current || !target) return;

      // Click inside popover
      if (popoverRef.current.contains(target)) return;

      // Allow trigger container to handle click toggle
      const triggerBox = popoverRef.current.parentElement;
      if (triggerBox && triggerBox.contains(target)) {
        return;
      }

      onClose();
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Minimum year & month bounds
  const minDateParts = effectiveMinStr.split('-').map(Number);
  const minYear = minDateParts[0] || today.getFullYear();
  const minMonth = (minDateParts[1] || today.getMonth() + 1) - 1;

  // Month navigation
  const prevMonth = () => {
    setViewState((curr) => {
      if (curr.month === 0) {
        return { year: curr.year - 1, month: 11 };
      }
      return { year: curr.year, month: curr.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewState((curr) => {
      if (curr.month === 11) {
        return { year: curr.year + 1, month: 0 };
      }
      return { year: curr.year, month: curr.month + 1 };
    });
  };

  // Next month in sequence for 2-month full view
  const nextMonthYear = viewMonth === 11 ? viewYear + 1 : viewYear;
  const nextMonthMonth = viewMonth === 11 ? 0 : viewMonth + 1;

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const monthShortNames = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const daysOfWeek = [
    { label: 'Su', isWeekend: true, full: 'Sunday' },
    { label: 'Mo', isWeekend: false, full: 'Monday' },
    { label: 'Tu', isWeekend: false, full: 'Tuesday' },
    { label: 'We', isWeekend: false, full: 'Wednesday' },
    { label: 'Th', isWeekend: false, full: 'Thursday' },
    { label: 'Fr', isWeekend: false, full: 'Friday' },
    { label: 'Sa', isWeekend: true, full: 'Saturday' },
  ];

  // Check if prev month is disabled
  const isPrevDisabled =
    viewYear < minYear || (viewYear === minYear && viewMonth <= minMonth);

  // Formatted date preview
  const formatFriendlyPreview = (dStr: string) => {
    try {
      const parts = dStr.split('-').map(Number);
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } catch {
      // fallback
    }
    return dStr;
  };

  // Compute smart shortcut options
  interface ShortcutOption {
    label: string;
    sublabel?: string;
    dateStr: string;
    badge?: string;
  }

  const shortcuts: ShortcutOption[] = [];

  // If this is Return Date with a specific pickup date (rangeStartDate)
  if (rangeStartDate && rangeStartDate >= todayStr) {
    const baseDate = parseDate(rangeStartDate);

    // Same day return
    shortcuts.push({
      label: 'Same Day',
      sublabel: 'Day Trip',
      dateStr: rangeStartDate,
      badge: 'Quick',
    });

    // Next day (+1 day)
    const nextDay = new Date(baseDate);
    nextDay.setDate(nextDay.getDate() + 1);
    shortcuts.push({
      label: '+1 Day',
      sublabel: 'Overnight',
      dateStr: formatToYMD(nextDay.getFullYear(), nextDay.getMonth(), nextDay.getDate()),
    });
  } else {
    // Standard Pickup Date shortcuts relative to Today
    shortcuts.push({
      label: 'Today',
      sublabel: 'Instant',
      dateStr: todayStr,
    });

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    shortcuts.push({
      label: 'Tomorrow',
      dateStr: formatToYMD(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate()),
    });
  }

  // Calculate trip duration if in range mode (accounting for hover preview)
  const activeEffectiveDate = hoveredDate || selectedDate;
  let tripDurationDays: number | null = null;

  if (rangeStartDate && activeEffectiveDate && activeEffectiveDate >= rangeStartDate) {
    const sParts = rangeStartDate.split('-').map(Number);
    const eParts = activeEffectiveDate.split('-').map(Number);
    const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
    const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
    tripDurationDays = Math.floor((eUtc - sUtc) / (1000 * 60 * 60 * 24)) + 1;
  } else if (rangeEndDate && activeEffectiveDate && activeEffectiveDate <= rangeEndDate) {
    const sParts = activeEffectiveDate.split('-').map(Number);
    const eParts = rangeEndDate.split('-').map(Number);
    const sUtc = Date.UTC(sParts[0], sParts[1] - 1, sParts[2]);
    const eUtc = Date.UTC(eParts[0], eParts[1] - 1, eParts[2]);
    tripDurationDays = Math.floor((eUtc - sUtc) / (1000 * 60 * 60 * 24)) + 1;
  }

  // Check days away from today for early bird discount
  const targetDateDaysAway = getDaysDifference(todayStr, activeEffectiveDate);
  const qualifiesForEarlyDiscount = targetDateDaysAway >= 2;

  // Render a complete single month calendar grid
  const renderMonthSection = (year: number, month: number, isSecondMonth: boolean = false) => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInThisMonth = new Date(year, month + 1, 0).getDate();
    const daysInPreviousMonth = new Date(year, month, 0).getDate();

    // Calculate trailing days to complete full rectangular grid (min 35 days, or 42 days if spans 6 rows)
    const totalCellsFilled = firstDay + daysInThisMonth;
    const totalGridCells = totalCellsFilled > 35 ? 42 : 35;
    const trailingDaysCount = totalGridCells - totalCellsFilled;

    // Next month for trailing days
    const nextMYear = month === 11 ? year + 1 : year;
    const nextMMonth = month === 11 ? 0 : month + 1;

    return (
      <div className="flex-1 min-w-[300px]">
        {/* Month Title */}
        <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <span className="text-sm font-black text-slate-900 dark:text-white">
              {monthNames[month]} {year}
            </span>
            {isSecondMonth && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-[#00A878] dark:text-emerald-400">
                Next Month
              </span>
            )}
          </div>
        </div>

        {/* Day of Week Headers */}
        <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-black py-1.5 uppercase tracking-wider text-slate-400 dark:text-slate-500">
          {daysOfWeek.map((day) => (
            <div
              key={day.label}
              className={`py-0.5 ${
                day.isWeekend
                  ? 'text-[#00A878] dark:text-emerald-400 font-extrabold'
                  : 'text-slate-400 dark:text-slate-500 font-bold'
              }`}
              title={day.full}
            >
              {day.label}
            </div>
          ))}
        </div>

        {/* Days Grid */}
        <div
          className="grid grid-cols-7 gap-y-1 text-center text-xs pt-1 select-none"
          onMouseLeave={() => setHoveredDate(null)}
        >
          {/* Previous Month Trailing Days */}
          {Array.from({ length: firstDay }).map((_, i) => {
            const prevDayNum = daysInPreviousMonth - firstDay + i + 1;
            return (
              <div
                key={`prev-${i}`}
                className="h-9 w-9 mx-auto flex items-center justify-center text-slate-300 dark:text-slate-700 text-xs font-medium opacity-30 select-none pointer-events-none"
              >
                {prevDayNum}
              </div>
            );
          })}

          {/* Current Month Active Days */}
          {Array.from({ length: daysInThisMonth }).map((_, idx) => {
            const dayNum = idx + 1;
            const currentDayStr = formatToYMD(year, month, dayNum);
            const isPast = currentDayStr < effectiveMinStr || (maxDate ? currentDayStr > maxDate : false);
            const isSelected = selectedDate === currentDayStr;
            const isToday = currentDayStr === todayStr;

            // Days away for early bird offer indicator
            const daysAway = getDaysDifference(todayStr, currentDayStr);
            const hasEarlyBirdDot = !isPast && daysAway >= 2;

            // Range calculation with interactive hover preview
            const targetEndDate = hoveredDate || selectedDate;
            const isPickupAnchor = rangeStartDate === currentDayStr;
            const isReturnAnchor = rangeEndDate === currentDayStr;

            // Is day within the active connected ribbon
            const isInRange =
              rangeStartDate &&
              targetEndDate &&
              targetEndDate >= rangeStartDate &&
              currentDayStr >= rangeStartDate &&
              currentDayStr <= targetEndDate;

            const isRangeStart = rangeStartDate === currentDayStr;
            const isRangeEnd = targetEndDate === currentDayStr;
            const isRangeMiddle = isInRange && !isRangeStart && !isRangeEnd;

            // Day of week index
            const dayCol = (firstDay + idx) % 7;
            const isWeekend = dayCol === 0 || dayCol === 6;

            return (
              <div
                key={currentDayStr}
                className={`relative h-9 flex items-center justify-center ${
                  isInRange && !isPast ? 'bg-emerald-100/70 dark:bg-emerald-950/40' : ''
                } ${isRangeStart && isInRange ? 'rounded-l-2xl' : ''} ${
                  isRangeEnd && isInRange ? 'rounded-r-2xl' : ''
                }`}
              >
                <button
                  type="button"
                  disabled={isPast}
                  aria-label={`${monthNames[month]} ${dayNum}, ${year}${hasEarlyBirdDot ? ' - 10% Early Bird Discount available' : ''}`}
                  aria-selected={isSelected}
                  aria-current={isToday ? 'date' : undefined}
                  onMouseEnter={() => {
                    if (!isPast) {
                      setHoveredDate(currentDayStr);
                    }
                  }}
                  onClick={() => {
                    onSelectDate(currentDayStr);
                    onClose();
                  }}
                  className={`relative z-10 w-8.5 h-8.5 mx-auto flex flex-col items-center justify-center rounded-xl transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-gradient-to-br from-[#00A878] to-[#075441] text-white font-black shadow-md shadow-[#00A878]/30 ring-2 ring-[#00D99A] scale-105 active:scale-95'
                      : isPickupAnchor
                      ? 'bg-[#00A878] text-white font-black shadow-xs ring-2 ring-emerald-400/40 scale-102'
                      : isReturnAnchor
                      ? 'bg-[#00A878] text-white font-black shadow-xs ring-2 ring-emerald-400/40 scale-102'
                      : isPast
                      ? 'text-slate-300 dark:text-slate-700 cursor-not-allowed opacity-35'
                      : isToday
                      ? 'border-2 border-[#00A878] text-[#075441] dark:text-emerald-300 font-black hover:bg-emerald-100/60 dark:hover:bg-slate-800'
                      : isRangeMiddle
                      ? 'text-emerald-950 dark:text-emerald-200 font-extrabold hover:bg-emerald-200/80 dark:hover:bg-emerald-900/60'
                      : isWeekend
                      ? 'text-slate-900 dark:text-slate-100 font-bold hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#00A878]'
                      : 'text-slate-800 dark:text-slate-200 font-semibold hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#00A878] dark:hover:text-white'
                  }`}
                >
                  <span className="leading-none text-xs sm:text-[13px]">{dayNum}</span>

                  {/* Sub-label indicators */}
                  <div className="flex items-center gap-0.5 mt-0.5 leading-none">
                    {/* Today visual dot indicator */}
                    {isToday && !isSelected && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00A878] dark:bg-emerald-400" />
                    )}

                    {/* Early bird offer indicator dot */}
                    {hasEarlyBirdDot && !isSelected && !isToday && (
                      <span className="w-1 h-1 rounded-full bg-emerald-500/80 dark:bg-emerald-400/80" title="10% Early Bird Discount available" />
                    )}

                    {/* Anchor indicator label */}
                    {isPickupAnchor && !isSelected && (
                      <span className="text-[7px] leading-[7px] uppercase font-black text-emerald-200">
                        Pick
                      </span>
                    )}
                  </div>
                </button>
              </div>
            );
          })}

          {/* Next Month Trailing Days (Clickable to jump directly to next month!) */}
          {Array.from({ length: trailingDaysCount }).map((_, i) => {
            const nextDayNum = i + 1;
            const nextDayStr = formatToYMD(nextMYear, nextMMonth, nextDayNum);
            const isNextPast = nextDayStr < effectiveMinStr || (maxDate ? nextDayStr > maxDate : false);

            return (
              <div
                key={`next-${i}`}
                className="h-9 w-9 mx-auto flex items-center justify-center text-xs"
              >
                <button
                  type="button"
                  disabled={isNextPast}
                  onClick={() => {
                    onSelectDate(nextDayStr);
                    onClose();
                  }}
                  onMouseEnter={() => {
                    if (!isNextPast) setHoveredDate(nextDayStr);
                  }}
                  className={`w-7.5 h-7.5 rounded-lg flex items-center justify-center text-slate-400 dark:text-slate-600 font-medium transition-colors cursor-pointer hover:bg-emerald-50 dark:hover:bg-slate-800 hover:text-[#00A878] ${
                    isNextPast ? 'opacity-30 cursor-not-allowed' : ''
                  }`}
                  title={`Select ${monthNames[nextMMonth]} ${nextDayNum}`}
                >
                  {nextDayNum}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={`${title} - Full Month Calendar`}
      className={`absolute z-[100] top-full mt-2.5 bg-white/98 dark:bg-slate-900/98 backdrop-blur-md rounded-3xl shadow-2xl shadow-emerald-950/25 border border-slate-200/90 dark:border-slate-800 p-4 sm:p-5 transition-all animate-in fade-in-0 zoom-in-95 duration-200 text-slate-900 dark:text-slate-100 left-1/2 -translate-x-1/2 ${
        isDualMonth
          ? 'w-[340px] sm:w-[680px] lg:w-[730px] max-w-[calc(100vw-1.5rem)]'
          : 'w-[330px] sm:w-[370px] max-w-[calc(100vw-2rem)]'
      } ${
        align === 'right' ? 'sm:left-auto sm:right-0 sm:translate-x-0' : 'sm:left-0 sm:right-auto sm:translate-x-0'
      }`}
      onClick={(e) => e.stopPropagation()}
      onMouseDown={(e) => e.stopPropagation()}
      onTouchStart={(e) => e.stopPropagation()}
    >
      {/* Calendar Top Header: Icon + Title + Month-Year Nav + View Toggle */}
      <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-950/80 dark:to-teal-950/80 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-center text-emerald-800 dark:text-emerald-400 shrink-0 shadow-2xs">
            <CalendarIcon className="w-4.5 h-4.5 text-[#00A878] dark:text-emerald-400 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[11px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                {title}
              </h4>
              {tripDurationDays !== null && tripDurationDays > 0 && (
                <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[#00A878] text-white shadow-2xs flex items-center gap-1 animate-in fade-in duration-150">
                  <span>{tripDurationDays} {tripDurationDays === 1 ? 'Day' : 'Days'}</span>
                  {tripDurationDays > 1 && (
                    <span className="text-emerald-100 font-medium">({tripDurationDays - 1}N)</span>
                  )}
                </span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowMonthYearPicker(!showMonthYearPicker)}
              className="text-sm sm:text-[15px] font-black text-slate-900 dark:text-white hover:text-[#00A878] dark:hover:text-emerald-400 flex items-center gap-1.5 transition-colors cursor-pointer group text-left mt-0.5"
              title="Click to quickly switch month or year"
            >
              <span>{monthNames[viewMonth]} {viewYear}</span>
              <span className="text-xs text-slate-400 group-hover:text-[#00A878] dark:group-hover:text-emerald-400 transition-transform duration-200 group-hover:translate-y-0.5">
                ▾
              </span>
            </button>
          </div>
        </div>

        {/* Navigation Controls, View Toggle & Close */}
        <div className="flex items-center gap-1.5">
          {/* 1 Month vs 2 Months Full Calendar View Toggle */}
          <div className="hidden sm:flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-xl mr-1 text-[11px] font-bold">
            <button
              type="button"
              onClick={() => setIsDualMonth(false)}
              className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                !isDualMonth
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="View single month calendar"
            >
              1 Month
            </button>
            <button
              type="button"
              onClick={() => setIsDualMonth(true)}
              className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                isDualMonth
                  ? 'bg-[#00A878] text-white shadow-xs font-black'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
              }`}
              title="View full two months side-by-side"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Calendar</span>
            </button>
          </div>

          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className={`w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center justify-center transition-all ${
              isPrevDisabled
                ? 'opacity-30 cursor-not-allowed text-slate-400'
                : 'hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-300 text-slate-700 dark:text-slate-200 cursor-pointer active:scale-95 shadow-2xs'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="w-8 h-8 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-800 hover:border-emerald-300 text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all cursor-pointer active:scale-95 shadow-2xs"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-colors ml-0.5 cursor-pointer"
            aria-label="Close calendar"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Month & Year Fast Selector Grid Modal */}
      {showMonthYearPicker && (
        <div className="py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/90 dark:bg-slate-800/80 rounded-2xl px-3 my-2.5 animate-in fade-in-0 zoom-in-98 duration-150 shadow-inner">
          <div className="flex items-center justify-between mb-2.5 px-1">
            <span className="text-[11px] font-black text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Quick Month Jump
            </span>
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  setViewState((prev) => {
                    const nextYear = prev.year - 1;
                    const nextMonth = (nextYear === minYear && prev.month < minMonth) ? minMonth : prev.month;
                    return { year: nextYear, month: nextMonth };
                  });
                }}
                disabled={viewYear <= minYear}
                className="text-xs px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 disabled:opacity-30 hover:bg-white dark:hover:bg-slate-700 cursor-pointer font-bold text-slate-700 dark:text-slate-200"
              >
                -1 Yr
              </button>
              <span className="text-xs font-black text-[#00A878] dark:text-emerald-400 font-mono px-1">
                {viewYear}
              </span>
              <button
                type="button"
                onClick={() => setViewState((prev) => ({ ...prev, year: prev.year + 1 }))}
                className="text-xs px-2 py-0.5 rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-700 cursor-pointer font-bold text-slate-700 dark:text-slate-200"
              >
                +1 Yr
              </button>
            </div>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-1.5">
            {monthShortNames.map((mName, mIdx) => {
              const isPastMonth = viewYear < minYear || (viewYear === minYear && mIdx < minMonth);
              const isCurrView = viewMonth === mIdx;
              return (
                <button
                  key={mName}
                  type="button"
                  disabled={isPastMonth}
                  onClick={() => {
                    setViewState((prev) => ({ ...prev, month: mIdx }));
                    setShowMonthYearPicker(false);
                  }}
                  className={`text-xs py-2 rounded-xl font-bold transition-all cursor-pointer ${
                    isCurrView
                      ? 'bg-[#00A878] text-white shadow-xs scale-102'
                      : isPastMonth
                      ? 'text-slate-300 dark:text-slate-600 opacity-40 cursor-not-allowed'
                      : 'hover:bg-emerald-100/70 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200'
                  }`}
                >
                  {mName}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Return Date Visual Context Banner */}
      {rangeStartDate && (
        <div className="mt-3 px-3 py-2 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between text-xs text-emerald-950 dark:text-emerald-200">
          <span className="font-bold flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-[#00A878] dark:text-emerald-400 shrink-0" />
            <span>Pickup Date:</span>
          </span>
          <span className="font-extrabold font-mono text-emerald-900 dark:text-emerald-300">
            {formatFriendlyPreview(rangeStartDate)}
          </span>
        </div>
      )}



      {/* Quick Smart Shortcut Chips */}
      <div className="flex items-center gap-1.5 pt-2.5 pb-2 flex-wrap">
        {shortcuts.map((sc) => {
          const isScSelected = selectedDate === sc.dateStr;
          const isScDisabled = effectiveMinStr && sc.dateStr < effectiveMinStr;
          if (isScDisabled) return null;

          return (
            <button
              key={sc.label}
              type="button"
              onClick={() => {
                onSelectDate(sc.dateStr);
                onClose();
              }}
              onMouseEnter={() => setHoveredDate(sc.dateStr)}
              onMouseLeave={() => setHoveredDate(null)}
              className={`text-xs px-2.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                isScSelected
                  ? 'bg-[#00A878] text-white border-[#00A878] font-bold shadow-xs scale-102'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700 hover:bg-emerald-50 dark:hover:bg-slate-750 hover:text-[#00A878] hover:border-emerald-300 font-semibold'
              }`}
            >
              <span>{sc.label}</span>
              {sc.badge && (
                <span className={`text-[9px] font-extrabold px-1 py-0.2 rounded ${
                  isScSelected ? 'bg-emerald-900 text-emerald-100' : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/60 dark:text-emerald-300'
                }`}>
                  {sc.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Main Month Calendar Display (Single or Dual Side-by-Side View) */}
      <div className={`mt-2 ${isDualMonth ? 'flex flex-col md:flex-row gap-5' : 'flex flex-col'}`}>
        {/* Month 1 */}
        {renderMonthSection(viewYear, viewMonth, false)}

        {/* Month 2 (when in Full Calendar dual mode) */}
        {isDualMonth && (
          <div className="border-t md:border-t-0 md:border-l border-slate-100 dark:border-slate-800 pt-3 md:pt-0 md:pl-5 flex-1 min-w-[300px]">
            {renderMonthSection(nextMonthYear, nextMonthMonth, true)}
          </div>
        )}
      </div>

      {/* Calendar Bottom Bar: Preview & Done Action */}
      <div className="mt-3.5 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 text-xs text-slate-800 dark:text-slate-200">
            <Clock className="w-3.5 h-3.5 text-[#00A878] dark:text-emerald-400 shrink-0" />
            <span className="font-bold truncate">
              {formatFriendlyPreview(activeEffectiveDate)}
            </span>
          </div>
          {qualifiesForEarlyDiscount && (
            <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold flex items-center gap-1 mt-0.5">
              <Sparkles className="w-2.5 h-2.5" />
              <span>10% Early Booking discount applies</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Mobile toggle button if dual mode isn't shown */}
          <button
            type="button"
            onClick={() => setIsDualMonth(!isDualMonth)}
            className="sm:hidden text-xs text-[#00A878] font-bold px-2 py-1 rounded-lg hover:bg-emerald-50 dark:hover:bg-slate-800 cursor-pointer"
          >
            {isDualMonth ? '1 Month' : 'Full 2 Mo'}
          </button>

          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-[#00A878] to-[#075441] hover:from-[#009166] hover:to-[#054031] text-white text-xs font-bold transition-all shadow-sm shadow-[#00A878]/25 hover:shadow-md cursor-pointer active:scale-95 shrink-0"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Confirm Date</span>
          </button>
        </div>
      </div>
    </div>
  );
};
