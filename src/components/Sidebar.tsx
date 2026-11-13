'use client';

import React from 'react';
import {
  Zap,
  Crown,
  LayoutDashboard,
  Calendar,
  Bookmark,
  CalendarDays,
  Clock,
  CreditCard,
  BarChart3,
  Building2,
  Users,
  Database,
  Settings
} from 'lucide-react';

interface SidebarProps {
  activeNav: string;
  setActiveNav: (name: string) => void;
  onUpgradeClick?: () => void;
}

export default function Sidebar({ activeNav, setActiveNav, onUpgradeClick }: SidebarProps) {
  const primaryNav = [
    { name: 'Dashboard', icon: LayoutDashboard },
    { name: 'Meeting Rooms', icon: Calendar },
    { name: 'My Bookings', icon: Bookmark },
    { name: 'Calendar', icon: CalendarDays },
    { name: 'Billing & Credits', icon: CreditCard },
    { name: 'Analytics', icon: BarChart3 }
  ];

  const secondaryNav = [
    { name: 'Workspace & Desks', icon: Building2 },
    { name: 'Visitors', icon: Users },
    { name: 'Members', icon: Users },
    { name: 'Database Tables', icon: Database }
  ];

  return (
    <aside className="w-[235px] flex-shrink-0 bg-white border-r border-[#ECEEF4] flex flex-col justify-start py-3.5 px-3 sticky top-0 h-screen overflow-y-auto select-none gap-2">
      <div>
        {/* Logo */}
        <div className="flex items-center gap-3 px-2 mb-3">
          <div className="w-[38px] h-[38px] rounded-[11px] bg-gradient-to-br from-[#ED441B] to-[#ff7a45] flex items-center justify-center text-white font-extrabold text-lg shadow-[0_4px_14px_rgba(237,68,27,0.35)] flex-shrink-0">
            N
          </div>
          <div className="leading-tight">
            <h1 className="font-extrabold text-[15px] tracking-tight text-[#111827]">
              NEXUS <span className="text-[#ED441B]">HUB</span>
            </h1>
            <span className="text-[11px] font-medium text-[#8A90A2]">Incubation OS</span>
          </div>
        </div>

        {/* Primary Nav */}
        <nav className="space-y-0.5">
          {primaryNav.map((item) => {
            const isActive =
              activeNav === item.name ||
              (item.name === 'My Bookings' && (activeNav === 'Bookings' || activeNav === 'My Reservations'));
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEEBFF] text-[#4F3FE0] font-semibold'
                    : 'text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#4F3FE0]' : 'text-[#8A90A2]'}`}
                  strokeWidth={isActive ? 2 : 1.7}
                />
                <span>{item.name}</span>
              </button>
            );
          })}

          {/* Divider */}
          <div className="h-[1px] bg-[#ECEEF4] my-2 mx-2" />

          {/* Secondary Nav */}
          {secondaryNav.map((item) => {
            const isActive = activeNav === item.name;
            const Icon = item.icon;
            return (
              <button
                key={item.name}
                onClick={() => setActiveNav(item.name)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                  isActive
                    ? 'bg-[#EEEBFF] text-[#4F3FE0] font-semibold'
                    : 'text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]'
                }`}
              >
                <Icon
                  className={`w-4 h-4 ${isActive ? 'text-[#4F3FE0]' : 'text-[#8A90A2]'}`}
                  strokeWidth={isActive ? 2 : 1.7}
                />
                <span>{item.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Bottom Startup Plan Card */}
      <div className="bg-[#F4F2FF] border border-[#E3DEFF] rounded-2xl p-4 mt-2 mb-2 flex-shrink-0">
        <div className="flex items-center gap-1.5 text-[#4F3FE0] text-xs font-bold uppercase tracking-wider">
          <Crown className="w-3.5 h-3.5 text-[#4F3FE0]" />
          <span>Startup Plan</span>
        </div>
        <div className="text-[19px] font-black text-[#111827] mt-1">120 credits</div>

        {/* Progress Bar (~33% filled, 80 left) */}
        <div className="w-full h-1.5 bg-[#E4DEFF] rounded-full mt-2.5 overflow-hidden">
          <div className="h-full bg-[#4F3FE0] rounded-full w-[33%] transition-all duration-500" />
        </div>
        <div className="text-[11px] font-medium text-[#8A90A2] mt-1.5">80 credits left</div>

        <button
          type="button"
          onClick={onUpgradeClick}
          className="w-full mt-3 bg-[#4F3FE0] hover:bg-[#4335C9] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
        >
          Upgrade Plan &rarr;
        </button>
      </div>
    </aside>
  );
}

