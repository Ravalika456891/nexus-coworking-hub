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
  Database
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
              <div className="bg-white border border-[#ECEEF4] rounded-2xl p-6 shadow-soft flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-2xl font-black text-[#111827] flex items-center gap-2">
                    <span>⚡</span> Good evening, Alex!
                  </h2>
                  <p className="text-sm text-[#64748B] mt-1">Here's what's happening at XYZ Technologies today.</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="bg-[#F8FAFC] border border-[#ECEEF4] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#334155]">
                    📅 Fri, 30 Oct 2026
                  </span>
                  <span className="bg-[#EEEBFF] border border-[#E3DEFF] rounded-full px-3.5 py-1.5 text-xs font-bold text-[#4F3FE0]">
                    🚀 Founder Portal
                  </span>
                </div>
              </div>

              {/* 4 Clean KPI Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div
                  onClick={() => navigateTo('Bookings')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider">Upcoming Meetings</span>
                    <div className="w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center">
                      <Calendar className="w-5 h-5 text-[#6E42E5]" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#111827] mt-3">{upcomingBookings.length}</div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-2 pt-2 border-t border-[#ECEEF4]">
                    <span>Today at 03:00 PM</span>
                    <span className="text-[#4F3FE0] font-bold">My Bookings &rarr;</span>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('Meeting Rooms')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider">Available Rooms</span>
                    <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <Building className="w-5 h-5 text-emerald-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#059669] mt-3">
                    5 <span className="text-base text-[#8A90A2] font-semibold">/ 6</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-2 pt-2 border-t border-[#ECEEF4]">
                    <span>Open right now</span>
                    <span className="text-[#4F3FE0] font-bold">Book Room &rarr;</span>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('Billing & Credits')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider">Remaining Credits</span>
                    <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-blue-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#2563eb] mt-3">
                    80 <span className="text-sm font-semibold text-[#8A90A2]">credits</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-2 pt-2 border-t border-[#ECEEF4]">
                    <span>66% quota left</span>
                    <span className="text-[#4F3FE0] font-bold">Billing &rarr;</span>
                  </div>
                </div>

                <div
                  onClick={() => navigateTo('Bookings')}
                  className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft hover:shadow-card hover:-translate-y-1 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-[#8A90A2]">
                    <span className="text-xs font-bold uppercase tracking-wider">Pending Requests</span>
                    <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <Clock className="w-5 h-5 text-amber-600" />
                    </div>
                  </div>
                  <div className="text-3xl font-black text-[#111827] mt-3">0</div>
                  <div className="flex items-center justify-between text-xs text-[#8A90A2] mt-2 pt-2 border-t border-[#ECEEF4]">
                    <span>All approved ✓</span>
                    <span className="text-[#4F3FE0] font-bold">Review &rarr;</span>
                  </div>
                </div>
              </div>

              {/* Middle Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                    <h4 className="text-sm font-black text-[#111827] mb-3">⚡ Quick Actions</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => navigateTo('Meeting Rooms')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#F3EFFE] transition-all text-left"
                      >
                        <span className="w-9 h-9 rounded-xl bg-purple-50 text-[#6E42E5] flex items-center justify-center">📅</span>
                        <div>
                          <div className="text-xs font-bold text-[#111827]">Book a Room</div>
                          <div className="text-[10.5px] text-[#8A90A2]">Conference &amp; Pods</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Bookings')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEF5FF] transition-all text-left"
                      >
                        <span className="w-9 h-9 rounded-xl bg-blue-50 text-[#2B71FF] flex items-center justify-center">📑</span>
                        <div>
                          <div className="text-xs font-bold text-[#111827]">My Bookings</div>
                          <div className="text-[10.5px] text-[#8A90A2]">Active Reservations</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Calendar')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#EEFAF3] transition-all text-left"
                      >
                        <span className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">📆</span>
                        <div>
                          <div className="text-xs font-bold text-[#111827]">Open Calendar</div>
                          <div className="text-[10.5px] text-[#8A90A2]">Schedule Timeline</div>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => navigateTo('Visitors')}
                        className="flex items-center gap-3 p-3 rounded-xl bg-[#F8FAFC] border border-[#ECEEF4] hover:bg-[#FFF5EC] transition-all text-left"
                      >
                        <span className="w-9 h-9 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">👥</span>
                        <div>
                          <div className="text-xs font-bold text-[#111827]">Invite Guests</div>
                          <div className="text-[10.5px] text-[#8A90A2]">Visitor Gate Pass</div>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-sm font-black text-[#111827]">🏢 Venture Facilities Overview</h4>
                      <span className="text-xs font-bold text-[#4F3FE0] cursor-pointer" onClick={() => navigateTo('Workspace & Desks')}>
                        Pod #4 &rarr;
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10.5px] font-bold text-[#8A90A2] uppercase">Active Team</span>
                        <div className="text-base font-black text-[#111827] mt-0.5">8 Members</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10.5px] font-bold text-[#8A90A2] uppercase">Assigned Space</span>
                        <div className="text-base font-black text-[#111827] mt-0.5">Pod #4 (6 Desks)</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10.5px] font-bold text-[#8A90A2] uppercase">Invoices Due</span>
                        <div className="text-base font-black text-emerald-600 mt-0.5">All Settled ✓</div>
                      </div>
                      <div className="p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                        <span className="text-[10.5px] font-bold text-[#8A90A2] uppercase">Next Milestone</span>
                        <div className="text-sm font-black text-[#4F3FE0] mt-0.5">Beta Prototype (Nov 15)</div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-soft flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h4 className="text-sm font-black text-[#111827]">🗓️ Today's Schedule</h4>
                        <p className="text-xs text-[#8A90A2] mt-0.5">Chronological room allocations</p>
                      </div>
                      <button onClick={() => navigateTo('Calendar')} className="text-xs font-bold text-[#4F3FE0] hover:underline">
                        Open Calendar &rarr;
                      </button>
                    </div>

                    <div className="space-y-3">
                      {todaysSchedule.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl">
                          <div className="w-[84px] text-[11px] font-bold text-[#64748B] flex-shrink-0">{item.time}</div>
                          <div className="w-1.5 h-8 rounded-full bg-[#4F3FE0] flex-shrink-0" />
                          <div className="flex-1 truncate">
                            <div className="text-xs font-bold text-[#111827] truncate">{item.title}</div>
                            <div className="text-[11px] text-[#8A90A2]">{item.room} • 👥 {item.attendees} pax</div>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-full">
                            Confirmed
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#ECEEF4] flex items-center justify-between text-xs text-[#64748B]">
                    <span>Need to book a new slot?</span>
                    <button
                      onClick={() => navigateTo('Meeting Rooms')}
                      className="bg-[#4F3FE0] text-white px-3.5 py-1.5 rounded-lg text-xs font-bold hover:bg-[#4335C9]"
                    >
                      + Reserve Space
                    </button>
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
