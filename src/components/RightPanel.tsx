'use client';

import React from 'react';
import {
  Calendar,
  FileText,
  Repeat,
  UserPlus,
  Users,
  MoreHorizontal
} from 'lucide-react';
import { TodayScheduleItem, UpcomingBooking } from '../types/meetingRooms';

interface RightPanelProps {
  todaysSchedule: TodayScheduleItem[];
  upcomingBookings: UpcomingBooking[];
  onBookRoomQuick: () => void;
  onMyBookingsQuick: () => void;
  onRecurringQuick: () => void;
  onInviteGuestsQuick: () => void;
  onViewCalendar: () => void;
  onViewAllUpcoming: () => void;
  onViewCreditDetails: () => void;
}

export default function RightPanel({
  todaysSchedule,
  upcomingBookings,
  onBookRoomQuick,
  onMyBookingsQuick,
  onRecurringQuick,
  onInviteGuestsQuick,
  onViewCalendar,
  onViewAllUpcoming,
  onViewCreditDetails
}: RightPanelProps) {
  return (
    <aside className="space-y-5 select-none">
      {/* ── Widget 1: Quick Actions (4-Column Tinted Tiles Grid) ── */}
      <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft">
        <h4 className="text-[13px] font-bold text-[#111827] mb-3">Quick Actions</h4>

        <div className="grid grid-cols-4 gap-2 text-center">
          {/* Purple: Book a Room */}
          <button
            type="button"
            onClick={onBookRoomQuick}
            className="bg-[#F3EFFE] hover:bg-[#EAE4FE] text-[#6E42E5] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
          >
            <Calendar className="w-5 h-5 text-[#6E42E5] group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] font-bold leading-tight">Book a Room</span>
          </button>

          {/* Blue: My Bookings */}
          <button
            type="button"
            onClick={onMyBookingsQuick}
            className="bg-[#EEF5FF] hover:bg-[#DFEDFF] text-[#2B71FF] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
          >
            <FileText className="w-5 h-5 text-[#2B71FF] group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] font-bold leading-tight">My Bookings</span>
          </button>

          {/* Green: Recurring */}
          <button
            type="button"
            onClick={onRecurringQuick}
            className="bg-[#EEFAF3] hover:bg-[#DEFAEA] text-[#12A150] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
          >
            <Repeat className="w-5 h-5 text-[#12A150] group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] font-bold leading-tight">Recurring</span>
          </button>

          {/* Orange: Invite Guests */}
          <button
            type="button"
            onClick={onInviteGuestsQuick}
            className="bg-[#FFF5EC] hover:bg-[#FFE8D5] text-[#F36B20] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5 transition-all group"
          >
            <UserPlus className="w-5 h-5 text-[#F36B20] group-hover:scale-110 transition-transform" />
            <span className="text-[10.5px] font-bold leading-tight">Invite Guests</span>
          </button>
        </div>
      </div>

      {/* ── Widget 2: Today's Schedule ── */}
      <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[13px] font-bold text-[#111827]">Today's Schedule</h4>
          <button
            type="button"
            onClick={onViewCalendar}
            className="text-xs font-semibold text-[#4F3FE0] hover:underline"
          >
            View Calendar
          </button>
        </div>

        {/* Timeline Entries */}
        <div className="space-y-2.5">
          {todaysSchedule.map((item, idx) => (
            <div key={item.id || idx} className="flex items-start gap-2.5 text-xs">
              {/* Time Column */}
              <div className="w-[84px] text-[10.5px] font-semibold text-[#8A90A2] pt-1 whitespace-nowrap leading-tight">
                {item.time.replace('–', '\n–')}
              </div>

              {/* Dot */}
              <div className="pt-2 flex flex-col items-center">
                <span className={`w-2 h-2 rounded-full ${item.dotColor} ring-4 ring-white shadow-xs`} />
              </div>

              {/* Card Info */}
              <div
                className={`flex-1 bg-[#F8FAFC] border border-[#ECEEF4] ${item.tintColor} rounded-xl p-2.5 transition-all hover:bg-gray-100`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-[#111827] text-[12px] truncate">{item.title}</span>
                  <button type="button" className="text-[#8A90A2] hover:text-[#111827]">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-[#64748B] mt-1">
                  <span>{item.room}</span>
                  <span className="inline-flex items-center gap-1 font-medium">
                    <Users className="w-3 h-3 text-[#8A90A2]" />
                    {item.attendees}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Widget 3: My Upcoming Bookings ── */}
      <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[13px] font-bold text-[#111827]">My Upcoming Bookings</h4>
          <button
            type="button"
            onClick={onViewAllUpcoming}
            className="text-xs font-semibold text-[#4F3FE0] hover:underline"
          >
            View All
          </button>
        </div>

        <div className="space-y-2.5">
          {upcomingBookings.map((bkg) => (
            <div
              key={bkg.id}
              className="flex items-center justify-between bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-2.5 hover:border-gray-300 transition-all text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Date & Time */}
                <div className="text-left leading-tight w-[58px] flex-shrink-0">
                  <div className="font-bold text-[#111827] text-[11.5px]">{bkg.date}</div>
                  <div className="text-[10px] text-[#8A90A2]">{bkg.time}</div>
                </div>

                {/* Vertical Accent Bar */}
                <div className={`w-1 h-8 rounded-full ${bkg.barColor} flex-shrink-0`} />

                {/* Room & Title */}
                <div className="truncate">
                  <div className="font-bold text-[#111827] text-[12px] truncate">{bkg.title}</div>
                  <div className="text-[11px] text-[#64748B] truncate flex items-center gap-1.5">
                    <span>{bkg.room}</span>
                    <span>•</span>
                    <span>👥 {bkg.attendees}</span>
                  </div>
                </div>
              </div>

              {/* Status Pill */}
              <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0 ${bkg.statusColor}`}>
                {bkg.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Widget 4: Usage & Credits ── */}
      <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft">
        <div className="flex items-center justify-between mb-2">
          <h4 className="text-[13px] font-bold text-[#111827]">Usage &amp; Credits</h4>
          <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
            2 hrs free remaining
          </span>
        </div>

        {/* Progress Bar (80% used) */}
        <div className="w-full h-2 bg-[#E4DEFF] rounded-full overflow-hidden mt-2.5">
          <div className="h-full bg-[#4F3FE0] rounded-full w-[80%] transition-all duration-500" />
        </div>

        <div className="flex items-center justify-between text-xs mt-2 text-[#64748B]">
          <span className="font-bold text-[#111827]">8 / 10 hours used</span>
          <button
            type="button"
            onClick={onViewCreditDetails}
            className="text-xs font-semibold text-[#4F3FE0] hover:underline"
          >
            View Details
          </button>
        </div>
      </div>
    </aside>
  );
}

