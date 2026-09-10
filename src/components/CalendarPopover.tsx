import React, { useState, useEffect, useRef } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

interface CalendarPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  selectedDate: string; // YYYY-MM-DD
  minDate?: string; // YYYY-MM-DD
  onSelectDate: (date: string) => void;
  title?: string;
  align?: 'left' | 'right';
}

export const CalendarPopover: React.FC<CalendarPopoverProps> = ({
  isOpen,
  onClose,
  selectedDate,
  minDate,
  onSelectDate,
  title = 'Select Date',
  align = 'left',
}) => {
  const popoverRef = useRef<HTMLDivElement>(null);

  // Parse selected date or today
  const parseDate = (dStr?: string) => {
    if (!dStr) return new Date();
    const parts = dStr.split('-').map(Number);
    if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
      return new Date(parts[0], parts[1] - 1, parts[2]);
    }
    return new Date();
  };

  const initialDate = parseDate(selectedDate);
  const [viewYear, setViewYear] = useState<number>(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState<number>(initialDate.getMonth()); // 0-indexed

  // When opened or selectedDate changes, sync view
  useEffect(() => {
    if (isOpen) {
      const d = parseDate(selectedDate);
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [isOpen, selectedDate]);

  // Click outside to close
  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Month navigation
  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  // Days in current view month
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const minDateObj = minDate ? parseDate(minDate) : null;
  if (minDateObj) {
    minDateObj.setHours(0, 0, 0, 0);
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const formatToYMD = (year: number, month: number, day: number) => {
    const mm = String(month + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    return `${year}-${mm}-${dd}`;
  };

  const todayStr = formatToYMD(today.getFullYear(), today.getMonth(), today.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = formatToYMD(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate());

  // Check if prev month is allowed based on minDate
  const isPrevDisabled = minDateObj
    ? viewYear < minDateObj.getFullYear() ||
      (viewYear === minDateObj.getFullYear() && viewMonth <= minDateObj.getMonth())
    : false;

  return (
    <div
      ref={popoverRef}
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className={`absolute z-50 top-full mt-2 bg-white rounded-2xl shadow-2xl border border-slate-200/90 p-3.5 sm:p-4 w-[290px] sm:w-[310px] transition-all animate-in fade-in-0 zoom-in-95 duration-150 ${
        align === 'right' ? 'right-0' : 'left-0'
      }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
        <div>
          <h4 className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wider">{title}</h4>
          <p className="text-sm font-bold text-slate-800">
            {monthNames[viewMonth]} {viewYear}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            disabled={isPrevDisabled}
            className={`p-1.5 rounded-lg border border-slate-200 transition-colors ${
              isPrevDisabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-slate-100 text-slate-700'
            }`}
            aria-label="Previous month"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700 transition-colors"
            aria-label="Next month"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors ml-0.5"
            aria-label="Close calendar"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Quick shortcuts */}
      <div className="flex items-center gap-2 pt-2 pb-1.5">
        {(!minDate || todayStr >= minDate) && (
          <button
            type="button"
            onClick={() => {
              onSelectDate(todayStr);
              onClose();
            }}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
              selectedDate === todayStr
                ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
            }`}
          >
            Today
          </button>
        )}
        {(!minDate || tomorrowStr >= minDate) && (
          <button
            type="button"
            onClick={() => {
              onSelectDate(tomorrowStr);
              onClose();
            }}
            className={`text-[11px] px-2.5 py-0.5 rounded-full border transition-all ${
              selectedDate === tomorrowStr
                ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-emerald-50 hover:text-emerald-800 hover:border-emerald-200'
            }`}
          >
            Tomorrow
          </button>
        )}
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-1 text-center text-[11px] font-semibold text-slate-400 py-1">
        {daysOfWeek.map((day) => (
          <div key={day} className="py-0.5">
            {day}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 text-center text-xs pt-0.5">
        {/* Empty slots for offset */}
        {Array.from({ length: firstDayOfWeek }).map((_, i) => (
          <div key={`empty-${i}`} className="h-7 w-7" />
        ))}

        {/* Days in month */}
        {Array.from({ length: daysInMonth }).map((_, idx) => {
          const dayNum = idx + 1;
          const currentDayStr = formatToYMD(viewYear, viewMonth, dayNum);
          const currentDayDate = new Date(viewYear, viewMonth, dayNum);
          currentDayDate.setHours(0, 0, 0, 0);

          const isPast = minDateObj ? currentDayDate < minDateObj : currentDayDate < today;
          const isSelected = selectedDate === currentDayStr;
          const isToday = currentDayStr === todayStr;

          return (
            <button
              key={currentDayStr}
              type="button"
              disabled={isPast}
              onClick={() => {
                onSelectDate(currentDayStr);
                onClose();
              }}
              className={`h-7 w-7 mx-auto flex items-center justify-center text-xs rounded-lg transition-all ${
                isSelected
                  ? 'bg-emerald-700 text-white font-bold shadow-sm ring-1 ring-emerald-600'
                  : isPast
                  ? 'text-slate-300 cursor-not-allowed opacity-40'
                  : isToday
                  ? 'border border-emerald-600 text-emerald-800 font-semibold hover:bg-emerald-50'
                  : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900 font-medium'
              }`}
            >
              {dayNum}
            </button>
          );
        })}
      </div>
    </div>
  );
};
