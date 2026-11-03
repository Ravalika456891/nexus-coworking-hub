'use client';

import React, { useState } from 'react';
import {
  X,
  Calendar,
  Clock,
  Users,
  ExternalLink,
  Check,
  CheckCircle2,
  AlertCircle,
  Download,
  Sparkles
} from 'lucide-react';
import { Room } from '../types/meetingRooms';

interface BookingModalProps {
  room: Room;
  selectedDate: string;
  selectedTime: string;
  selectedPeople: number;
  onClose: () => void;
  onConfirm: (title: string) => void;
}

const TIME_SLOTS_30MIN = [
  '08:00 AM', '08:30 AM', '09:00 AM', '09:30 AM',
  '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM',
  '12:00 PM', '12:30 PM', '01:00 PM', '01:30 PM',
  '02:00 PM', '02:30 PM', '03:00 PM', '03:30 PM',
  '04:00 PM', '04:30 PM', '05:00 PM', '05:30 PM',
  '06:00 PM', '06:30 PM', '07:00 PM', '07:30 PM'
];

function timeStrToMinutes(str: string): number {
  if (!str) return 0;
  const parts = str.trim().split(/\s+/);
  const time = parts[0];
  const ampm = (parts[1] || '').toUpperCase();
  const [hStr, mStr] = time.split(':');
  let h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  if (ampm === 'PM' && h < 12) h += 12;
  if (ampm === 'AM' && h === 12) h = 0;
  return h * 60 + m;
}

