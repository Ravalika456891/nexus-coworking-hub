'use client';

import React from 'react';
import {
  Calendar,
  Clock,
  Users,
  ChevronDown,
  Sliders,
  Projector,
  Video,
  PenTool,
  Monitor,
  Mic,
  Coffee,
  Accessibility,
  Sun
} from 'lucide-react';
import { ROOM_TYPES, AMENITIES_LIST } from '../data/mockRoomsData';
import { RoomType } from '../types/meetingRooms';

interface SearchFilterBarProps {
  selectedDate: string;
  selectedTime: string;
  selectedPeople: number;
  setSelectedPeople: (people: number) => void;
  selectedType: RoomType;
  setSelectedType: (type: RoomType) => void;
  selectedAmenities: string[];
  toggleAmenity: (name: string) => void;
  onSearchClick: () => void;
  onMoreFiltersClick: () => void;
}

const amenityIconMap: Record<string, React.ElementType> = {
  Projector: Projector,
  'Video Conferencing': Video,
  Whiteboard: PenTool,
  'TV/Display': Monitor,
  'Audio/Mic': Mic,
  Catering: Coffee,
  Accessible: Accessibility,
  'Natural Light': Sun
};

export default function SearchFilterBar({
  selectedDate,
  selectedTime,
  selectedPeople,
  setSelectedPeople,
  selectedType,
  setSelectedType,
  selectedAmenities,
  toggleAmenity,
  onSearchClick,
  onMoreFiltersClick
}: SearchFilterBarProps) {
  return (
    <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft space-y-4">
      {/* Row 1: 3 Dropdown Fields + Large Indigo "Search Rooms" button */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1.3fr_1fr_auto] gap-3 items-center">
        {/* Date Selector */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">Date</span>
          <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all">
            <Calendar className="w-4 h-4 text-[#4F3FE0]" />
            <span className="text-[13px] font-semibold text-[#111827] whitespace-nowrap">{selectedDate}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2] ml-auto" />
          </div>
        </div>

        {/* Time Selector */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">Time</span>
          <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all">
            <Clock className="w-4 h-4 text-[#4F3FE0]" />
            <span className="text-[13px] font-semibold text-[#111827] whitespace-nowrap">{selectedTime}</span>
            <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2] ml-auto" />
          </div>
        </div>

        {/* People Selector */}
        <div className="flex flex-col">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">People</span>
          <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5 cursor-pointer hover:border-[#4F3FE0]/50 transition-all">
            <Users className="w-4 h-4 text-[#4F3FE0]" />
            <select
              value={selectedPeople}
              onChange={(e) => setSelectedPeople(Number(e.target.value))}
              className="bg-transparent text-[13px] font-semibold text-[#111827] outline-none cursor-pointer w-full"
            >
              <option value={2}>2 people</option>
              <option value={4}>4 people</option>
              <option value={6}>6 people</option>
              <option value={8}>8 people</option>
              <option value={10}>10 people</option>
              <option value={20}>20+ people</option>
            </select>
          </div>
        </div>

        {/* Primary Indigo Action */}
        <div className="self-end pt-4 sm:pt-0">
          <button
            type="button"
            onClick={onSearchClick}
            className="w-full bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-7 py-2.5 rounded-xl text-[13px] font-bold transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
          >
            <span>Search Rooms</span>
          </button>
        </div>
      </div>

      {/* Chip Row 1: Room Type (Single-Select) + "More Filters" */}
      <div className="pt-2 border-t border-[#ECEEF4] flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center flex-wrap gap-1.5">
          {ROOM_TYPES.map((type) => {
            const isSelected = selectedType === type;
            return (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type as RoomType)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-[#4F3FE0] text-white shadow-sm'
                    : 'bg-[#F6F7FB] hover:bg-gray-200 text-[#374151]'
                }`}
              >
                {type}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          onClick={onMoreFiltersClick}
          className="inline-flex items-center gap-1.5 border border-[#4F3FE0] text-[#4F3FE0] hover:bg-[#F4F2FF] px-3.5 py-1.5 rounded-full text-xs font-bold transition-all"
        >
          <Sliders className="w-3.5 h-3.5" />
          <span>More Filters</span>
        </button>
      </div>

      {/* Chip Row 2: Amenities (Multi-Select with icons) */}
      <div className="flex items-center flex-wrap gap-2 pt-1">
        {AMENITIES_LIST.map((amenity) => {
          const isSelected = selectedAmenities.includes(amenity.name);
          const IconComp = amenityIconMap[amenity.name] || Monitor;
          return (
            <button
              key={amenity.name}
              type="button"
              onClick={() => toggleAmenity(amenity.name)}
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border transition-all ${
                isSelected
                  ? 'bg-[#EEEBFF] border-[#4F3FE0] text-[#4F3FE0] font-semibold'
                  : 'bg-white border-[#ECEEF4] text-[#374151] hover:border-gray-300'
              }`}
            >
              <IconComp className={`w-3.5 h-3.5 ${isSelected ? 'text-[#4F3FE0]' : 'text-[#8A90A2]'}`} />
              <span>{amenity.name}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

