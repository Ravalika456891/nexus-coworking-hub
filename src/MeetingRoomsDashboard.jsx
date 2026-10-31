import React, { useState, useMemo } from 'react';
import {
  Zap,
  Search,
  MapPin,
  Bell,
  ChevronDown,
  Crown,
  LayoutDashboard,
  Calendar,
  CalendarDays,
  Bookmark,
  Clock,
  CreditCard,
  BarChart3,
  Building2,
  Users,
  Settings,
  Sliders,
  Heart,
  Monitor,
  Video,
  Mic,
  Wifi,
  Projector,
  PenTool,
  Sun,
  Coffee,
  Accessibility,
  Repeat,
  UserPlus,
  FileText,
  MoreHorizontal,
  X,
  Check
} from 'lucide-react';

// --- Mock Data ---
export const INITIAL_ROOMS = [
  {
    id: "mr-1",
    name: "Boardroom Alpha",
    capacity: 10,
    type: "Boardroom",
    status: "Available",
    image: "https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80",
    amenities: ["Projector", "Video Conferencing", "Whiteboard", "TV/Display", "Audio/Mic"],
    rate: "₹2,500/hr"
  },
  {
    id: "mr-2",
    name: "Pitch Arena Nexus",
    capacity: 8,
    type: "Pitch Room",
    status: "Available",
    image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80",
    amenities: ["TV/Display", "Video Conferencing", "Audio/Mic", "Natural Light"],
    rate: "₹3,000/hr"
  },
  {
    id: "mr-3",
    name: "Focus Room",
    capacity: 4,
    type: "Meeting Room",
    status: "In Use",
    image: "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80",
    amenities: ["TV/Display", "Whiteboard", "Audio/Mic"],
    rate: "₹1,200/hr"
  },
  {
    id: "mr-4",
    name: "Collaboration Room",
    capacity: 6,
    type: "Meeting Room",
    status: "Available",
    image: "https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80",
    amenities: ["Whiteboard", "Video Conferencing", "Natural Light"],
    rate: "₹1,800/hr"
  },
  {
    id: "mr-5",
    name: "Training Room",
    capacity: 20,
    type: "Training Room",
    status: "Available",
    image: "https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80",
    amenities: ["Projector", "Audio/Mic", "Whiteboard", "Catering", "Accessible"],
    rate: "₹4,000/hr"
  },
  {
    id: "mr-6",
    name: "Creative Studio",
    capacity: 8,
    type: "Event Space",
    status: "Available",
    image: "https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80",
    amenities: ["TV/Display", "Whiteboard", "Natural Light", "Audio/Mic"],
    rate: "₹2,200/hr"
  }
];

export const ROOM_TYPES = [
  "All Rooms", "Meeting Room", "Conference Room", "Training Room", "Pitch Room", "Boardroom", "Event Space"
];

export const AMENITIES_LIST = [
  { name: "Projector", IconComp: Projector },
  { name: "Video Conferencing", IconComp: Video },
  { name: "Whiteboard", IconComp: PenTool },
  { name: "TV/Display", IconComp: Monitor },
  { name: "Audio/Mic", IconComp: Mic },
  { name: "Catering", IconComp: Coffee },
  { name: "Accessible", IconComp: Accessibility },
  { name: "Natural Light", IconComp: Sun }
];

