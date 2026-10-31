'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  LayoutDashboard,
  FileText,
  Calendar,
  Building,
  Users,
  CreditCard,
  Clock,
  Sparkles,
  ExternalLink,
  Database,
  Bookmark,
  CalendarDays,
  UserPlus
} from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import HeroBanner from '@/components/HeroBanner';
import SearchFilterBar from '@/components/SearchFilterBar';
import RoomCard from '@/components/RoomCard';
import RightPanel from '@/components/RightPanel';
import BookingModal from '@/components/BookingModal';
import {
  INITIAL_ROOMS,
  INITIAL_TODAYS_SCHEDULE,
  INITIAL_UPCOMING_BOOKINGS
} from '@/data/mockRoomsData';
import { Room, RoomType, TodayScheduleItem, UpcomingBooking } from '@/types/meetingRooms';

export default function MeetingRoomsPage() {
  const [rooms, setRooms] = useState<Room[]>(INITIAL_ROOMS);
  const [activeNav, setActiveNav] = useState('Dashboard');
  const [selectedType, setSelectedType] = useState<RoomType>('All Rooms');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'Cards' | 'List' | 'Calendar'>('Cards');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('Fri, 30 Oct 2026');
  const [selectedTime, setSelectedTime] = useState('09:00 AM – 11:00 AM');
  const [selectedPeople, setSelectedPeople] = useState(4);
  const [favorites, setFavorites] = useState<Set<string>>(new Set(['mr-1']));

  const [todaysSchedule, setTodaysSchedule] = useState<TodayScheduleItem[]>(INITIAL_TODAYS_SCHEDULE);
  const [upcomingBookings, setUpcomingBookings] = useState<UpcomingBooking[]>(INITIAL_UPCOMING_BOOKINGS);

  const [bookingModalRoom, setBookingModalRoom] = useState<Room | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [dashScheduleTab, setDashScheduleTab] = useState<'today' | 'upcoming'>('today');

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return 'Good morning';
    if (hr < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const DASHBOARD_ACTIVITIES = [
    { id: 'act-1', time: '12m ago', icon: Calendar, title: 'Room Reservation Confirmed', desc: 'Collaboration Room reserved for Today at 03:00 PM (30 credits)', user: 'Alex Morgan' },
    { id: 'act-2', time: '1h ago', icon: Users, title: 'Visitor Gate Pass Issued', desc: 'Pass #VP-9021 issued for Kiran Mehta (Apex Ventures)', user: 'David Chen' },
    { id: 'act-3', time: 'Yesterday', icon: CreditCard, title: 'Monthly Credit Grant Active', desc: '+80 credits added under Growth Startup Package', user: 'System Auto-Credit' },
    { id: 'act-4', time: '2 days ago', icon: Building, title: 'Smart Lock Keycard Verified', desc: 'Access active for Suite 401 & 24/7 Floor Turnstiles', user: 'Incubation Security' }
  ];

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3200);
  };

  const navigateTo = (navName: string) => {
    setActiveNav(navName);
    if (typeof window !== 'undefined') {
      window.location.hash = navName.toLowerCase().replace(/\s+/g, '-');
    }
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#', '').toLowerCase().replace(/[-_]/g, '');
      if (hash === 'database' || hash === 'databasetables' || hash === 'tables') {
        setActiveNav('Database Tables');
        return;
      }
      const validTabs = [
        'Dashboard',
        'Meeting Rooms',
        'Bookings',
        'Calendar',
        'My Reservations',
        'Billing & Credits',
        'Analytics',
        'Workspace & Desks',
        'Visitors',
        'Members',
        'Database Tables',
        'Settings'
      ];
      const match = validTabs.find(
        (t) => t.toLowerCase().replace(/\s+/g, '') === hash
      );
      if (match) setActiveNav(match);
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const toggleFavorite = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
        showToast('Removed from favorites');
      } else {
        next.add(id);
        showToast('Added to favorite rooms ❤️');
      }
      return next;
    });
  };

  const toggleAmenity = (name: string) => {
    setSelectedAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter((room) => {
      if (selectedType !== 'All Rooms' && room.type !== selectedType) return false;
      if (room.capacity < selectedPeople) return false;
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every((a) => room.amenities.includes(a));
        if (!hasAll) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(q);
        const matchType = room.type.toLowerCase().includes(q);
        const matchAmenity = room.amenities.some((a) => a.toLowerCase().includes(q));
        if (!matchName && !matchType && !matchAmenity) return false;
      }
      return true;
    });
  }, [rooms, selectedType, selectedPeople, selectedAmenities, searchQuery]);

  const handleConfirmBooking = (title: string) => {
    if (!bookingModalRoom) return;

    const newBooking: UpcomingBooking = {
      id: `bkg-${Date.now()}`,
      date: 'Today',
      time: selectedTime.split('–')[0].trim() || '09:00 AM',
      title,
      room: bookingModalRoom.name,
      attendees: selectedPeople,
      status: 'Confirmed',
      statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
      barColor: 'bg-emerald-500'
    };

    setUpcomingBookings((prev) => [newBooking, ...prev]);
    setTodaysSchedule((prev) => [
      ...prev,
      {
        id: `ts-${Date.now()}`,
        time: selectedTime,
        title,
        room: bookingModalRoom.name,
        attendees: selectedPeople,
        dotColor: 'bg-emerald-500',
        tintColor: 'border-l-4 border-l-emerald-500'
      }
    ]);

    showToast(`🎉 Room booked! ${bookingModalRoom.name} confirmed.`);
    setBookingModalRoom(null);
  };

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] text-[#374151] font-sans antialiased">
      {/* 1. Left Sidebar */}
      <Sidebar
        activeNav={activeNav}
        setActiveNav={navigateTo}
        onUpgradeClick={() => navigateTo('Billing & Credits')}
      />

      {/* Main Content + Right Panel Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header */}
        <Header
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onNotificationClick={() => showToast('Notifications: 2 pending requests')}
        />

        {/* Dynamic Route View Content */}
        <div className="flex-1 p-8 max-w-[1600px] w-full mx-auto">
          {/* ── 1. DASHBOARD VIEW ── */}
          {activeNav === 'Dashboard' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Section: Personalized Welcome & High-Level Pulse */}
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#4F3FE0] to-[#7B6FF0] text-white flex items-center justify-center font-black text-xl shadow-md shadow-indigo-100 flex-shrink-0">
                    ⚡
                  </div>
                  <div>
                    <h2 className="text-2xl font-black text-[#111827] tracking-tight flex items-center gap-2">
                      <span>{getGreeting()}, Alex!</span>
                    </h2>
                    <p className="text-xs text-[#64748B] mt-1 flex items-center gap-2">
                      <span>Welcome to the <strong>XYZ Technologies</strong> venture command center.</span>
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      <span className="text-emerald-700 font-bold text-[11px]">24/7 Facility Access Active</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#334155] flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-[#4F3FE0]" />
                    <span>Sat, 31 Oct 2026</span>
                  </span>
                  <span className="bg-[#EEEBFF] border border-[#E3DEFF] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#4F3FE0]">
                    🚀 Batch 2026-A
                  </span>
                  <button
                    onClick={() => navigateTo('Meeting Rooms')}
                    className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all shadow-sm flex items-center gap-1.5"
                  >
                    <span>+ Reserve Space</span>
                  </button>
                </div>
              </div>

              {/* Top Section: Four Elevated KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Upcoming Meetings */}
                <div
                  onClick={() => navigateTo('Bookings')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Upcoming Meetings</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Calendar className="w-5 h-5 text-[#6E42E5]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#111827] mt-3">
                    {upcomingBookings.length}
                    <span className="text-xs font-bold text-emerald-600 ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      100% Confirmed
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]">
                    <span className="text-[#374151] font-medium">Next: Today at 03:00 PM</span>
                    <span className="text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform">View &rarr;</span>
                  </div>
                </div>

                {/* Card 2: Available Rooms */}
                <div
                  onClick={() => navigateTo('Meeting Rooms')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Available Rooms</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Building className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#059669] mt-3">
                    5 <span className="text-base text-[#8A90A2] font-semibold">/ 6</span>
                    <span className="text-xs font-bold text-[#059669] ml-2 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                      83% Ready
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]">
                    <span className="text-[#374151] font-medium">Alpha, Focus &amp; Studio</span>
                    <span className="text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform">Book &rarr;</span>
                  </div>
                </div>

                {/* Card 3: Remaining Credits */}
                <div
                  onClick={() => navigateTo('Billing & Credits')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Remaining Credits</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#2563eb] mt-3">
                    80 <span className="text-sm font-semibold text-[#8A90A2]">/ 120 cr</span>
                  </div>
                  <div className="w-full bg-[#ECEEF4] rounded-full h-1.5 mt-2 overflow-hidden">
                    <div className="bg-[#4F3FE0] h-full rounded-full" style={{ width: '66%' }}></div>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-2 border-t border-[#ECEEF4]">
                    <span className="text-[#374151] font-medium">Renews in 24 hours</span>
                    <span className="text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform">Top Up &rarr;</span>
                  </div>
                </div>

                {/* Card 4: Workspace Desks */}
                <div
                  onClick={() => navigateTo('Workspace & Desks')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer group"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#64748B]">Workspace &amp; Team</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                      <Users className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#111827] mt-3">
                    6 <span className="text-sm font-semibold text-[#8A90A2]">desks</span>
                    <span className="text-xs font-bold text-[#4F3FE0] ml-2 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-200">
                      Suite 401
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-3 pt-3 border-t border-[#ECEEF4]">
                    <span className="text-[#374151] font-medium">8 Team Members Active</span>
                    <span className="text-[#4F3FE0] font-bold group-hover:translate-x-0.5 transition-transform">Desks &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Main Section: Quick Actions, Facilities Overview & Today's Schedule */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (7 cols): Quick Actions & Facilities Overview */}
                <div className="lg:col-span-7 space-y-6">
                  {/* Quick Actions Container */}
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                          <span>⚡</span> Quick Launchpad
                        </h4>
                        <p className="text-xs text-[#8A90A2] mt-0.5">Instant one-click shortcuts to key operational workflows</p>
                      </div>
                      <span className="text-[11px] font-bold text-[#64748B] bg-[#F8FAFC] px-2.5 py-1 rounded-full border border-[#ECEEF4]">
                        Shortcuts
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('Meeting Rooms')}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#F3EFFE] hover:border-[#6E42E5]/40 transition-all text-center group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                          <Calendar className="w-5 h-5 text-[#6E42E5]" />
                        </span>
                        <span className="text-xs font-bold text-[#111827]">Book Room</span>
                        <span className="text-[10px] text-[#8A90A2] mt-0.5">6 Facilities</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Bookings')}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEF5FF] hover:border-[#2B71FF]/40 transition-all text-center group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-blue-50 text-[#2B71FF] flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                          <Bookmark className="w-5 h-5 text-[#2B71FF]" />
                        </span>
                        <span className="text-xs font-bold text-[#111827]">My Bookings</span>
                        <span className="text-[10px] text-[#8A90A2] mt-0.5">3 Active</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Calendar')}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEFAF3] hover:border-[#12A150]/40 transition-all text-center group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                          <CalendarDays className="w-5 h-5 text-emerald-600" />
                        </span>
                        <span className="text-xs font-bold text-[#111827]">Calendar</span>
                        <span className="text-[10px] text-[#8A90A2] mt-0.5">Full Grid</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Visitors')}
                        className="flex flex-col items-center justify-center p-3.5 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#FFF5EC] hover:border-[#F36B20]/40 transition-all text-center group"
                      >
                        <span className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:scale-110 transition-transform mb-2">
                          <UserPlus className="w-5 h-5 text-orange-600" />
                        </span>
                        <span className="text-xs font-bold text-[#111827]">Guest Pass</span>
                        <span className="text-[10px] text-[#8A90A2] mt-0.5">Invite Visitors</span>
                      </button>
                    </div>
                  </div>

                  {/* Venture Facilities & Office Suite Overview */}
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                          <span>🏢</span> Venture Facilities &amp; Lease Overview
                        </h4>
                        <p className="text-xs text-[#8A90A2] mt-0.5">Assigned physical space and operational amenities</p>
                      </div>
                      <span
                        onClick={() => navigateTo('Workspace & Desks')}
                        className="text-xs font-bold text-[#4F3FE0] hover:underline cursor-pointer"
                      >
                        Manage Space &rarr;
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider">Office Suite</span>
                        <div className="text-sm font-black text-[#111827] mt-1">Suite 401</div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">Floor 4 (Executive Wing)</span>
                      </div>

                      <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider">Desks &amp; Seats</span>
                        <div className="text-sm font-black text-[#111827] mt-1">6 Dedicated</div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">8 Keycards issued</span>
                      </div>

                      <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider">Lease Billing</span>
                        <div className="text-sm font-black text-emerald-600 mt-1">$2,400 / mo</div>
                        <span className="text-[11px] text-emerald-700 font-semibold block mt-0.5">Settled &amp; Current ✓</span>
                      </div>

                      <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10px] font-bold text-[#8A90A2] uppercase tracking-wider">Wi-Fi &amp; Access</span>
                        <div className="text-sm font-black text-[#4F3FE0] mt-1">1 Gbps Fiber</div>
                        <span className="text-[11px] text-[#64748B] block mt-0.5">24/7 RFID Smart Lock</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (5 cols): Today's Schedule Live Interactive Widget */}
                <div className="lg:col-span-5 bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                          <span>🗓️</span> Schedule &amp; Bookings
                        </h4>
                        <p className="text-xs text-[#8A90A2] mt-0.5">Chronological reservation timeline</p>
                      </div>
                      {/* Segmented Tab Switcher */}
                      <div className="flex items-center p-1 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl">
                        <button
                          onClick={() => setDashScheduleTab('today')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            dashScheduleTab === 'today'
                              ? 'bg-white text-[#4F3FE0] shadow-xs'
                              : 'text-[#8A90A2] hover:text-[#111827]'
                          }`}
                        >
                          Today ({todaysSchedule.length})
                        </button>
                        <button
                          onClick={() => setDashScheduleTab('upcoming')}
                          className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                            dashScheduleTab === 'upcoming'
                              ? 'bg-white text-[#4F3FE0] shadow-xs'
                              : 'text-[#8A90A2] hover:text-[#111827]'
                          }`}
                        >
                          Upcoming ({upcomingBookings.length})
                        </button>
                      </div>
                    </div>

                    {/* List Items */}
                    <div className="space-y-3">
                      {dashScheduleTab === 'today' ? (
                        todaysSchedule.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl hover:border-[#4F3FE0]/30 transition-colors"
                          >
                            <div className="w-[84px] text-[11px] font-bold text-[#64748B] flex-shrink-0">
                              {item.time.split('–')[0].trim()}
                            </div>
                            <div className="w-1.5 h-8 rounded-full bg-[#4F3FE0] flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#111827] truncate">{item.title}</div>
                              <div className="text-[11px] text-[#8A90A2] truncate">
                                {item.room} • 👥 {item.attendees} pax
                              </div>
                            </div>
                            <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              Confirmed
                            </span>
                          </div>
                        ))
                      ) : (
                        upcomingBookings.map((bkg) => (
                          <div
                            key={bkg.id}
                            className="flex items-center gap-3 p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl hover:border-[#4F3FE0]/30 transition-colors"
                          >
                            <div className="w-[84px] text-[11px] font-bold text-[#64748B] flex-shrink-0">
                              {bkg.date} • {bkg.time}
                            </div>
                            <div className="w-1.5 h-8 rounded-full bg-emerald-500 flex-shrink-0" />
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-[#111827] truncate">{bkg.title}</div>
                              <div className="text-[11px] text-[#8A90A2] truncate">
                                {bkg.room} • 👥 {bkg.attendees} pax
                              </div>
                            </div>
                            <span className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">
                              {bkg.status}
                            </span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#ECEEF4] flex items-center justify-between text-xs text-[#64748B]">
                    <span>Need a private room right now?</span>
                    <button
                      onClick={() => navigateTo('Meeting Rooms')}
                      className="bg-[#4F3FE0] text-white px-3.5 py-1.5 rounded-xl text-xs font-bold hover:bg-[#4335C9] transition-all"
                    >
                      + Reserve Space
                    </button>
                  </div>
                </div>
              </div>

              {/* Secondary Section: Recent Activity & Incubation Milestones */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left: Recent Activity Feed (7 cols) */}
                <div className="lg:col-span-7 bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
                    <div>
                      <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                        <span>🕒</span> Recent Venture Activity
                      </h4>
                      <p className="text-xs text-[#8A90A2] mt-0.5">Audit log of room bookings, credit updates, and team actions</p>
                    </div>
                    <span className="text-[11px] font-bold text-[#4F3FE0] cursor-pointer" onClick={() => navigateTo('Analytics')}>
                      Full Audit Log &rarr;
                    </span>
                  </div>

                  <div className="divide-y divide-[#ECEEF4]">
                    {DASHBOARD_ACTIVITIES.map((act) => {
                      const IconComponent = act.icon;
                      return (
                        <div key={act.id} className="py-3 flex items-start justify-between gap-3 first:pt-1 last:pb-1">
                          <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-[#F6F7FB] border border-[#ECEEF4] flex items-center justify-center text-[#4F3FE0] flex-shrink-0 mt-0.5">
                              <IconComponent className="w-4 h-4 text-[#4F3FE0]" />
                            </div>
                            <div>
                              <div className="text-xs font-bold text-[#111827]">{act.title}</div>
                              <div className="text-[11px] text-[#64748B] mt-0.5">{act.desc}</div>
                              <div className="text-[10px] text-[#8A90A2] mt-1 font-medium">By: {act.user}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-semibold text-[#8A90A2] whitespace-nowrap bg-[#F8FAFC] px-2 py-0.5 rounded-md border border-[#ECEEF4]">
                            {act.time}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right: Milestones & Facility Advisory (5 cols) */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Milestone Card */}
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
                      <div>
                        <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                          <span>🎯</span> Incubation Milestone
                        </h4>
                        <p className="text-xs text-[#8A90A2] mt-0.5">Next milestone evaluation target</p>
                      </div>
                      <span className="bg-indigo-50 text-[#4F3FE0] font-bold text-[10.5px] px-2.5 py-0.5 rounded-full border border-indigo-200">
                        15 Days Left
                      </span>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-extrabold text-[#111827]">Q4 Venture Demo Day Readiness</span>
                        <span className="font-black text-[#4F3FE0]">75%</span>
                      </div>
                      <div className="w-full bg-[#F1F3F9] rounded-full h-2 mt-2 overflow-hidden">
                        <div className="bg-gradient-to-r from-[#4F3FE0] to-[#7B6FF0] h-full rounded-full" style={{ width: '75%' }}></div>
                      </div>
                      <p className="text-[11px] text-[#64748B] mt-2">
                        Pitch deck draft submitted. Pitch Arena practice session scheduled for Nov 10, 2026.
                      </p>
                    </div>
                  </div>

                  {/* Facility Operational Notice */}
                  <div className="bg-amber-50/60 border border-amber-200/80 rounded-2xl p-5 shadow-soft">
                    <div className="flex items-start gap-3">
                      <span className="text-lg">📢</span>
                      <div>
                        <h5 className="text-xs font-black text-amber-900">Facility Maintenance Advisory</h5>
                        <p className="text-[11px] text-amber-800 mt-1 leading-relaxed">
                          Routine fiber network optimization will take place on Sunday between 02:00 AM – 03:30 AM IST. Backup 5G links will remain active with no downtime anticipated.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── 2. MEETING ROOMS VIEW (Screenshot 1:1 Layout) ── */}
          {activeNav === 'Meeting Rooms' && (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start animate-fadeIn">
              <main className="space-y-6 min-w-0">
                <HeroBanner />
                <SearchFilterBar
                  selectedDate={selectedDate}
                  selectedTime={selectedTime}
                  selectedPeople={selectedPeople}
                  setSelectedPeople={setSelectedPeople}
                  selectedType={selectedType}
                  setSelectedType={setSelectedType}
                  selectedAmenities={selectedAmenities}
                  toggleAmenity={toggleAmenity}
                  onSearchClick={() => showToast(`🔍 Filtered rooms with capacity >= ${selectedPeople}`)}
                  onMoreFiltersClick={() => showToast('Advanced filter drawer opened')}
                />

                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-xl font-black text-[#111827]">Available Rooms</h3>
                    <span className="bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                      {filteredRooms.length} rooms available
                    </span>
                  </div>

                  <div className="flex items-center bg-white border border-[#ECEEF4] p-1 rounded-xl shadow-xs">
                    {[
                      { mode: 'Cards', icon: LayoutDashboard },
                      { mode: 'List', icon: FileText },
                      { mode: 'Calendar', icon: Calendar }
                    ].map((item) => {
                      const Icon = item.icon;
                      const isCurrent = viewMode === item.mode;
                      return (
                        <button
                          key={item.mode}
                          type="button"
                          onClick={() => setViewMode(item.mode as 'Cards' | 'List' | 'Calendar')}
                          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                            isCurrent ? 'bg-[#4F3FE0] text-white shadow-xs' : 'text-[#64748B] hover:text-[#111827]'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          <span>{item.mode}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                  {filteredRooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      isFavorite={favorites.has(room.id)}
                      onToggleFavorite={toggleFavorite}
                      onBookClick={(r) => setBookingModalRoom(r)}
                      onViewScheduleClick={(r) => showToast(`Schedule for ${r.name} opened in calendar`)}
                    />
                  ))}
                </div>
              </main>

              <RightPanel
                todaysSchedule={todaysSchedule}
                upcomingBookings={upcomingBookings}
                onBookRoomQuick={() => {
                  const firstAvail = rooms.find((r) => r.status === 'Available');
                  if (firstAvail) setBookingModalRoom(firstAvail);
                }}
                onMyBookingsQuick={() => navigateTo('Bookings')}
                onRecurringQuick={() => showToast('Recurring booking scheduler initialized')}
                onInviteGuestsQuick={() => navigateTo('Visitors')}
                onViewCalendar={() => navigateTo('Calendar')}
                onViewAllUpcoming={() => navigateTo('Bookings')}
                onViewCreditDetails={() => navigateTo('Billing & Credits')}
              />
            </div>
          )}

          {/* ── 3. BOOKINGS VIEW ── */}
          {(activeNav === 'Bookings' || activeNav === 'My Reservations') && (
            <div className="space-y-6 animate-fadeIn">
              <div className="flex items-center justify-between flex-wrap gap-4 bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                <div>
                  <h2 className="text-2xl font-black text-[#111827]">My Bookings &amp; Reservations</h2>
                  <p className="text-xs text-[#8A90A2] mt-1">Manage active conference slots, recurring meetings and approvals</p>
                </div>
                <button
                  onClick={() => navigateTo('Meeting Rooms')}
                  className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                >
                  + Book a Meeting Room
                </button>
              </div>

              <div className="bg-white border border-[#ECEEF4] rounded-2xl overflow-hidden shadow-soft">
                <div className="divide-y divide-[#ECEEF4]">
                  {upcomingBookings.map((bkg) => (
                    <div key={bkg.id} className="p-4 flex items-center justify-between flex-wrap gap-4 hover:bg-[#F8FAFC]">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-xl bg-purple-50 text-[#4F3FE0] flex items-center justify-center font-bold text-lg flex-shrink-0">
                          📅
                        </div>
                        <div>
                          <div className="font-bold text-sm text-[#111827]">{bkg.title}</div>
                          <div className="text-xs text-[#64748B] flex items-center gap-2 mt-0.5">
                            <span>📍 {bkg.room}</span>
                            <span>•</span>
                            <span>🕒 {bkg.date} at {bkg.time}</span>
                            <span>•</span>
                            <span>👥 {bkg.attendees} attendees</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${bkg.statusColor}`}>
                          {bkg.status}
                        </span>
                        <button
                          onClick={() => showToast(`Rescheduling flow for ${bkg.title}`)}
                          className="border border-[#ECEEF4] hover:bg-gray-100 text-[#374151] px-3 py-1.5 rounded-xl text-xs font-bold"
                        >
                          Reschedule
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── 4. CALENDAR VIEW ── */}
          {activeNav === 'Calendar' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#111827]">Interactive Room Calendar</h2>
                  <p className="text-xs text-[#8A90A2] mt-1">Real-time room occupancy and timeline scheduling</p>
                </div>
              </div>
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                <div className="grid grid-cols-6 gap-2 text-center font-bold text-xs text-[#64748B] pb-3 border-b border-[#ECEEF4]">
                  {rooms.map((r) => (
                    <div key={r.id} className="truncate px-1">{r.name}</div>
                  ))}
                </div>
                {['09:00 AM', '11:00 AM', '01:00 PM', '03:00 PM', '05:00 PM'].map((hour, idx) => (
                  <div key={hour} className="grid grid-cols-6 gap-2 items-center py-3 border-b border-gray-100 text-xs">
                    {rooms.map((r) => {
                      const isBooked = (idx === 0 && r.id === 'mr-1') || (idx === 1 && r.id === 'mr-2') || (idx === 3 && r.id === 'mr-4');
                      return isBooked ? (
                        <div key={r.id} className="bg-indigo-50 border border-indigo-200 text-[#4F3FE0] p-2 rounded-xl text-center font-bold truncate">
                          Occupied ({hour})
                        </div>
                      ) : (
                        <button
                          key={r.id}
                          onClick={() => setBookingModalRoom(r)}
                          className="bg-[#F8FAFC] border border-dashed border-[#ECEEF4] hover:border-[#4F3FE0] hover:bg-[#F3EFFE] text-[#8A90A2] hover:text-[#4F3FE0] p-2 rounded-xl text-center font-medium transition-all"
                        >
                          + Open Slot
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── 5. BILLING & CREDITS VIEW ── */}
          {activeNav === 'Billing & Credits' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#111827]">Billing &amp; Meeting Room Credits</h2>
                  <p className="text-xs text-[#8A90A2] mt-1">Live quota allowance, invoices &amp; transaction statements</p>
                </div>
                <button
                  onClick={() => showToast('Purchasing 50 bonus credits via Razorpay gateway')}
                  className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-sm"
                >
                  + Purchase Extra Credits
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                  <span className="text-xs font-bold text-[#8A90A2] uppercase tracking-wider">Remaining Balance</span>
                  <div className="text-3xl font-black text-[#4F3FE0] mt-2">80 credits</div>
                  <div className="text-xs text-[#64748B] mt-1">Out of 120 credits total quota</div>
                </div>
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                  <span className="text-xs font-bold text-[#8A90A2] uppercase tracking-wider">Monthly Free Hours</span>
                  <div className="text-3xl font-black text-emerald-600 mt-2">2.0 hrs left</div>
                  <div className="text-xs text-[#64748B] mt-1">8 / 10 hours consumed</div>
                </div>
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                  <span className="text-xs font-bold text-[#8A90A2] uppercase tracking-wider">Subscription Plan</span>
                  <div className="text-2xl font-black text-[#111827] mt-2">Scale-up Venture</div>
                  <div className="text-xs text-[#64748B] mt-1">Renews automatically on Nov 1, 2026</div>
                </div>
              </div>
            </div>
          )}

          {/* ── 6. OTHER VIEWS (Workspace, Visitors, Members, Analytics, Settings) ── */}
          {activeNav === 'Workspace & Desks' && (
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-black text-[#111827]">Workspace &amp; Dedicated Pods</h2>
              <p className="text-xs text-[#8A90A2]">Cyber City Hub • Ground Floor East Wing</p>
              <div className="p-4 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl font-bold text-sm">
                Allocated Space: Dedicated Pod #4 (6 Desks active)
              </div>
            </div>
          )}

          {activeNav === 'Visitors' && (
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-black text-[#111827]">Visitor Gate Passes &amp; Invites</h2>
              <p className="text-xs text-[#8A90A2]">Issue instant QR security passes for guests</p>
              <button
                onClick={() => showToast('Guest pass generator launched')}
                className="bg-[#4F3FE0] text-white px-4 py-2 rounded-xl text-xs font-bold"
              >
                + Issue Guest Pass
              </button>
            </div>
          )}

          {activeNav === 'Members' && (
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-black text-[#111827]">Venture Team Directory</h2>
              <p className="text-xs text-[#8A90A2]">XYZ Technologies registered incubator members (8 Total)</p>
            </div>
          )}

          {activeNav === 'Analytics' && (
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-black text-[#111827]">Meeting Space Insights &amp; Analytics</h2>
              <p className="text-xs text-[#8A90A2]">82% Boardroom Alpha utilization • 28 total hours booked this month</p>
            </div>
          )}

          {activeNav === 'Database Tables' && (
            <div className="space-y-6 animate-fadeIn">
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-[#EEEBFF] flex items-center justify-center text-[#4F3FE0] flex-shrink-0">
                      <Database className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-2xl font-black text-[#111827]">Database Tables &amp; Collections</h2>
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                          MongoDB Atlas Connected
                        </span>
                      </div>
                      <p className="text-xs text-[#8A90A2] mt-1">
                        Live multi-tenant collections, index schemas, and records for NEXUS HUB Incubation OS
                      </p>
                    </div>
                  </div>

                  <a
                    href="app.html"
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-[#111827] hover:bg-black text-white text-xs font-bold rounded-xl transition-all shadow-sm flex items-center gap-1.5 self-start md:self-auto"
                  >
                    <span>Full Admin Shell</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-5 border-t border-[#ECEEF4]">
                  <div className="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]">
                    <div className="text-[11px] font-semibold text-[#8A90A2]">Cluster</div>
                    <div className="text-sm font-extrabold text-[#111827] mt-0.5">cluster0.nexus.net</div>
                  </div>
                  <div className="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]">
                    <div className="text-[11px] font-semibold text-[#8A90A2]">Collections</div>
                    <div className="text-sm font-extrabold text-[#4F3FE0] mt-0.5">6 Collections</div>
                  </div>
                  <div className="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]">
                    <div className="text-[11px] font-semibold text-[#8A90A2]">Documents</div>
                    <div className="text-sm font-extrabold text-[#111827] mt-0.5">271 Records</div>
                  </div>
                  <div className="p-3 bg-[#F8F9FD] rounded-xl border border-[#ECEEF4]">
                    <div className="text-[11px] font-semibold text-[#8A90A2]">Cluster Latency</div>
                    <div className="text-sm font-extrabold text-emerald-600 mt-0.5">38ms Ping</div>
                  </div>
                </div>
              </div>

              {/* Collections View */}
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
                  <h3 className="font-bold text-sm text-[#111827]">Active MongoDB Collections</h3>
                  <span className="text-xs text-[#8A90A2]">Auto-indexed multi-tenant schema</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    { col: 'startups', count: 18, desc: 'Incubated venture profiles & founders' },
                    { col: 'meeting_rooms', count: 6, desc: 'Hardware, capacities & credit hourly rates' },
                    { col: 'reservations', count: 48, desc: 'Active, upcoming and past reservations' },
                    { col: 'workspaces', count: 24, desc: 'Private cabins, pods & flex desks' },
                    { col: 'invoices', count: 34, desc: 'Credit top-ups and lease billing logs' },
                    { col: 'members', count: 142, desc: 'Founders, teams & guest passes' }
                  ].map((c) => (
                    <div key={c.col} className="p-4 rounded-xl border border-[#ECEEF4] bg-[#F8F9FD] hover:border-[#4F3FE0] transition-colors">
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-xs font-bold text-[#4F3FE0]">{c.col}</span>
                        <span className="bg-white px-2 py-0.5 rounded-full text-[10px] font-bold text-[#111827] border border-[#ECEEF4]">
                          {c.count} docs
                        </span>
                      </div>
                      <p className="text-[11px] text-[#8A90A2] mt-1.5">{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeNav === 'Settings' && (
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft space-y-4 animate-fadeIn">
              <h2 className="text-2xl font-black text-[#111827]">Preferences &amp; Integrations</h2>
              <p className="text-xs text-[#8A90A2]">Calendar synchronization, notifications and security</p>
            </div>
          )}
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalRoom && (
        <BookingModal
          room={bookingModalRoom}
          selectedDate={selectedDate}
          selectedTime={selectedTime}
          selectedPeople={selectedPeople}
          onClose={() => setBookingModalRoom(null)}
          onConfirm={handleConfirmBooking}
        />
      )}

      {/* Toast Feedback */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-gray-700 z-50 flex items-center gap-2 animate-bounce">
          <span>⚡</span>
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
