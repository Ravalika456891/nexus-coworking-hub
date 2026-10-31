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
  UserPlus,
  Coins,
  ChevronRight,
  TrendingUp,
  Gift,
  Crown,
  BarChart3,
  ArrowRight,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Search,
  X
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

  // My Bookings Filtering & Modal States
  const [bookingsFilterTab, setBookingsFilterTab] = useState<string>('All Bookings');
  const [bookingsSearchQuery, setBookingsSearchQuery] = useState<string>('');
  const [bookingsRoomFilter, setBookingsRoomFilter] = useState<string>('All Rooms');
  const [bookingsDateFilter, setBookingsDateFilter] = useState<string>('All Dates');
  const [rescheduleBooking, setRescheduleBooking] = useState<UpcomingBooking | null>(null);
  const [rescheduleNewDate, setRescheduleNewDate] = useState<string>('2026-11-04');
  const [rescheduleNewTime, setRescheduleNewTime] = useState<string>('02:00 PM – 03:30 PM');
  const [rescheduleNewRoom, setRescheduleNewRoom] = useState<string>('');
  const [cancelModalBooking, setCancelModalBooking] = useState<UpcomingBooking | null>(null);
  const [detailsModalBooking, setDetailsModalBooking] = useState<UpcomingBooking | null>(null);

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
      if (hash === 'bookings' || hash === 'myreservations' || hash === 'mybookings' || hash === 'reservations') {
        setActiveNav('My Bookings');
        return;
      }
      const validTabs = [
        'Dashboard',
        'Meeting Rooms',
        'My Bookings',
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
              {/* Section 4: Premium Welcome Banner with Modern Meeting Room Photography */}
              <div className="relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[190px] sm:min-h-[200px] sm:max-h-[230px]">
                {/* Smooth White-to-Lavender Gradient Overlay on Left */}
                <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[#F6F4FF]/75 to-transparent z-10 w-full sm:w-[65%]" />

                {/* Attractive Meeting Room Photography on Right */}
                <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[55%] h-full z-0 overflow-hidden">
                  <img
                    src="/assets/rooms/banner-hero.jpg"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80';
                    }}
                    alt="NEXUS HUB Modern Meeting Space"
                    className="w-full h-full object-cover object-center"
                  />
                  <div className="absolute inset-0 bg-gradient-to-r from-[#F6F4FF]/60 via-transparent to-black/10" />
                </div>

                {/* Banner Left Content */}
                <div className="relative z-20 p-6 sm:p-8 max-w-[580px]">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEBFF] text-[#4F3FE0] text-xs font-bold mb-2">
                    <span className="w-2 h-2 rounded-full bg-[#4F3FE0] animate-pulse"></span>
                    <span>Sat, 31 Oct 2026 • XYZ Technologies</span>
                  </div>

                  <h2 className="text-2xl lg:text-3xl font-black text-[#111827] tracking-tight">
                    {getGreeting()}, Alex!
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
                    Here&apos;s what&apos;s happening at <strong>XYZ Technologies</strong> today.
                  </p>

                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={() => navigateTo('Meeting Rooms')}
                      className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm flex items-center gap-2 hover:shadow-md"
                    >
                      <span className="text-sm font-bold">+</span>
                      <span>Reserve Space</span>
                    </button>
                    <button
                      onClick={() => navigateTo('Calendar')}
                      className="bg-white/90 backdrop-blur-xs border border-[#ECEEF4] text-[#374151] hover:text-[#4F3FE0] hover:bg-white text-xs font-semibold px-4 py-2.5 rounded-xl transition-all"
                    >
                      View Calendar
                    </button>
                  </div>
                </div>
              </div>

              {/* Top Section: Four Elevated KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Card 1: Upcoming Meetings */}
                <div
                  onClick={() => navigateTo('My Bookings')}
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
                        onClick={() => navigateTo('My Bookings')}
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

          {/* ── 3. BOOKINGS VIEW (Command Center Alignment) ── */}
          {(activeNav === 'My Bookings' || activeNav === 'Bookings' || activeNav === 'My Reservations') && (() => {
            const totalCount = upcomingBookings.length;
            const confirmedCount = upcomingBookings.filter(b => b.status === 'Confirmed').length;
            const pendingCount = upcomingBookings.filter(b => b.status === 'Pending').length;
            const cancelledCount = upcomingBookings.filter(b => b.status === 'Cancelled').length;

            const filteredBookings = upcomingBookings.filter(bkg => {
              if (bookingsFilterTab !== 'All Bookings' && bkg.status !== bookingsFilterTab) {
                return false;
              }
              if (bookingsSearchQuery.trim()) {
                const q = bookingsSearchQuery.toLowerCase();
                const matchTitle = (bkg.title || '').toLowerCase().includes(q);
                const matchRoom = (bkg.room || '').toLowerCase().includes(q);
                const matchResId = (bkg.resId || '').toLowerCase().includes(q);
                if (!matchTitle && !matchRoom && !matchResId) return false;
              }
              if (bookingsRoomFilter !== 'All Rooms' && bkg.room !== bookingsRoomFilter) {
                return false;
              }
              if (bookingsDateFilter === 'Today' && bkg.date !== 'Today') return false;
              if (bookingsDateFilter === 'Upcoming' && (bkg.status === 'Cancelled' || bkg.status === 'Completed')) return false;
              if (bookingsDateFilter === 'Past' && bkg.status !== 'Completed' && bkg.status !== 'Cancelled') return false;
              return true;
            });

            const isFilterActive = bookingsSearchQuery || bookingsRoomFilter !== 'All Rooms' || bookingsDateFilter !== 'All Dates' || bookingsFilterTab !== 'All Bookings';

            return (
              <div className="space-y-6 animate-fadeIn">
                {/* Section 2: Page Header with Room Photo & Purple Gradient */}
                <div className="relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[150px] sm:min-h-[170px] max-h-[190px]">
                  <div className="absolute inset-0 bg-gradient-to-r from-white via-white/95 via-[#F6F4FF]/75 to-transparent z-10 w-full sm:w-[65%]" />

                  <div className="absolute right-0 top-0 bottom-0 w-full sm:w-[50%] h-full z-0 overflow-hidden">
                    <img
                      src="/assets/rooms/banner-hero.jpg"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.onerror = null;
                        target.src = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80';
                      }}
                      alt="NEXUS HUB Modern Meeting Space"
                      className="w-full h-full object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-[#F6F4FF]/60 via-transparent to-black/10" />
                  </div>

                  <div className="relative z-20 p-6 sm:p-7 max-w-[580px]">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#EEEBFF] text-[#4F3FE0] text-[11px] font-bold mb-2">
                      <span className="w-2 h-2 rounded-full bg-[#4F3FE0] animate-pulse"></span>
                      <span>RESERVATION COMMAND CENTER • XYZ TECHNOLOGIES</span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                      My Bookings &amp; Reservations
                    </h2>
                    <p className="text-xs sm:text-sm text-[#64748B] mt-1 leading-relaxed">
                      Manage, track and modify your meeting room bookings all in one place.
                    </p>

                    <div className="mt-3.5">
                      <button
                        onClick={() => navigateTo('Meeting Rooms')}
                        className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white text-xs font-bold px-5 py-2.5 rounded-xl transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-2"
                      >
                        <span className="text-sm font-bold">+</span>
                        <span>Book a Meeting Room</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Section 3: Four Booking Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Card 1: Total Bookings */}
                  <div
                    onClick={() => setBookingsFilterTab('All Bookings')}
                    className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[#8A90A2]">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">Total Bookings</span>
                      <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#4F3FE0] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Calendar className="w-5 h-5 text-[#4F3FE0]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#111827] mt-2">
                      {totalCount}
                    </div>
                    <div className="text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#4F3FE0]"></span>
                      <span>All scheduled sessions</span>
                    </div>
                  </div>

                  {/* Card 2: Confirmed */}
                  <div
                    onClick={() => setBookingsFilterTab('Confirmed')}
                    className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[#8A90A2]">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">Confirmed</span>
                      <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A66A] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <CheckCircle2 className="w-5 h-5 text-[#16A66A]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#16A66A] mt-2">
                      {confirmedCount}
                    </div>
                    <div className="text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#16A66A]"></span>
                      <span>Guaranteed active slots</span>
                    </div>
                  </div>

                  {/* Card 3: Pending */}
                  <div
                    onClick={() => setBookingsFilterTab('Pending')}
                    className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[#8A90A2]">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">Pending</span>
                      <div className="w-9 h-9 rounded-xl bg-amber-50 text-[#F59E0B] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Clock className="w-5 h-5 text-[#F59E0B]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#F59E0B] mt-2">
                      {pendingCount}
                    </div>
                    <div className="text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B]"></span>
                      <span>Awaiting admin review</span>
                    </div>
                  </div>

                  {/* Card 4: Cancelled */}
                  <div
                    onClick={() => setBookingsFilterTab('Cancelled')}
                    className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between text-[#8A90A2]">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#64748B]">Cancelled</span>
                      <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center group-hover:scale-105 transition-transform">
                        <XCircle className="w-5 h-5 text-[#EF4444]" />
                      </div>
                    </div>
                    <div className="text-3xl font-black text-[#EF4444] mt-2">
                      {cancelledCount}
                    </div>
                    <div className="text-[11px] font-medium text-[#8A90A2] mt-1 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444]"></span>
                      <span>Released &amp; refunded</span>
                    </div>
                  </div>
                </div>

                {/* Section 4: Booking Filter Tabs */}
                <div className="flex items-center justify-between flex-wrap gap-3 pt-1">
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full">
                    {['All Bookings', 'Confirmed', 'Pending', 'Cancelled', 'Completed'].map((tab) => {
                      const isActive = bookingsFilterTab === tab;
                      return (
                        <button
                          key={tab}
                          onClick={() => setBookingsFilterTab(tab)}
                          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                            isActive
                              ? 'bg-[#4F3FE0] text-white shadow-xs'
                              : 'bg-white border border-[#ECEEF4] text-[#64748B] hover:text-[#111827] hover:bg-[#F8FAFC]'
                          }`}
                        >
                          <span>{tab}</span>
                          <span
                            className={`ml-2 text-[10.5px] px-1.5 py-0.2 rounded-full font-extrabold ${
                              isActive ? 'bg-white/20 text-white' : 'bg-gray-100 text-[#64748B]'
                            }`}
                          >
                            {tab === 'All Bookings'
                              ? totalCount
                              : upcomingBookings.filter((b) => b.status === tab).length}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="text-xs font-semibold text-[#8A90A2]">
                    Showing <strong className="text-[#111827]">{filteredBookings.length}</strong> of {totalCount} reservations
                  </div>
                </div>

                {/* Section 5: Search and Filter Controls Toolbar */}
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-soft flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-3 flex-1 min-w-[260px]">
                    <div className="relative flex-1">
                      <Search className="w-4 h-4 text-[#8A90A2] absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        value={bookingsSearchQuery}
                        onChange={(e) => setBookingsSearchQuery(e.target.value)}
                        placeholder="Search by meeting title, room, or #RES ID..."
                        className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl pl-10 pr-4 py-2 text-xs text-[#111827] placeholder-[#8A90A2] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
                      />
                      {bookingsSearchQuery && (
                        <button
                          onClick={() => setBookingsSearchQuery('')}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5 flex-wrap">
                    {/* Date Filter */}
                    <div className="flex items-center gap-1.5 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3 py-1.5 text-xs text-[#374151]">
                      <Calendar className="w-3.5 h-3.5 text-[#8A90A2]" />
                      <select
                        value={bookingsDateFilter}
                        onChange={(e) => setBookingsDateFilter(e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold text-[#374151] focus:outline-none cursor-pointer"
                      >
                        <option value="All Dates">All Dates</option>
                        <option value="Today">Today Only</option>
                        <option value="Upcoming">Upcoming Only</option>
                        <option value="Past">Past / Archived</option>
                      </select>
                    </div>

                    {/* Room Filter */}
                    <div className="flex items-center gap-1.5 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3 py-1.5 text-xs text-[#374151]">
                      <Building className="w-3.5 h-3.5 text-[#8A90A2]" />
                      <select
                        value={bookingsRoomFilter}
                        onChange={(e) => setBookingsRoomFilter(e.target.value)}
                        className="bg-transparent border-none text-xs font-semibold text-[#374151] focus:outline-none cursor-pointer"
                      >
                        <option value="All Rooms">All Rooms</option>
                        {rooms.map((r) => (
                          <option key={r.id} value={r.name}>{r.name}</option>
                        ))}
                      </select>
                    </div>

                    {/* Clear Filters Button */}
                    {isFilterActive && (
                      <button
                        type="button"
                        onClick={() => {
                          setBookingsSearchQuery('');
                          setBookingsRoomFilter('All Rooms');
                          setBookingsDateFilter('All Dates');
                          setBookingsFilterTab('All Bookings');
                        }}
                        className="text-xs font-bold text-[#EF4444] hover:bg-rose-50 px-3 py-1.5 rounded-xl border border-rose-200 transition-all flex items-center gap-1"
                      >
                        <X className="w-3 h-3" />
                        <span>Clear Filters</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Section 6 & 8 & 9: Main Content 2-Column Section */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  {/* Left Column (8 cols): Reservation Cards */}
                  <div className="lg:col-span-8 space-y-3.5">
                    {filteredBookings.length === 0 ? (
                      <div className="bg-white border border-[#ECEEF4] rounded-2xl p-12 text-center shadow-soft">
                        <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center mx-auto mb-3">
                          <Calendar className="w-7 h-7 text-gray-400" />
                        </div>
                        <h4 className="text-base font-bold text-[#111827]">No reservations match your filters</h4>
                        <p className="text-xs text-[#8A90A2] mt-1 max-w-sm mx-auto">
                          Try resetting your search query or selecting a different status tab.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            setBookingsSearchQuery('');
                            setBookingsRoomFilter('All Rooms');
                            setBookingsDateFilter('All Dates');
                            setBookingsFilterTab('All Bookings');
                          }}
                          className="mt-4 px-4 py-2 bg-[#4F3FE0] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-[#4335C9]"
                        >
                          Reset All Filters
                        </button>
                      </div>
                    ) : (
                      filteredBookings.map((bkg) => {
                        const isCancelled = bkg.status === 'Cancelled';
                        const isCompleted = bkg.status === 'Completed';
                        const canModify = !isCancelled && !isCompleted;

                        return (
                          <div
                            key={bkg.id}
                            className="bg-white border border-[#ECEEF4] rounded-2xl p-4 sm:p-5 shadow-soft hover:shadow-card hover:-translate-y-0.5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 group"
                          >
                            {/* Left Section: Date Badge & Meeting Room Thumbnail */}
                            <div className="flex items-center gap-3.5 flex-shrink-0">
                              <div className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl px-2.5 py-2 text-center min-w-[54px] flex flex-col items-center justify-center flex-shrink-0">
                                <span className="text-lg font-black text-[#111827] leading-none">
                                  {bkg.day || '30'}
                                </span>
                                <span className="text-[10px] font-extrabold text-[#4F3FE0] tracking-wider uppercase mt-1 leading-none">
                                  {bkg.month || 'OCT'}
                                </span>
                              </div>

                              <div
                                onClick={() => setDetailsModalBooking(bkg)}
                                className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden border border-[#ECEEF4] relative flex-shrink-0 cursor-pointer group-hover:border-[#4F3FE0]/40 transition-all"
                                title={`View room details for ${bkg.room}`}
                              >
                                <img
                                  src={bkg.roomImage || '/assets/rooms/mr-01-main.jpg'}
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.onerror = null;
                                    target.src = bkg.fallbackImage || 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=400&q=80';
                                  }}
                                  alt={bkg.room}
                                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/5 hover:bg-transparent transition-colors" />
                              </div>
                            </div>

                            {/* Center Section: Meeting Info & Meta */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4
                                  onClick={() => setDetailsModalBooking(bkg)}
                                  className="text-sm sm:text-[15px] font-black text-[#111827] truncate hover:text-[#4F3FE0] cursor-pointer"
                                >
                                  {bkg.title}
                                </h4>
                                {bkg.isRecurring && (
                                  <span className="bg-[#F4F2FF] border border-[#E3DEFF] text-[#4F3FE0] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                                    <span>🔄</span>
                                    <span>Recurring</span>
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-2.5 text-xs text-[#64748B] mt-1 flex-wrap">
                                <span className="font-bold text-[#374151] flex items-center gap-1">
                                  <span>📍</span>
                                  <span>{bkg.room}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span>🕒</span>
                                  <span>{bkg.time}</span>
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-1">
                                  <span>👥</span>
                                  <span>{bkg.attendees} attendees</span>
                                </span>
                                <span>•</span>
                                <span className="text-[#4F3FE0] font-bold">
                                  🪙 {bkg.credits || 18} cr
                                </span>
                                {bkg.resId && (
                                  <span className="text-[10px] text-[#8A90A2] font-mono bg-gray-50 px-1.5 py-0.2 rounded border border-[#ECEEF4]">
                                    #{bkg.resId}
                                  </span>
                                )}
                              </div>

                              {bkg.purpose && (
                                <p className="text-[11px] text-[#8A90A2] mt-1 line-clamp-1 italic">
                                  &ldquo;{bkg.purpose}&rdquo;
                                </p>
                              )}
                            </div>

                            {/* Right Section: Status Pill & Action Buttons */}
                            <div className="flex items-center gap-2 sm:gap-2.5 flex-wrap sm:flex-nowrap justify-between sm:justify-end pt-2 sm:pt-0 border-t sm:border-t-0 border-[#ECEEF4]">
                              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${bkg.statusColor || 'bg-gray-100 text-gray-700'}`}>
                                {bkg.status}
                              </span>

                              {canModify ? (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setRescheduleBooking(bkg);
                                      setRescheduleNewRoom(bkg.room);
                                      setRescheduleNewTime(bkg.time);
                                    }}
                                    className="border border-[#ECEEF4] hover:bg-[#F8FAFC] hover:border-[#4F3FE0]/40 text-[#374151] hover:text-[#4F3FE0] px-3 py-1.5 rounded-xl text-xs font-bold transition-all"
                                  >
                                    Reschedule
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setCancelModalBooking(bkg)}
                                    className="text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-200 text-xs font-bold px-2.5 py-1.5 rounded-xl transition-all"
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <span className="text-[11px] font-medium text-[#8A90A2] italic px-1">
                                  {isCancelled ? 'Slot Released' : 'Completed'}
                                </span>
                              )}

                              <button
                                type="button"
                                onClick={() => setDetailsModalBooking(bkg)}
                                className="text-xs font-bold text-[#4F3FE0] hover:bg-[#EEEBFF] px-2.5 py-1.5 rounded-xl transition-all"
                                title="View full booking details"
                              >
                                Details &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Right Column (4 cols): Upcoming Schedule Sidebar + Quick Actions */}
                  <div className="lg:col-span-4 space-y-6">
                    {/* Section 8: Upcoming Schedule Sidebar */}
                    <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                      <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4] mb-3">
                        <h4 className="text-xs font-black uppercase tracking-wider text-[#111827] flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-[#4F3FE0]"></span>
                          <span>Upcoming Schedule</span>
                        </h4>
                        <button
                          type="button"
                          onClick={() => navigateTo('Calendar')}
                          className="text-xs font-bold text-[#4F3FE0] hover:underline"
                        >
                          View Calendar &rarr;
                        </button>
                      </div>

                      <div className="relative pl-4 space-y-4">
                        <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-[#ECEEF4]" />

                        {upcomingBookings
                          .filter((b) => b.status === 'Confirmed' || b.status === 'Pending')
                          .slice(0, 4)
                          .map((item) => (
                            <div
                              key={item.id}
                              className="relative group cursor-pointer"
                              onClick={() => setDetailsModalBooking(item)}
                            >
                              <div
                                className={`absolute -left-4 top-1.5 w-2.5 h-2.5 rounded-full border-2 border-white shadow-xs ${
                                  item.status === 'Confirmed' ? 'bg-[#16A66A]' : 'bg-[#F59E0B]'
                                }`}
                              />

                              <div className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-3 hover:bg-white hover:border-[#4F3FE0]/30 hover:shadow-xs transition-all">
                                <div className="flex items-center justify-between text-[11px] mb-1">
                                  <span className="font-bold text-[#4F3FE0]">
                                    {item.date} • {item.time.split('–')[0].trim()}
                                  </span>
                                  <span
                                    className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                                      item.status === 'Confirmed'
                                        ? 'bg-emerald-50 text-emerald-600'
                                        : 'bg-amber-50 text-amber-600'
                                    }`}
                                  >
                                    {item.status}
                                  </span>
                                </div>
                                <div className="text-xs font-bold text-[#111827] truncate">{item.title}</div>
                                <div className="text-[11px] text-[#8A90A2] mt-0.5 truncate flex items-center gap-1">
                                  <span>📍 {item.room}</span>
                                  <span>•</span>
                                  <span>👥 {item.attendees}</span>
                                </div>
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>

                    {/* Section 9: Quick Actions Panel */}
                    <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                      <h4 className="text-xs font-black uppercase tracking-wider text-[#111827] mb-3 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-yellow-50 text-yellow-600 flex items-center justify-center">
                          ⚡
                        </span>
                        <span>Quick Actions</span>
                      </h4>

                      <div className="grid grid-cols-2 gap-2.5">
                        <button
                          type="button"
                          onClick={() => setBookingModalRoom(rooms[0])}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#F3EFFE] hover:border-[#6E42E5]/30 transition-all text-center group"
                        >
                          <span className="w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                            <Calendar className="w-4 h-4 text-[#6E42E5]" />
                          </span>
                          <div className="text-xs font-bold text-[#111827]">Book a Room</div>
                          <div className="text-[10px] text-[#8A90A2] mt-0.5">6 Facilities</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Calendar')}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEF5FF] hover:border-[#2B71FF]/30 transition-all text-center group"
                        >
                          <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2B71FF] flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                            <CalendarDays className="w-4 h-4 text-[#2B71FF]" />
                          </span>
                          <div className="text-xs font-bold text-[#111827]">Open Calendar</div>
                          <div className="text-[10px] text-[#8A90A2] mt-0.5">Weekly Grid</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Visitors')}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEFAF3] hover:border-[#12A150]/30 transition-all text-center group"
                        >
                          <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                            <UserPlus className="w-4 h-4 text-emerald-600" />
                          </span>
                          <div className="text-xs font-bold text-[#111827]">Invite Guests</div>
                          <div className="text-[10px] text-[#8A90A2] mt-0.5">QR Gate Pass</div>
                        </button>

                        <button
                          type="button"
                          onClick={() => navigateTo('Meeting Rooms')}
                          className="p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#FFF8EC] hover:border-[#F59E0B]/30 transition-all text-center group"
                        >
                          <span className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-1.5 group-hover:scale-105 transition-transform">
                            <Sparkles className="w-4 h-4 text-amber-600" />
                          </span>
                          <div className="text-xs font-bold text-[#111827]">Check Live</div>
                          <div className="text-[10px] text-[#8A90A2] mt-0.5">5/6 Available</div>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

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

          {/* ── 5. BILLING & CREDITS VIEW (Command Center Alignment) ── */}
          {activeNav === 'Billing & Credits' && (
            <div className="space-y-6 animate-fadeIn">
              {/* Top Page Header with 3D Card Illustration and Purchase Button */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <div className="text-[11px] font-extrabold tracking-wider text-[#8A90A2] uppercase mb-1">
                    Billing &amp; Credits
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-black text-[#111827] tracking-tight">
                    Billing &amp; Meeting Room Credits
                  </h2>
                  <p className="text-xs sm:text-sm text-[#64748B] mt-1">
                    Track quota, plans, invoices, and transaction activity
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  {/* 3D Floating Credit Card + Coin Illustration */}
                  <div className="relative w-28 h-16 flex-shrink-0 hidden md:block">
                    <svg viewBox="0 0 140 90" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-md">
                      <ellipse cx="65" cy="45" rx="50" ry="30" fill="#C7D2FE" fillOpacity="0.4" filter="blur(14px)" />
                      <g transform="rotate(-7 55 42)">
                        <rect x="15" y="12" width="82" height="50" rx="9" fill="url(#cardGradNext)" />
                        <rect x="25" y="24" width="13" height="10" rx="2" fill="#FCD34D" />
                        <line x1="25" y1="29" x2="38" y2="29" stroke="#F59E0B" strokeWidth="0.8" />
                        <line x1="31.5" y1="24" x2="31.5" y2="34" stroke="#F59E0B" strokeWidth="0.8" />
                        <rect x="25" y="44" width="36" height="4" rx="2" fill="white" fillOpacity="0.85" />
                        <circle cx="80" cy="44" r="5.5" fill="#F472B6" fillOpacity="0.85" />
                        <circle cx="87" cy="44" r="5.5" fill="#FBBF24" fillOpacity="0.85" />
                      </g>
                      <g transform="translate(88, 40)">
                        <circle cx="15" cy="15" r="13" fill="#FBBF24" stroke="#F59E0B" strokeWidth="1.2" />
                        <circle cx="15" cy="15" r="9.5" fill="#FDE68A" />
                        <text x="15" y="19" fontSize="11" fontWeight="bold" textAnchor="middle" fill="#D97706">₹</text>
                      </g>
                      <circle cx="18" cy="20" r="2.5" fill="#818CF8" fillOpacity="0.8" />
                      <circle cx="106" cy="16" r="2" fill="#60A5FA" fillOpacity="0.8" />
                      <circle cx="98" cy="74" r="1.8" fill="#FCD34D" fillOpacity="0.9" />
                      <defs>
                        <linearGradient id="cardGradNext" x1="15" y1="12" x2="97" y2="62" gradientUnits="userSpaceOnUse">
                          <stop stopColor="#6366F1" />
                          <stop offset="0.5" stopColor="#4F46E5" />
                          <stop offset="1" stopColor="#3B82F6" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>

                  {/* Primary CTA Button */}
                  <button
                    type="button"
                    onClick={() => showToast('Opening instant credit top-up checkout')}
                    className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-5 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all shadow-sm hover:shadow-md active:scale-[0.98] flex items-center gap-1.5"
                  >
                    <span>+ Purchase Extra Credits</span>
                  </button>
                </div>
              </div>

              {/* Section: Three KPI Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Card 1: Remaining Balance */}
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#F3EFFE] text-[#4F3FE0] flex items-center justify-center flex-shrink-0">
                          <Coins className="w-5 h-5 text-[#4F3FE0]" />
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]">Remaining Balance</span>
                          <div className="text-2xl sm:text-3xl font-black text-[#111827] mt-0.5">80 credits</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#A0AEC0]" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] mt-4 font-medium">
                      <span>Out of 120 credits total quota</span>
                      <span className="font-bold text-[#4F3FE0]">67% left</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#EEEBFF] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#5937F5] to-[#4F3FE0] rounded-full w-[67%]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-[#8A90A2] pt-3 mt-3 border-t border-[#ECEEF4]">
                    <span>40 credits used</span>
                    <span>120 total</span>
                  </div>
                </div>

                {/* Card 2: Monthly Free Hours */}
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#ECFDF5] text-[#059669] flex items-center justify-center flex-shrink-0">
                          <Clock className="w-5 h-5 text-[#059669]" />
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]">Monthly Free Hours</span>
                          <div className="text-2xl sm:text-3xl font-black text-[#059669] mt-0.5">2.0 hrs left</div>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-[#A0AEC0]" />
                    </div>

                    <div className="flex items-center justify-between text-xs text-[#64748B] mt-4 font-medium">
                      <span>8 / 10 hours consumed</span>
                      <span className="font-bold text-[#059669]">20% left</span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2 bg-[#E6F4EA] rounded-full mt-2 overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#10B981] to-[#059669] rounded-full w-[20%]" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[11px] font-medium text-[#8A90A2] pt-3 mt-3 border-t border-[#ECEEF4]">
                    <span>8 hrs used</span>
                    <span>10 hrs total</span>
                  </div>
                </div>

                {/* Card 3: Subscription Plan */}
                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between hover:shadow-card transition-all">
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] flex items-center justify-center flex-shrink-0">
                          <Crown className="w-5 h-5 text-[#D97706]" />
                        </div>
                        <div>
                          <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#8A90A2]">Subscription Plan</span>
                          <div className="text-xl sm:text-2xl font-black text-[#111827] mt-0.5">Scale-up Venture</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="bg-[#ECFDF5] text-[#059669] text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          ● ACTIVE
                        </span>
                        <ChevronRight className="w-4 h-4 text-[#A0AEC0]" />
                      </div>
                    </div>

                    <p className="text-xs text-[#64748B] mt-3 font-medium">
                      Renews automatically on Nov 1, 2026
                    </p>
                  </div>

                  {/* 3 mini items */}
                  <div className="grid grid-cols-3 gap-2 pt-3 mt-3 border-t border-[#ECEEF4] text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#374151]">
                      <span className="text-base">📅</span>
                      <div>
                        <span className="block text-[9.5px] font-semibold text-[#8A90A2] uppercase">Monthly</span>
                        <span className="font-bold text-[#111827]">10 free hrs</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#374151]">
                      <span className="text-base">🪙</span>
                      <div>
                        <span className="block text-[9.5px] font-semibold text-[#8A90A2] uppercase">Base quota</span>
                        <span className="font-bold text-[#111827]">120 credits</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#374151]">
                      <span className="text-base">⭐</span>
                      <div>
                        <span className="block text-[9.5px] font-semibold text-[#8A90A2] uppercase">Extra credits</span>
                        <span className="font-bold text-[#111827]">₹500 / 10 cr</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Section: Main 2-Column Layout */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                {/* Left Column (5 cols): Donut Chart & Plan Details */}
                <div className="lg:col-span-5 space-y-6">
                  {/* Card: Credit Usage This Month */}
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center">
                          <BarChart3 className="w-3.5 h-3.5 text-[#4F3FE0]" />
                        </span>
                        <span>Credit Usage This Month</span>
                      </h4>
                      <span className="text-xs font-semibold text-[#374151] bg-[#F8FAFC] border border-[#ECEEF4] px-2.5 py-1 rounded-lg">
                        October 2026 ▾
                      </span>
                    </div>

                    {/* Donut and Legend */}
                    <div className="flex flex-col sm:flex-row items-center gap-6 my-2">
                      {/* Circular SVG Donut */}
                      <div className="relative w-36 h-36 flex items-center justify-center flex-shrink-0">
                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            stroke="#EEEBFF"
                            strokeWidth="13"
                            fill="transparent"
                          />
                          <circle
                            cx="60"
                            cy="60"
                            r="48"
                            stroke="#4F3FE0"
                            strokeWidth="13"
                            strokeDasharray="301.59"
                            strokeDashoffset="202.06"
                            strokeLinecap="round"
                            fill="transparent"
                            className="transition-all duration-700 ease-out"
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                          <span className="text-2xl font-black text-[#111827] tracking-tight">120</span>
                          <span className="text-[10px] font-semibold text-[#8A90A2]">Total Credits</span>
                        </div>
                      </div>

                      {/* Legend */}
                      <div className="space-y-3 w-full">
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-[#111827]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#4F3FE0]" />
                            <span>40 credits used</span>
                          </div>
                          <span className="font-semibold text-[#8A90A2]">33%</span>
                        </div>
                        <div className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2 font-bold text-[#111827]">
                            <span className="w-2.5 h-2.5 rounded-full bg-[#818CF8]" />
                            <span>80 credits remaining</span>
                          </div>
                          <span className="font-semibold text-[#8A90A2]">67%</span>
                        </div>
                      </div>
                    </div>

                    {/* On Track Callout Card */}
                    <div className="mt-5 bg-[#F5F3FF] border border-[#E0E7FF] rounded-xl p-3.5 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-[#4338CA] flex items-center justify-center flex-shrink-0 font-bold">
                        <TrendingUp className="w-4 h-4 text-[#4338CA]" />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-[#4338CA]">You&apos;re on track!</div>
                        <div className="text-[11px] text-[#6366F1] mt-0.5">67% of your monthly quota is still available.</div>
                      </div>
                    </div>
                  </div>

                  {/* Card: Plan & Billing Details */}
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center">
                          <FileText className="w-3.5 h-3.5 text-[#4F3FE0]" />
                        </span>
                        <span>Plan &amp; Billing Details</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => showToast('Viewing full subscription tier specifications')}
                        className="text-xs font-bold text-[#4F3FE0] hover:underline"
                      >
                        View Plan &rarr;
                      </button>
                    </div>

                    {/* 3 Detail columns */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <div className="text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1">
                          <span>📅</span> Next Renewal
                        </div>
                        <div className="text-xs font-bold text-[#111827] mt-1">Nov 1, 2026</div>
                        <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Auto-renew enabled</div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <div className="text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1">
                          <span>📄</span> Last Invoice
                        </div>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className="text-xs font-bold text-[#111827]">INV-2026-1028</span>
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.2 rounded">
                            Paid
                          </span>
                        </div>
                        <div className="text-[10px] text-[#8A90A2] mt-0.5">28 Oct 2026</div>
                      </div>

                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <div className="text-[10px] font-semibold text-[#8A90A2] uppercase flex items-center gap-1">
                          <span>🪙</span> Extra Credits Price
                        </div>
                        <div className="text-xs font-bold text-[#111827] mt-1">₹500 / 10 credits</div>
                        <div className="text-[10px] text-[#8A90A2] mt-0.5">Buy additional credits anytime</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column (7 cols): Recent Credit Ledger */}
                <div className="lg:col-span-7">
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-black text-[#111827] flex items-center gap-2">
                        <span className="w-6 h-6 rounded-lg bg-purple-50 text-[#4F3FE0] flex items-center justify-center">
                          <Bookmark className="w-3.5 h-3.5 text-[#4F3FE0]" />
                        </span>
                        <span>Recent Credit Ledger</span>
                      </h4>
                      <button
                        type="button"
                        onClick={() => showToast('Opening full audit ledger with filter controls')}
                        className="text-xs font-bold text-[#4F3FE0] hover:underline"
                      >
                        View All &rarr;
                      </button>
                    </div>

                    {/* List of 5 transactions */}
                    <div className="divide-y divide-[#ECEEF4]">
                      {[
                        {
                          title: 'Session in Collaboration Room',
                          date: 'Today, 03:30 PM',
                          credits: '-18 credits',
                          hours: '-1.5 hrs',
                          icon: Calendar,
                          iconBg: 'bg-blue-50 text-[#2563EB]'
                        },
                        {
                          title: 'Client Meeting in Pitch Arena Nexus',
                          date: '28 Oct 2026, 11:30 AM',
                          credits: '-25 credits',
                          hours: '-1.5 hrs',
                          icon: Users,
                          iconBg: 'bg-purple-50 text-[#6E42E5]'
                        },
                        {
                          title: 'Monthly Incubator Quota Credited',
                          date: '01 Oct 2026, 12:00 AM',
                          credits: '+120 credits',
                          hours: '+10.0 hrs',
                          icon: Gift,
                          iconBg: 'bg-emerald-50 text-[#059669]',
                          isCredit: true
                        },
                        {
                          title: 'Team Sync in Focus Room',
                          date: '27 Oct 2026, 02:00 PM',
                          credits: '-12 credits',
                          hours: '-1.0 hrs',
                          icon: Calendar,
                          iconBg: 'bg-blue-50 text-[#2563EB]'
                        },
                        {
                          title: 'Product Planning - Boardroom Alpha',
                          date: '26 Oct 2026, 09:00 AM',
                          credits: '-20 credits',
                          hours: '-2.0 hrs',
                          icon: Users,
                          iconBg: 'bg-purple-50 text-[#6E42E5]'
                        }
                      ].map((tx, idx) => {
                        const TxIcon = tx.icon;
                        return (
                          <div key={idx} className="py-3.5 flex items-center justify-between hover:bg-[#F8FAFC] px-2 rounded-xl transition-all">
                            <div className="flex items-center gap-3.5">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${tx.iconBg}`}>
                                <TxIcon className="w-5 h-5" />
                              </div>
                              <div>
                                <div className="text-xs font-bold text-[#111827]">{tx.title}</div>
                                <div className="text-[11px] text-[#8A90A2] mt-0.5">{tx.date}</div>
                              </div>
                            </div>
                            <div className="text-right">
                              <div className={`text-xs font-bold ${tx.isCredit ? 'text-emerald-600 font-extrabold' : 'text-[#111827]'}`}>
                                {tx.credits}
                              </div>
                              <div className={`text-[11px] ${tx.isCredit ? 'text-emerald-600 font-medium' : 'text-[#8A90A2]'}`}>
                                {tx.hours}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
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

      {/* Reschedule Modal */}
      {rescheduleBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
              <div>
                <h3 className="text-lg font-black text-[#111827]">Reschedule Reservation</h3>
                <p className="text-xs text-[#8A90A2]">Modify slot timing or choose an alternate meeting facility</p>
              </div>
              <button
                onClick={() => setRescheduleBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                setUpcomingBookings((prev) =>
                  prev.map((b) => {
                    if (b.id === rescheduleBooking.id) {
                      return {
                        ...b,
                        date: rescheduleNewDate,
                        fullDate: rescheduleNewDate,
                        time: rescheduleNewTime,
                        room: rescheduleNewRoom || b.room,
                        status: 'Confirmed',
                        statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      };
                    }
                    return b;
                  })
                );
                showToast(`✅ Reservation #${rescheduleBooking.resId} rescheduled to ${rescheduleNewDate} at ${rescheduleNewTime}`);
                setRescheduleBooking(null);
              }}
              className="py-4 space-y-4"
            >
              <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl text-xs space-y-1">
                <div className="font-bold text-[#111827] flex items-center justify-between">
                  <span>{rescheduleBooking.title}</span>
                  <span className="text-[#8A90A2] font-mono">#{rescheduleBooking.resId}</span>
                </div>
                <div className="text-[#64748B]">
                  Current: <strong>{rescheduleBooking.room}</strong> on {rescheduleBooking.fullDate || rescheduleBooking.date} at {rescheduleBooking.time}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Select New Date</label>
                <input
                  type="date"
                  value={rescheduleNewDate}
                  onChange={(e) => setRescheduleNewDate(e.target.value)}
                  className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Select New Time Slot</label>
                <select
                  value={rescheduleNewTime}
                  onChange={(e) => setRescheduleNewTime(e.target.value)}
                  className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
                >
                  <option value="09:00 AM – 10:30 AM">09:00 AM – 10:30 AM (Available)</option>
                  <option value="11:00 AM – 12:30 PM">11:00 AM – 12:30 PM (Available)</option>
                  <option value="02:00 PM – 03:30 PM">02:00 PM – 03:30 PM (Available)</option>
                  <option value="04:00 PM – 05:30 PM">04:00 PM – 05:30 PM (Available)</option>
                  <option value="06:00 PM – 07:30 PM">06:00 PM – 07:30 PM (Available)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Select Meeting Facility</label>
                <select
                  value={rescheduleNewRoom}
                  onChange={(e) => setRescheduleNewRoom(e.target.value)}
                  className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2 text-xs font-semibold text-[#111827] focus:outline-none focus:border-[#4F3FE0] cursor-pointer"
                >
                  {rooms.map((r) => (
                    <option key={r.id} value={r.name}>{r.name} ({r.type} • {r.capacity} seats)</option>
                  ))}
                </select>
              </div>

              <div className="p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl text-xs flex items-center justify-between text-[#4338CA]">
                <span>🪙 Quota Impact:</span>
                <strong className="font-bold">0 cr extra • Pre-authorized quota transferred</strong>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]">
                <button
                  type="button"
                  onClick={() => setRescheduleBooking(null)}
                  className="px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Reschedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Cancellation Confirmation Modal */}
      {cancelModalBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-rose-50 text-[#EF4444] flex items-center justify-center font-bold">
                  <AlertCircle className="w-5 h-5 text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#111827]">Cancel Reservation</h3>
                  <p className="text-[11px] text-[#8A90A2]">Review refund policy before confirming</p>
                </div>
              </div>
              <button
                onClick={() => setCancelModalBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3.5">
              <div className="p-3.5 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl text-xs space-y-1.5">
                <div className="font-bold text-[#111827] text-sm">{cancelModalBooking.title}</div>
                <div className="text-[#64748B] flex items-center gap-1.5">
                  <span>📍 {cancelModalBooking.room}</span>
                  <span>•</span>
                  <span>🕒 {cancelModalBooking.time}</span>
                </div>
                <div className="text-emerald-600 font-bold flex items-center gap-1">
                  <span>🪙 Refund Quote:</span>
                  <span>+{cancelModalBooking.credits || 18} credits returned to balance</span>
                </div>
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 leading-relaxed">
                <strong>NEXUS Cancellation Policy:</strong> Meeting room cancellations confirmed &gt;2 hours in advance receive a <strong>100% full credit refund</strong>. The reserved slot will be released immediately to fellow founders.
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-[#ECEEF4]">
              <button
                type="button"
                onClick={() => setCancelModalBooking(null)}
                className="px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
              >
                Keep Booking
              </button>
              <button
                type="button"
                onClick={() => {
                  setUpcomingBookings((prev) =>
                    prev.map((b) => {
                      if (b.id === cancelModalBooking.id) {
                        return {
                          ...b,
                          status: 'Cancelled',
                          statusColor: 'bg-rose-50 text-rose-600 border border-rose-200',
                          barColor: 'bg-rose-500'
                        };
                      }
                      return b;
                    })
                  );
                  showToast(`Reservation #${cancelModalBooking.resId} cancelled. ${cancelModalBooking.credits || 18} credits refunded.`);
                  setCancelModalBooking(null);
                }}
                className="px-5 py-2 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reservation Details Modal */}
      {detailsModalBooking && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#ECEEF4] relative animate-scaleUp max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
              <div className="flex items-center gap-2.5">
                <span className="text-[11px] font-mono font-bold bg-gray-100 text-[#374151] px-2 py-0.5 rounded border border-[#ECEEF4]">
                  #{detailsModalBooking.resId}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${detailsModalBooking.statusColor}`}>
                  {detailsModalBooking.status}
                </span>
              </div>
              <button
                onClick={() => setDetailsModalBooking(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-4">
              <div className="relative h-32 rounded-xl overflow-hidden border border-[#ECEEF4]">
                <img
                  src={detailsModalBooking.roomImage || '/assets/rooms/mr-01-main.jpg'}
                  alt={detailsModalBooking.room}
                  className="w-full h-full object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-2.5 left-3 text-white">
                  <div className="text-sm font-black">{detailsModalBooking.room}</div>
                  <div className="text-[10.5px] text-gray-200">Level 2 • Collaboration Suite • Ground Floor East Wing</div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-black text-[#111827]">{detailsModalBooking.title}</h3>
                <p className="text-xs text-[#64748B] mt-1 leading-relaxed">
                  {detailsModalBooking.purpose || 'Meeting session scheduled for venture development and collaboration.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                  <div className="text-[10px] font-bold text-[#8A90A2] uppercase">Scheduled Time</div>
                  <div className="font-bold text-[#111827] mt-1">{detailsModalBooking.fullDate || detailsModalBooking.date}</div>
                  <div className="text-[#64748B] text-[11px] mt-0.5">{detailsModalBooking.time}</div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                  <div className="text-[10px] font-bold text-[#8A90A2] uppercase">Party Size</div>
                  <div className="font-bold text-[#111827] mt-1">{detailsModalBooking.attendees} Attendees</div>
                  <div className="text-[#64748B] text-[11px] mt-0.5">Alex Morgan (Host)</div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                  <div className="text-[10px] font-bold text-[#8A90A2] uppercase">Quota Consumed</div>
                  <div className="font-bold text-[#4F3FE0] mt-1">🪙 {detailsModalBooking.credits || 18} credits</div>
                  <div className="text-[10px] text-emerald-600 font-semibold mt-0.5">● Deducted from quota</div>
                </div>

                <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                  <div className="text-[10px] font-bold text-[#8A90A2] uppercase">Calendar Sync</div>
                  <div className="font-bold text-emerald-600 mt-1 flex items-center gap-1">
                    <span>Synced</span>
                    <span>✅</span>
                  </div>
                  <div className="text-[10px] text-[#8A90A2] mt-0.5">Google / Outlook active</div>
                </div>
              </div>

              {detailsModalBooking.isRecurring && (
                <div className="p-3 bg-[#F4F2FF] border border-[#E3DEFF] rounded-xl text-xs flex items-center gap-2 text-[#4F3FE0]">
                  <span className="text-base">🔄</span>
                  <div>
                    <strong>Recurring Series:</strong> {detailsModalBooking.recurringPattern || 'Weekly schedule active'}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-[#ECEEF4]">
              {detailsModalBooking.status !== 'Cancelled' && detailsModalBooking.status !== 'Completed' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailsModalBooking;
                      setDetailsModalBooking(null);
                      setRescheduleBooking(target);
                      setRescheduleNewRoom(target.room);
                      setRescheduleNewTime(target.time);
                    }}
                    className="px-3.5 py-1.5 border border-[#ECEEF4] text-[#374151] hover:text-[#4F3FE0] rounded-xl text-xs font-bold hover:bg-gray-50"
                  >
                    Reschedule
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const target = detailsModalBooking;
                      setDetailsModalBooking(null);
                      setCancelModalBooking(target);
                    }}
                    className="px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 border border-rose-200 rounded-xl text-xs font-bold"
                  >
                    Cancel Booking
                  </button>
                </div>
              ) : (
                <div />
              )}

              <button
                type="button"
                onClick={() => setDetailsModalBooking(null)}
                className="px-5 py-2 bg-[#111827] hover:bg-black text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
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