function minutesToTimeStr(totalMins: number): string {
  let h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

export default function BookingModal({
  room,
  selectedDate,
  selectedTime,
  selectedPeople,
  onClose,
  onConfirm
}: BookingModalProps) {
  const [step, setStep] = useState<'slots' | 'details' | 'success'>('slots');
  const [date, setDate] = useState<string>(selectedDate === 'Today' ? '2026-10-31' : selectedDate || '2026-10-31');
  const [duration, setDuration] = useState<number>(1.0);
  const [startTime, setStartTime] = useState<string>('10:00 AM');
  const [attendees, setAttendees] = useState<number>(Math.min(selectedPeople || 4, room.capacity));
  const [title, setTitle] = useState<string>(`Strategy Sync (${room.name})`);
  const [purpose, setPurpose] = useState<string>('Team Sync & Collaboration');
  const [notes, setNotes] = useState<string>('');
  const [syncGoogleCalendar, setSyncGoogleCalendar] = useState<boolean>(true);
  const [confirmedResId, setConfirmedResId] = useState<string>('');

  const hourlyRate = parseInt((room.rate || '').replace(/[^0-9]/g, ''), 10) || 2000;
  const estimatedPrice = Math.round(hourlyRate * duration);

  const startMin = timeStrToMinutes(startTime);
  const endMin = startMin + Math.round(duration * 60);
  const endTimeStr = minutesToTimeStr(endMin);

  // Mock slot availability logic (e.g. 03:30 PM is reserved in Collaboration room)
  const getSlotAvailability = (slot: string) => {
    const sMin = timeStrToMinutes(slot);
    const reqEnd = sMin + Math.round(duration * 60);
    if (reqEnd > 1200) {
      return { available: false, label: 'Exceeds Hours', conflict: true };
    }
    if (room.name.includes('Collaboration') && (slot === '03:30 PM' || slot === '04:00 PM' || slot === '04:30 PM')) {
      return { available: false, label: 'Occupied', booked: true };
    }
    if (room.name.includes('Pitch') && (slot === '11:00 AM' || slot === '11:30 AM')) {
      return { available: false, label: 'Occupied', booked: true };
    }
    return { available: true, label: 'Available' };
  };

  const handleSelectDuration = (newDur: number) => {
    setDuration(newDur);
    const availability = getSlotAvailability(startTime, newDur);
    if (!availability.available) {
      const firstAvailable = TIME_SLOTS_30MIN.find((s) => getSlotAvailability(s, newDur).available);
      if (firstAvailable) {
        setStartTime(firstAvailable);
      }
    }
  };

  const getGoogleCalendarUrl = () => {
    const dStr = (date === 'Today' ? '2026-10-31' : date === 'Tomorrow' ? '2026-11-01' : date).replace(/-/g, '');
    const startH = String(Math.floor(startMin / 60)).padStart(2, '0');
    const startM = String(startMin % 60).padStart(2, '0');
    const endH = String(Math.floor(endMin / 60)).padStart(2, '0');
    const endM = String(endMin % 60).padStart(2, '0');

    const startIso = `${dStr}T${startH}${startM}00`;
    const endIso = `${dStr}T${endH}${endM}00`;

    const textParam = encodeURIComponent(`${title} • ${room.name}`);
    const detailsParam = encodeURIComponent(
      `NEXUS HUB Reservation: ${room.name} (${room.type})\nAttendees: ${attendees}\nDuration: ${duration} hours\nNotes: ${notes || 'Standard AV equipment and WiFi included.'}`
    );
    const locParam = encodeURIComponent(`${room.name}, Ground Floor East Wing, NEXUS HUB Campus`);

    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${textParam}&dates=${startIso}/${endIso}&details=${detailsParam}&location=${locParam}`;
  };

  const handleDownloadIcs = () => {
    const dStr = (date === 'Today' ? '20261031' : date === 'Tomorrow' ? '20261101' : date.replace(/-/g, ''));
    const startH = String(Math.floor(startMin / 60)).padStart(2, '0');
    const startM = String(startMin % 60).padStart(2, '0');
    const endH = String(Math.floor(endMin / 60)).padStart(2, '0');
    const endM = String(endMin % 60).padStart(2, '0');

    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//NEXUS HUB//Meeting Room Reservation//EN',
      'CALSCALE:GREGORIAN',
      'METHOD:PUBLISH',
      'BEGIN:VEVENT',
      `UID:${confirmedResId || Date.now()}@nexushub.co`,
      `DTSTAMP:${dStr}T000000Z`,
      `DTSTART:${dStr}T${startH}${startM}00`,
      `DTEND:${dStr}T${endH}${endM}00`,
      `SUMMARY:${title} - ${room.name}`,
      `DESCRIPTION:${notes || 'NEXUS HUB Meeting Reservation'}`,
      `LOCATION:${room.name}, NEXUS HUB Campus`,
      'STATUS:CONFIRMED',
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus-${(confirmedResId || 'booking').toLowerCase()}.ics`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSlotStatus.available) return;
    const resId = `RES-2026-${Math.floor(1000 + Math.random() * 9000)}`;
    setConfirmedResId(resId);
    setStep('success');
    onConfirm(title.trim() || `Strategy Sync (${room.name})`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden flex justify-end animate-fadeIn">
      {/* Backdrop */}
      <div onClick={onClose} className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity" />

      {/* Drawer */}
      <div className="relative w-full sm:max-w-xl md:max-w-2xl bg-white h-full shadow-2xl flex flex-col z-10 animate-slideLeft overflow-hidden">
        {/* Header Photo */}
        <div className="relative h-44 sm:h-48 w-full flex-shrink-0 overflow-hidden bg-gray-900">
          <img
            src={room.image}
            alt={room.name}
            className="w-full h-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />

          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 w-9 h-9 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-sm text-white flex items-center justify-center transition-all z-20"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-3 left-4 right-4 text-white z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-[#4F3FE0] text-white uppercase tracking-wider">
                {room.type}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-[10.5px] font-bold bg-emerald-500 text-white flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                Live Available
              </span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black">{room.name}</h2>
            <div className="flex items-center gap-3 text-xs text-gray-200 mt-1 font-medium">
              <span>👥 Up to {room.capacity} people</span>
              <span>•</span>
              <span className="text-yellow-300 font-bold">{room.rate}</span>
              <span>•</span>
              <span>Ground Floor East Wing</span>
            </div>
          </div>
        </div>

        {/* Steps Tab Bar */}
        <div className="flex border-b border-[#ECEEF4] bg-[#F8FAFC] text-xs font-bold text-center flex-shrink-0">
          <button
            type="button"
            onClick={() => step !== 'success' && setStep('slots')}
            className={`flex-1 py-3 border-b-2 transition-all ${
              step === 'slots'
                ? 'border-[#4F3FE0] text-[#4F3FE0] bg-white'
                : 'border-transparent text-[#64748B] hover:text-[#111827]'
            }`}
          >
            1. Time &amp; Slots
          </button>
          <button
            type="button"
            onClick={() => {
              if (currentSlotStatus.available) setStep('details');
            }}
            className={`flex-1 py-3 border-b-2 transition-all ${
              step === 'details'
                ? 'border-[#4F3FE0] text-[#4F3FE0] bg-white'
                : 'border-transparent text-[#64748B]'
            }`}
          >
            2. Meeting Details &amp; Sync
          </button>
          <button
            type="button"
            disabled={step !== 'success'}
            className={`flex-1 py-3 border-b-2 transition-all ${
              step === 'success'
                ? 'border-emerald-600 text-emerald-600 bg-white'
                : 'border-transparent text-[#A0A6B8] cursor-not-allowed'
            }`}
          >
            3. Confirmation
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {/* STEP 1: SLOTS */}
          {step === 'slots' && (
            <div className="space-y-5">
              {/* Date */}
              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-2">
                  Select Reservation Date
                </label>
                <div className="grid grid-cols-3 gap-2 mb-2">
                  {[
                    { label: 'Today (31 Oct)', val: '2026-10-31' },
                    { label: 'Tomorrow (01 Nov)', val: '2026-11-01' },
                    { label: 'Monday (03 Nov)', val: '2026-11-03' }
                  ].map((d) => (
                    <button
                      key={d.val}
                      type="button"
                      onClick={() => setDate(d.val)}
                      className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        date === d.val
                          ? 'bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs'
                          : 'bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white'
                      }`}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-2 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3 py-2 text-xs">
                  <span className="text-[#64748B] font-medium">Or pick any date:</span>
                  <input
                    type="date"
                    min="2026-10-31"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="bg-transparent font-bold text-[#111827] outline-none cursor-pointer flex-1 text-right"
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                    Booking Duration
                  </label>
                  <span className="text-[11px] font-bold text-[#4F3FE0]">
                    {duration} hrs selected
                  </span>
                </div>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { label: '30m', val: 0.5 },
                    { label: '1hr', val: 1.0 },
                    { label: '1.5hrs', val: 1.5 },
                    { label: '2hrs', val: 2.0 },
                    { label: '3hrs', val: 3.0 }
                  ].map((dur) => (
                    <button
                      key={dur.label}
                      type="button"
                      onClick={() => handleSelectDuration(dur.val)}
                      className={`py-2 rounded-xl text-xs font-bold border transition-all text-center ${
                        duration === dur.val
                          ? 'bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-xs ring-1 ring-[#4F3FE0]'
                          : 'bg-[#F8FAFC] border-[#ECEEF4] text-[#374151] hover:bg-white hover:border-[#CBD5E1]'
                      }`}
                    >
                      {dur.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 30-Min Availability Grid */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                      Real-Time Availability Slots
                    </label>
                    <p className="text-[11px] text-[#8A90A2]">30-minute intervals • Overlap prevention active</p>
                  </div>
                  <div className="flex items-center gap-2 text-[10px] font-semibold text-[#64748B]">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Free
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-[#4F3FE0]" /> Selected
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-gray-400" /> Booked
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 max-h-56 overflow-y-auto p-1 border border-[#ECEEF4] rounded-2xl bg-[#FAFAFC]">
                  {TIME_SLOTS_30MIN.map((slot) => {
                    const status = getSlotAvailability(slot);
                    const isSelected = startTime === slot;

                    if (status.booked) {
                      return (
                        <div
                          key={slot}
                          className="p-2.5 rounded-xl border border-gray-200 bg-gray-100 text-gray-400 text-center cursor-not-allowed select-none opacity-70"
                        >
                          <div className="text-xs font-bold line-through">{slot}</div>
                          <div className="text-[10px] font-semibold text-gray-500 mt-0.5">🔒 Booked</div>
                        </div>
                      );
                    }

                    if (status.conflict) {
                      return (
                        <div
                          key={slot}
                          className="p-2.5 rounded-xl border border-amber-200 bg-amber-50 text-amber-700 text-center cursor-not-allowed select-none"
                        >
                          <div className="text-xs font-bold">{slot}</div>
                          <div className="text-[9.5px] font-semibold text-amber-600 mt-0.5">Too short</div>
                        </div>
                      );
                    }

                    return (
                      <button
                        key={slot}
                        type="button"
                        onClick={() => setStartTime(slot)}
                        className={`p-2.5 rounded-xl border text-center transition-all ${
                          isSelected
                            ? 'bg-[#4F3FE0] text-white border-[#4F3FE0] shadow-md ring-2 ring-[#4F3FE0]/25'
                            : 'bg-white border-[#ECEEF4] text-[#111827] hover:border-[#4F3FE0] hover:bg-[#F4F2FF]'
                        }`}
                      >
                        <div className="text-xs font-bold">{slot}</div>
                        <div
                          className={`text-[10px] font-semibold mt-0.5 ${
                            isSelected ? 'text-purple-100' : 'text-emerald-600'
                          }`}
                        >
                          {isSelected ? '★ Selected' : '✓ Available'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Window Callout */}
              <div className="p-3.5 bg-[#F4F2FF] border border-[#E0D8FF] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <span className="text-[#8A90A2] font-semibold block text-[11px]">Selected Time Window:</span>
                  <span className="font-extrabold text-[#4F3FE0] text-sm">
                    {date} • {startTime} – {endTimeStr}
                  </span>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-white text-[#4F3FE0] font-bold shadow-xs border border-[#E0D8FF] text-[11px]">
                  {duration} hrs
                </span>
              </div>

              {/* Price & Credits Summary */}
              <div className="p-4 bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl space-y-2 text-xs">
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Hourly Rate:</span>
                  <strong className="text-[#111827] font-bold">₹{hourlyRate.toLocaleString()}/hour</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Duration:</span>
                  <strong className="text-[#111827] font-bold">{duration} hour(s)</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Estimated Room Value:</span>
                  <strong className="text-[#111827] font-bold">₹{estimatedPrice.toLocaleString()}</strong>
                </div>
                <div className="flex items-center justify-between text-[#64748B]">
                  <span>Startup Incubation Quota:</span>
                  <span className="text-emerald-600 font-bold">Covered by Startup Plan</span>
                </div>
                <div className="pt-2 border-t border-[#ECEEF4] flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-[#8A90A2]">Credit Impact:</div>
                    <div className="font-bold text-[#111827] text-xs">-{duration} cr (111.5 cr left)</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#8A90A2]">Net Payable</div>
                    <div className="text-base font-black text-emerald-600">₹0 (100% Free)</div>
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={!currentSlotStatus.available}
                  onClick={() => setStep('details')}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-all flex items-center gap-1.5 ${
                    currentSlotStatus.available
                      ? 'bg-[#4F3FE0] hover:bg-[#4335C9] active:scale-95'
                      : 'bg-gray-300 cursor-not-allowed'
                  }`}
                >
                  <span>Continue to Details</span>
                  <span>&rarr;</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: DETAILS & GOOGLE CALENDAR */}
          {step === 'details' && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="p-3 bg-[#F4F2FF] border border-[#E0D8FF] rounded-xl flex items-center justify-between text-xs">
                <div>
                  <div className="font-bold text-[#4F3FE0]">{room.name}</div>
                  <div className="text-[11px] text-[#64748B]">
                    {date} • {startTime} – {endTimeStr} ({duration} hrs)
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep('slots')}
                  className="text-[11px] font-bold text-[#4F3FE0] hover:underline"
                >
                  Change Slot
                </button>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-1">
                  Meeting Title <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Client Strategy & Demo Session"
                  className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-1">
                  Meeting Purpose
                </label>
                <select
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
                >
                  <option value="Team Sync & Collaboration">Team Sync &amp; Collaboration</option>
                  <option value="Client Pitch & Presentation">Client Pitch &amp; Presentation</option>
                  <option value="Board & Executive Meeting">Board &amp; Executive Meeting</option>
                  <option value="Sprint Planning & Demo">Sprint Planning &amp; Demo</option>
                  <option value="Investor Review">Investor Review</option>
                  <option value="Interview & Recruiting">Interview &amp; Recruiting</option>
                </select>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-black uppercase tracking-wider text-[#111827]">
                    Number of Attendees
                  </label>
                  <span className="text-[11px] text-[#8A90A2]">
                    Max Capacity: {room.capacity} seats
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setAttendees((prev) => Math.max(1, prev - 1))}
                    className="w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
                  >
                    -
                  </button>
                  <div className="flex-1 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl py-2 text-center text-sm font-black text-[#111827]">
                    {attendees} people
                  </div>
                  <button
                    type="button"
                    onClick={() => setAttendees((prev) => Math.min(room.capacity, prev + 1))}
                    className="w-9 h-9 rounded-xl border border-[#ECEEF4] bg-[#F8FAFC] hover:bg-white text-lg font-bold flex items-center justify-center text-[#111827]"
                  >
                    +
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-black uppercase tracking-wider text-[#111827] mb-1">
                  Notes / AV Requirements (Optional)
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Need 4K HDMI adapter and lapel microphone."
                  className="w-full bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-3 text-xs text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white"
                />
              </div>

              {/* Google Calendar Sync Card */}
              <div className="p-3.5 bg-gradient-to-r from-blue-50/70 to-indigo-50/70 border border-blue-200/80 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-white text-blue-600 flex items-center justify-center shadow-xs font-black text-sm">
                    📅
                  </div>
                  <div>
                    <div className="text-xs font-black text-[#111827]">Sync with Google Calendar</div>
                    <div className="text-[11px] text-[#64748B]">Auto-generates event with campus location link</div>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={syncGoogleCalendar}
                    onChange={(e) => setSyncGoogleCalendar(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-10 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#4F3FE0]"></div>
                </label>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[#ECEEF4]">
                <button
                  type="button"
                  onClick={() => setStep('slots')}
                  className="px-4 py-2.5 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  &larr; Back
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-black shadow-sm active:scale-95 transition-all flex items-center gap-2"
                >
                  <span>⚡ Confirm Reservation</span>
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 'success' && (
            <div className="py-4 text-center space-y-4 animate-scaleUp">
              <div className="w-16 h-16 rounded-full bg-emerald-50 text-emerald-600 border-2 border-emerald-200 flex items-center justify-center mx-auto text-2xl shadow-sm">
                ✓
              </div>
              <div>
                <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Reservation Confirmed
                </span>
                <h3 className="text-xl font-black text-[#111827] mt-1.5">{title}</h3>
                <p className="text-xs text-[#8A90A2]">
                  Reference Code: <strong className="font-mono text-[#111827]">#{confirmedResId}</strong>
                </p>
              </div>

              <div className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-2xl p-4 text-left text-xs space-y-2 max-w-md mx-auto">
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Room Facility:</span>
                  <strong className="text-[#111827]">{room.name}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Date &amp; Time:</span>
                  <strong className="text-[#111827]">{date} • {startTime} – {endTimeStr}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Duration:</span>
                  <strong className="text-[#111827]">{duration} hrs • {attendees} attendees</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Credit Deducted:</span>
                  <span className="text-emerald-600 font-bold">-{duration} cr (Incubation Quota)</span>
                </div>
              </div>

              {/* Google Calendar One-Click Sync */}
              <div className="p-4 bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl text-left max-w-md mx-auto space-y-2.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">📅</span>
                  <strong className="text-xs font-black text-[#111827]">Add to Your Calendar</strong>
                </div>
                <p className="text-[11px] text-[#64748B] leading-relaxed">
                  Sync this meeting to your schedule so your attendees receive notifications and campus location links.
                </p>
                <div className="flex items-center gap-2 pt-1">
                  <a
                    href={getGoogleCalendarUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-white hover:bg-blue-50 text-[#2B71FF] border border-blue-300 font-bold py-2 px-3 rounded-xl text-xs text-center shadow-xs flex items-center justify-center gap-1.5 transition-all"
                  >
                    <span>Google Calendar (1-Click)</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <button
                    type="button"
                    onClick={handleDownloadIcs}
                    className="bg-white hover:bg-gray-50 text-[#374151] border border-gray-300 font-bold py-2 px-3 rounded-xl text-xs shadow-xs transition-all"
                    title="Download iCal (.ics) file"
                  >
                    📥 .ICS
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-center gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2.5 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
