'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Room } from '../types/meetingRooms';

interface BookingModalProps {
  room: Room;
  selectedDate: string;
  selectedTime: string;
  selectedPeople: number;
  onClose: () => void;
  onConfirm: (title: string) => void;
}

export default function BookingModal({
  room,
  selectedDate,
  selectedTime,
  selectedPeople,
  onClose,
  onConfirm
}: BookingModalProps) {
  const [meetingTitle, setMeetingTitle] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm(meetingTitle.trim() || `Strategy Sync (${room.name})`);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
          <div>
            <h3 className="text-lg font-black text-[#111827]">Book {room.name}</h3>
            <p className="text-xs text-[#8A90A2]">Instant confirmation • Deducts 1 hour credit</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label className="block text-xs font-bold text-[#374151] mb-1">Meeting Title</label>
            <input
              type="text"
              required
              value={meetingTitle}
              onChange={(e) => setMeetingTitle(e.target.value)}
              placeholder="e.g. Q4 Executive Pitch Session"
              className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white"
            />
          </div>

          {/* Summary Box */}
          <div className="bg-[#F8F9FD] border border-[#E3DEFF] rounded-xl p-3.5 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-[#8A90A2]">Room Rate:</span>
              <span className="font-bold text-[#111827]">{room.rate} (Covered by Credits)</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A90A2]">Date &amp; Time:</span>
              <span className="font-bold text-[#111827]">
                {selectedDate} • {selectedTime}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#8A90A2]">Attendees:</span>
              <span className="font-bold text-[#111827]">
                {selectedPeople} people (Capacity: {room.capacity})
              </span>
            </div>
          </div>

          {/* Submit Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm active:scale-95 transition-all"
            >
              Confirm Reservation
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