export default function MeetingRoomsDashboard() {
  const [rooms, setRooms] = useState(INITIAL_ROOMS);
  const [activeNav, setActiveNav] = useState("Meeting Rooms");
  const [selectedType, setSelectedType] = useState("All Rooms");
  const [selectedAmenities, setSelectedAmenities] = useState([]);
  const [viewMode, setViewMode] = useState("Cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDate, setSelectedDate] = useState("Fri, 30 Oct 2026");
  const [selectedTime, setSelectedTime] = useState("09:00 AM – 11:00 AM");
  const [selectedPeople, setSelectedPeople] = useState(4);
  const [favorites, setFavorites] = useState(new Set(["mr-1"]));
  
  const [upcomingBookings, setUpcomingBookings] = useState([
    {
      id: "bkg-1",
      date: "Today",
      time: "03:00 PM",
      title: "Design Review",
      room: "Collaboration Room",
      attendees: 6,
      status: "Confirmed",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-blue-500"
    },
    {
      id: "bkg-2",
      date: "31 Oct",
      time: "10:00 AM",
      title: "Weekly Sync",
      room: "Pitch Arena Nexus",
      attendees: 4,
      status: "Confirmed",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-emerald-500"
    },
    {
      id: "bkg-3",
      date: "02 Nov",
      time: "11:00 AM",
      title: "Product Demo",
      room: "Boardroom Alpha",
      attendees: 8,
      status: "Pending",
      statusColor: "bg-amber-50 text-amber-600 border border-amber-200",
      barColor: "bg-amber-500"
    }
  ]);

  const [todaysSchedule, setTodaysSchedule] = useState([
    {
      time: "09:00 AM – 11:00 AM",
      title: "Product Planning",
      room: "Boardroom Alpha",
      attendees: 8,
      dotColor: "bg-emerald-500",
      tintColor: "border-l-4 border-l-emerald-500"
    },
    {
      time: "11:30 AM – 01:00 PM",
      title: "Client Meeting",
      room: "Pitch Arena Nexus",
      attendees: 4,
      dotColor: "bg-blue-500",
      tintColor: "border-l-4 border-l-blue-500"
    },
    {
      time: "02:00 PM – 03:00 PM",
      title: "Team Sync",
      room: "Focus Room",
      attendees: 3,
      dotColor: "bg-amber-500",
      tintColor: "border-l-4 border-l-amber-500"
    },
    {
      time: "03:30 PM – 05:00 PM",
      title: "Design Review",
      room: "Collaboration Room",
      attendees: 6,
      dotColor: "bg-indigo-500",
      tintColor: "border-l-4 border-l-indigo-500"
    }
  ]);

  const [bookingModalRoom, setBookingModalRoom] = useState(null);
  const [meetingTitleInput, setMeetingTitleInput] = useState("");
  const [toastMessage, setToastMessage] = useState(null);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const toggleFavorite = (id, e) => {
    e.stopPropagation();
    setFavorites(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAmenity = (name) => {
    setSelectedAmenities(prev =>
      prev.includes(name) ? prev.filter(a => a !== name) : [...prev, name]
    );
  };

  const filteredRooms = useMemo(() => {
    return rooms.filter(room => {
      if (selectedType !== "All Rooms" && room.type !== selectedType) return false;
      if (room.capacity < selectedPeople) return false;
      if (selectedAmenities.length > 0) {
        const hasAll = selectedAmenities.every(a => room.amenities.includes(a));
        if (!hasAll) return false;
      }
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = room.name.toLowerCase().includes(q);
        const matchType = room.type.toLowerCase().includes(q);
        const matchAmenity = room.amenities.some(a => a.toLowerCase().includes(q));
        if (!matchName && !matchType && !matchAmenity) return false;
      }
      return true;
    });
  }, [rooms, selectedType, selectedPeople, selectedAmenities, searchQuery]);

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingModalRoom) return;

    const title = meetingTitleInput.trim() || `Strategy Sync (${bookingModalRoom.name})`;
    const newBooking = {
      id: `bkg-${Date.now()}`,
      date: "Today",
      time: selectedTime.split("–")[0].trim() || "09:00 AM",
      title: title,
      room: bookingModalRoom.name,
      attendees: selectedPeople,
      status: "Confirmed",
      statusColor: "bg-emerald-50 text-emerald-600 border border-emerald-200",
      barColor: "bg-emerald-500"
    };

    setUpcomingBookings(prev => [newBooking, ...prev]);
    setTodaysSchedule(prev => [
      ...prev,
      {
        time: selectedTime,
        title: title,
        room: bookingModalRoom.name,
        attendees: selectedPeople,
        dotColor: "bg-emerald-500",
        tintColor: "border-l-4 border-l-emerald-500"
      }
    ]);

    showToast(`🎉 Room booked! ${bookingModalRoom.name} confirmed.`);
    setBookingModalRoom(null);
    setMeetingTitleInput("");
  };

  return (
    <div className="flex min-h-screen bg-[#F6F7FB] text-[#374151] font-sans antialiased">
      {/* 1. Left Sidebar */}
      <aside className="w-[235px] flex-shrink-0 bg-white border-r border-[#ECEEF4] flex flex-col justify-between py-5 px-3 min-h-screen sticky top-0 h-screen select-none">
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-[#111827] flex items-center justify-center text-yellow-400 shadow-sm flex-shrink-0">
              <Zap className="w-5 h-5 text-yellow-400 fill-yellow-400" />
            </div>
            <div className="leading-tight">
              <h1 className="font-extrabold text-[15px] tracking-tight text-[#111827]">NEXUS HUB</h1>
              <span className="text-[11px] font-medium text-[#8A90A2]">Coworking Space</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="space-y-1">
            {[
              { name: "Dashboard", IconComp: LayoutDashboard },
              { name: "Meeting Rooms", IconComp: Calendar },
              { name: "Bookings", IconComp: Bookmark },
              { name: "Calendar", IconComp: CalendarDays },
              { name: "My Reservations", IconComp: Clock },
              { name: "Billing & Credits", IconComp: CreditCard },
              { name: "Analytics", IconComp: BarChart3 }
            ].map(item => {
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveNav(item.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-[#EEEBFF] text-[#4F3FE0] font-semibold"
                      : "text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]"
                  }`}
                >
                  <item.IconComp
                    className={`w-4 h-4 ${isActive ? "text-[#4F3FE0]" : "text-[#8A90A2]"}`}
                    strokeWidth={isActive ? 2 : 1.7}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}

            <div className="h-[1px] bg-[#ECEEF4] my-3 mx-2" />

            {[
              { name: "Workspace & Desks", IconComp: Building2 },
              { name: "Visitors", IconComp: Users },
              { name: "Members", IconComp: Users },
              { name: "Settings", IconComp: Settings }
            ].map(item => {
              const isActive = activeNav === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveNav(item.name)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-[10px] text-[13px] font-medium transition-all ${
                    isActive
                      ? "bg-[#EEEBFF] text-[#4F3FE0] font-semibold"
                      : "text-[#374151] hover:bg-[#F8F9FD] hover:text-[#111827]"
                  }`}
                >
                  <item.IconComp
                    className={`w-4 h-4 ${isActive ? "text-[#4F3FE0]" : "text-[#8A90A2]"}`}
                    strokeWidth={isActive ? 2 : 1.7}
                  />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Plan Card */}
        <div className="bg-[#F4F2FF] border border-[#E3DEFF] rounded-2xl p-4 mt-4">
          <div className="flex items-center gap-1.5 text-[#4F3FE0] text-xs font-bold uppercase tracking-wider">
            <Crown className="w-3.5 h-3.5 text-[#4F3FE0]" />
            <span>Startup Plan</span>
          </div>
          <div className="text-[19px] font-black text-[#111827] mt-1">120 credits</div>
          
          <div className="w-full h-1.5 bg-[#E4DEFF] rounded-full mt-2.5 overflow-hidden">
            <div className="h-full bg-[#4F3FE0] rounded-full w-[33%]" />
          </div>
          <div className="text-[11px] font-medium text-[#8A90A2] mt-1.5">80 credits left</div>

          <button
            type="button"
            onClick={() => showToast("Upgrade plan modal")}
            className="w-full mt-3 bg-[#4F3FE0] hover:bg-[#4335C9] text-white py-2 rounded-xl text-xs font-bold transition-all shadow-sm active:scale-[0.98]"
          >
            Upgrade Plan
          </button>
        </div>
      </aside>

      {/* Main Column + Right Panel */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="h-[70px] bg-white border-b border-[#ECEEF4] px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="relative w-[380px]">
            <Search className="w-4 h-4 text-[#8A90A2] absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search rooms, amenities, or location..."
              className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-full pl-10 pr-4 py-2 text-[13px] text-[#111827] placeholder-[#8A90A2] focus:outline-none focus:border-[#4F3FE0] focus:bg-white transition-all"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-full px-3.5 py-1.5 cursor-pointer hover:border-[#4F3FE0]/40 transition-all">
              <MapPin className="w-3.5 h-3.5 text-[#4F3FE0]" />
              <span className="text-[12.5px] font-semibold text-[#111827]">XYZ Technologies (STP-XYZ)</span>
              <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2]" />
            </div>

            <button className="w-9 h-9 rounded-full bg-[#F6F7FB] border border-[#ECEEF4] flex items-center justify-center relative hover:bg-gray-100 transition-all">
              <Bell className="w-4 h-4 text-[#374151]" />
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 border-2 border-white" />
            </button>

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

        {/* Content Area */}
        <div className="flex-1 p-8 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_340px] gap-8 items-start max-w-[1600px] w-full mx-auto">
          
          {/* Main Column */}
          <main className="space-y-6 min-w-0">
            {/* Hero Banner */}
            <div className="relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-sm flex items-center min-h-[220px]">
              <div className="absolute inset-0 bg-gradient-to-r from-[#EAE6FF] via-[#F4F2FF] to-transparent z-10 w-[60%]" />
              
              <div className="absolute right-0 top-0 bottom-0 w-[55%] h-full z-0 overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80"
                  alt="Modern Boardroom"
                  className="w-full h-full object-cover object-center"
                />
              </div>

              <div className="relative z-20 p-8 max-w-[560px]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F3FE0] uppercase tracking-wider mb-2">
                  <Zap className="w-3.5 h-3.5 fill-[#4F3FE0]" />
                  <span>NEXUS HUB</span>
                </div>

                <h2 className="text-[34px] xl:text-[38px] font-black text-[#111827] leading-[1.12] tracking-tight">
                  Book the right space <br />for every idea
                </h2>

                <p className="text-[13px] text-[#374151] font-medium mt-2 max-w-[460px]">
                  Modern meeting rooms for productive discussions, workshops and client calls.
                </p>

                <div className="flex flex-wrap items-center gap-2 mt-4 pt-1">
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    Instant Booking
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500" />
                    Real-time Availability
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    Flexible Durations
                  </span>
                  <span className="inline-flex items-center gap-1.5 bg-white/90 backdrop-blur-sm border border-[#ECEEF4] rounded-lg px-2.5 py-1 text-[11px] font-semibold text-[#111827] shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    Integrated Calendar
                  </span>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-5 shadow-sm space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[1fr_1.3fr_1fr_auto] gap-3 items-center">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">Date</span>
                  <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5">
                    <Calendar className="w-4 h-4 text-[#4F3FE0]" />
                    <span className="text-[13px] font-semibold text-[#111827]">{selectedDate}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2] ml-auto" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">Time</span>
                  <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5">
                    <Clock className="w-4 h-4 text-[#4F3FE0]" />
                    <span className="text-[13px] font-semibold text-[#111827]">{selectedTime}</span>
                    <ChevronDown className="w-3.5 h-3.5 text-[#8A90A2] ml-auto" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#8A90A2] mb-1">People</span>
                  <div className="flex items-center gap-2 bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2.5">
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

                <div className="self-end pt-4 sm:pt-0">
                  <button
                    type="button"
                    onClick={() => showToast(`Filtered rooms for ${selectedPeople} people`)}
                    className="w-full bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-7 py-2.5 rounded-xl text-[13px] font-bold shadow-sm"
                  >
                    Search Rooms
                  </button>
                </div>
              </div>

              {/* Chips 1 */}
              <div className="pt-2 border-t border-[#ECEEF4] flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center flex-wrap gap-1.5">
                  {ROOM_TYPES.map(type => (
                    <button
                      key={type}
                      onClick={() => setSelectedType(type)}
                      className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
                        selectedType === type
                          ? "bg-[#4F3FE0] text-white shadow-sm"
                          : "bg-[#F6F7FB] hover:bg-gray-200 text-[#374151]"
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 border border-[#4F3FE0] text-[#4F3FE0] hover:bg-[#F4F2FF] px-3.5 py-1.5 rounded-full text-xs font-bold"
                >
                  <Sliders className="w-3.5 h-3.5" />
                  <span>More Filters</span>
                </button>
              </div>

              {/* Chips 2 */}
              <div className="flex items-center flex-wrap gap-2 pt-1">
                {AMENITIES_LIST.map(amenity => {
                  const isSelected = selectedAmenities.includes(amenity.name);
                  return (
                    <button
                      key={amenity.name}
                      onClick={() => toggleAmenity(amenity.name)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11.5px] font-medium border transition-all ${
                        isSelected
                          ? "bg-[#EEEBFF] border-[#4F3FE0] text-[#4F3FE0] font-semibold"
                          : "bg-white border-[#ECEEF4] text-[#374151] hover:border-gray-300"
                      }`}
                    >
                      <amenity.IconComp className={`w-3.5 h-3.5 ${isSelected ? "text-[#4F3FE0]" : "text-[#8A90A2]"}`} />
                      <span>{amenity.name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Available Rooms Header */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-3">
                <h3 className="text-xl font-black text-[#111827]">Available Rooms</h3>
                <span className="bg-[#DCFCE7] text-[#16A34A] px-2.5 py-0.5 rounded-full text-xs font-bold border border-emerald-200">
                  {filteredRooms.length} rooms available
                </span>
              </div>

              <div className="flex items-center bg-white border border-[#ECEEF4] p-1 rounded-xl shadow-xs">
                {["Cards", "List", "Calendar"].map(m => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                      viewMode === m
                        ? "bg-[#4F3FE0] text-white shadow-xs"
                        : "text-[#64748B] hover:text-[#111827]"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Room Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
              {filteredRooms.map(room => {
                const isFav = favorites.has(room.id);
                const isAvailable = room.status === "Available";

                return (
                  <div
                    key={room.id}
                    className="bg-white border border-[#ECEEF4] rounded-2xl overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-200 flex flex-col group"
                  >
                    <div className="relative aspect-[16/9] w-full overflow-hidden bg-gray-100">
                      <img
                        src={room.image}
                        alt={room.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute top-3 left-3">
                        <span
                          className={`px-2.5 py-1 rounded-full text-[11px] font-bold text-white shadow-md ${
                            isAvailable ? "bg-[#16A34A]" : "bg-[#F97316]"
                          }`}
                        >
                          {room.status}
                        </span>
                      </div>

                      <button
                        onClick={(e) => toggleFavorite(room.id, e)}
                        className="w-8 h-8 rounded-full bg-white/95 backdrop-blur-sm shadow-md flex items-center justify-center absolute top-3 right-3 hover:scale-110 active:scale-95 transition-all"
                      >
                        <Heart
                          className={`w-4 h-4 ${isFav ? "text-[#EF4444] fill-[#EF4444]" : "text-[#8A90A2]"}`}
                        />
                      </button>
                    </div>

                    <div className="p-4 flex-1 flex flex-col justify-between">
                      <div>
                        <h4 className="font-bold text-[15px] text-[#111827]">{room.name}</h4>
                        <div className="flex items-center gap-1.5 text-xs text-[#64748B] font-medium mt-1">
                          <Users className="w-3.5 h-3.5 text-[#8A90A2]" />
                          <span>{room.capacity} people</span>
                          <span className="mx-1">•</span>
                          <span className="text-[#4F3FE0] font-semibold">{room.rate}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-3 mt-3 border-t border-[#ECEEF4]">
                        <div className="flex items-center gap-2 text-[#8A90A2]">
                          <Monitor className="w-4 h-4" />
                          <Video className="w-4 h-4" />
                          <Mic className="w-4 h-4" />
                          <Wifi className="w-4 h-4" />
                        </div>

                        {isAvailable ? (
                          <button
                            onClick={() => setBookingModalRoom(room)}
                            className="bg-[#4F3FE0] hover:bg-[#4335C9] text-white px-4 py-2 rounded-xl text-xs font-bold"
                          >
                            Book Now
                          </button>
                        ) : (
                          <button
                            onClick={() => showToast(`Schedule for ${room.name}`)}
                            className="border border-[#ECEEF4] hover:bg-gray-50 text-[#374151] px-4 py-2 rounded-xl text-xs font-semibold"
                          >
                            View Schedule
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </main>

          {/* Right Panel */}
          <aside className="space-y-5">
            {/* Quick Actions */}
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-sm">
              <h4 className="text-[13px] font-bold text-[#111827] mb-3">Quick Actions</h4>
              <div className="grid grid-cols-4 gap-2 text-center">
                <button
                  onClick={() => setBookingModalRoom(rooms[0])}
                  className="bg-[#F3EFFE] hover:bg-[#EAE4FE] text-[#6E42E5] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5"
                >
                  <Calendar className="w-5 h-5 text-[#6E42E5]" />
                  <span className="text-[10.5px] font-bold leading-tight">Book a Room</span>
                </button>
                <button
                  onClick={() => showToast("Bookings list")}
                  className="bg-[#EEF5FF] hover:bg-[#DFEDFF] text-[#2B71FF] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5"
                >
                  <FileText className="w-5 h-5 text-[#2B71FF]" />
                  <span className="text-[10.5px] font-bold leading-tight">My Bookings</span>
                </button>
                <button
                  onClick={() => showToast("Recurring bookings")}
                  className="bg-[#EEFAF3] hover:bg-[#DEFAEA] text-[#12A150] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5"
                >
                  <Repeat className="w-5 h-5 text-[#12A150]" />
                  <span className="text-[10.5px] font-bold leading-tight">Recurring</span>
                </button>
                <button
                  onClick={() => showToast("Invite guests")}
                  className="bg-[#FFF5EC] hover:bg-[#FFE8D5] text-[#F36B20] p-2.5 rounded-xl flex flex-col items-center justify-center gap-1.5"
                >
                  <UserPlus className="w-5 h-5 text-[#F36B20]" />
                  <span className="text-[10.5px] font-bold leading-tight">Invite Guests</span>
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-bold text-[#111827]">Today's Schedule</h4>
                <button className="text-xs font-semibold text-[#4F3FE0] hover:underline">View Calendar</button>
              </div>
              <div className="space-y-2.5">
                {todaysSchedule.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2.5 text-xs">
                    <div className="w-[84px] text-[10.5px] font-semibold text-[#8A90A2] pt-1 whitespace-nowrap leading-tight">
                      {item.time.replace("–", "\n–")}
                    </div>
                    <div className="pt-2 flex flex-col items-center">
                      <span className={`w-2 h-2 rounded-full ${item.dotColor} ring-4 ring-white shadow-xs`} />
                    </div>
                    <div className={`flex-1 bg-[#F8FAFC] border border-[#ECEEF4] ${item.tintColor} rounded-xl p-2.5 hover:bg-gray-100`}>
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[#111827] text-[12px] truncate">{item.title}</span>
                        <MoreHorizontal className="w-3.5 h-3.5 text-[#8A90A2]" />
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

            {/* My Upcoming Bookings */}
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-[13px] font-bold text-[#111827]">My Upcoming Bookings</h4>
                <button className="text-xs font-semibold text-[#4F3FE0] hover:underline">View All</button>
              </div>
              <div className="space-y-2.5">
                {upcomingBookings.map(bkg => (
                  <div
                    key={bkg.id}
                    className="flex items-center justify-between bg-[#F8FAFC] border border-[#ECEEF4] rounded-xl p-2.5 hover:border-gray-300 text-xs"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="text-left leading-tight w-[58px] flex-shrink-0">
                        <div className="font-bold text-[#111827] text-[11.5px]">{bkg.date}</div>
                        <div className="text-[10px] text-[#8A90A2]">{bkg.time}</div>
                      </div>
                      <div className={`w-1 h-8 rounded-full ${bkg.barColor} flex-shrink-0`} />
                      <div className="truncate">
                        <div className="font-bold text-[#111827] text-[12px] truncate">{bkg.title}</div>
                        <div className="text-[11px] text-[#64748B] truncate flex items-center gap-1.5">
                          <span>{bkg.room}</span>
                          <span>•</span>
                          <span>👥 {bkg.attendees}</span>
                        </div>
                      </div>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold flex-shrink-0 ${bkg.statusColor}`}>
                      {bkg.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Usage & Credits */}
            <div className="bg-white border border-[#ECEEF4] rounded-2xl p-4 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-[13px] font-bold text-[#111827]">Usage &amp; Credits</h4>
                <span className="text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  2 hrs free remaining
                </span>
              </div>
              <div className="w-full h-2 bg-[#E4DEFF] rounded-full overflow-hidden mt-2.5">
                <div className="h-full bg-[#4F3FE0] rounded-full w-[80%]" />
              </div>
              <div className="flex items-center justify-between text-xs mt-2 text-[#64748B]">
                <span className="font-bold text-[#111827]">8 / 10 hours used</span>
                <button className="text-xs font-semibold text-[#4F3FE0] hover:underline">View Details</button>
              </div>
            </div>
          </aside>
        </div>
      </div>

      {/* Booking Modal */}
      {bookingModalRoom && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#ECEEF4] relative">
            <div className="flex items-center justify-between pb-3 border-b border-[#ECEEF4]">
              <div>
                <h3 className="text-lg font-black text-[#111827]">Book {bookingModalRoom.name}</h3>
                <p className="text-xs text-[#8A90A2]">Instant confirmation • Deducts 1 hour credit</p>
              </div>
              <button
                onClick={() => setBookingModalRoom(null)}
                className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleConfirmBooking} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#374151] mb-1">Meeting Title</label>
                <input
                  type="text"
                  required
                  value={meetingTitleInput}
                  onChange={(e) => setMeetingTitleInput(e.target.value)}
                  placeholder="e.g. Q4 Executive Pitch Session"
                  className="w-full bg-[#F6F7FB] border border-[#ECEEF4] rounded-xl px-3.5 py-2 text-sm text-[#111827] focus:outline-none focus:border-[#4F3FE0] focus:bg-white"
                />
              </div>

              <div className="bg-[#F8F9FD] border border-[#E3DEFF] rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Room Rate:</span>
                  <span className="font-bold text-[#111827]">{bookingModalRoom.rate} (Covered by Credits)</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Date &amp; Time:</span>
                  <span className="font-bold text-[#111827]">{selectedDate} • {selectedTime}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8A90A2]">Attendees:</span>
                  <span className="font-bold text-[#111827]">{selectedPeople} people (Capacity: {bookingModalRoom.capacity})</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setBookingModalRoom(null)}
                  className="px-4 py-2 border border-[#ECEEF4] text-[#374151] rounded-xl text-xs font-bold hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#4F3FE0] hover:bg-[#4335C9] text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Reservation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 bg-[#111827] text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg border border-gray-700 z-50 flex items-center gap-2">
          <Zap className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
