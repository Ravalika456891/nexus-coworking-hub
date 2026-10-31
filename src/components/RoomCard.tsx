'use client';

import React from 'react';
import { Users, Monitor, Video, Mic, Wifi, Heart } from 'lucide-react';
import { Room } from '../types/meetingRooms';

interface RoomCardProps {
  room: Room;
  isFavorite: boolean;
  onToggleFavorite: (id: string, e: React.MouseEvent) => void;
  onBookClick: (room: Room) => void;
  onViewScheduleClick: (room: Room) => void;
}

export default function RoomCard({
  room,
  isFavorite,
  onToggleFavorite,
  onBookClick,
  onViewScheduleClick
}: RoomCardProps) {
  const isAvailable = room.status === 'Available';

  return (
    <div className="bg-white border border-[#ECEEF4] rounded-2xl overflow-hidden shadow-soft hover:shadow-card hover:-translate-y-1 transition-all duration-200 flex flex-col group select-none">
      {/* 16:9 Image Container */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
        <img
          src={room.image}
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = room.fallbackImage;
          }}
          alt={room.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* Status Pill (top-left) */}
        <div className="absolute top-3 left-3">
          <span
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md ${
              isAvailable ? 'bg-[#16A34A]' : 'bg-[#F97316]'
            }`}
          >
            {room.status}
          </span>
        </div>

        {/* Circular Heart Button (top-right) */}
        <button
          type="button"
          onClick={(e) => onToggleFavorite(room.id, e)}
          className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center absolute top-3 right-3 hover:scale-110 active:scale-95 transition-all"
          aria-label="Add to favorites"
        >
          <Heart
            className={`w-4 h-4 ${isFavorite ? 'text-[#EF4444] fill-[#EF4444]' : 'text-[#8A90A2] hover:text-[#EF4444]'}`}
            strokeWidth={2}
          />
        </button>
      </div>

      {/* Card Content Body */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          <h4 className="font-bold text-[15px] text-[#111827] leading-tight">{room.name}</h4>

          <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium mt-1">
            <Users className="w-3.5 h-3.5 text-[#8A90A2]" />
            <span>{room.capacity} people</span>
            <span className="mx-1">•</span>
            <span className="text-[#4F3FE0] font-semibold">{room.rate}</span>
          </div>
        </div>

        {/* Amenity Icons Row + Action Button */}
        <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEEF4]">
          <div className="flex items-center gap-2 text-[#8A90A2]">
            <span title="Monitor">
              <Monitor className="w-4 h-4 hover:text-[#111827] transition-colors" />
            </span>
            <span title="Video Conferencing">
              <Video className="w-4 h-4 hover:text-[#111827] transition-colors" />
            </span>
            <span title="Audio/Mic">
              <Mic className="w-4 h-4 hover:text-[#111827] transition-colors" />
            </span>
            <span title="High-Speed Wi-Fi">
              <Wifi className="w-4 h-4 hover:text-[#111827] transition-colors" />
            </span>
          </div>

          {isAvailable ? (
            <button
              type="button"
              onClick={() => onBookClick(room)}
              className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-95"
            >
              Book Now
            </button>
          ) : (
            <button
              type="button"
              onClick={() => onViewScheduleClick(room)}
              className="border border-[#ECEEF4] hover:bg-gray-50 text-[#374151] px-4 py-2 rounded-xl text-xs font-semibold transition-all"
            >
              View Schedule
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

