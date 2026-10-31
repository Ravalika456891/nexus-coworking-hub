'use client';

import React from 'react';
import { Search, MapPin, Bell, ChevronDown, X } from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onNotificationClick?: () => void;
}

export default function Header({ searchQuery, setSearchQuery, onNotificationClick }: HeaderProps) {
  return (
    <header className="h-[70px] bg-white border-b border-[#ECEEF4] px-8 flex items-center justify-between sticky top-0 z-30 select-none">
      {/* Search Input */}
      <div className="relative w-[380px]">
        <Search className="w-4 h-4 text-[#8A90A2] absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search rooms, amenities, or location..."
          className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-full pl-10 pr-9 py-2 text-[13px] text-[#111827] placeholder-[#8A90A2] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8A90A2] hover:text-[#111827]"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Right User Meta */}
      <div className="flex items-center gap-4">
        {/* Company selector */}
        <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-full px-3.5 py-1.5 cursor-pointer hover:border-[#4F3FE0]/40 transition-all">
          <MapPin className="w-3.5 h-3.5 text-[#4F3FE0]" />
          <span className="text-[12.5px] font-semibold text-[#111827]">XYZ Technologies (STP-XYZ)</span>
          <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2]" />
        </div>

        {/* Bell notification */}
        <button
          type="button"
          onClick={onNotificationClick}
          className="w-9 h-9 rounded-full bg-[#F6F7FB] border border-[#ECEEF4] flex items-center justify-center relative hover:bg-gray-100 transition-all"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4 text-[#374151]" />
          <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 border-2 border-white" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-2.5 pl-2 cursor-pointer">
          <img
            src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&h=120&q=80"
            alt="Alex Morgan"
            className="w-9 h-9 rounded-full object-cover ring-2 ring-[#4F3FE0]/20"
          />
          <div className="leading-tight text-left">
            <div className="text-[13px] font-bold text-[#111827]">Alex Morgan</div>
            <div className="text-[11px] font-medium text-[#8A90A2]">Co-Founder</div>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2] ml-0.5" />
        </div>
      </div>
    </header>
  );
}

