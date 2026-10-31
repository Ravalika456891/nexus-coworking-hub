import { Room, TodayScheduleItem, UpcomingBooking } from '../types/meetingRooms';

export const INITIAL_ROOMS: Room[] = [
  {
    id: 'mr-1',
    name: 'Boardroom Alpha',
    capacity: 10,
    type: 'Boardroom',
    status: 'Available',
    image: '/assets/rooms/mr-01.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    amenities: ['Projector', 'Video Conferencing', 'Whiteboard', 'TV/Display', 'Audio/Mic'],
    rate: '₹2,500/hr'
  },
  {
    id: 'mr-2',
    name: 'Pitch Arena Nexus',
    capacity: 8,
    type: 'Pitch Room',
    status: 'Available',
    image: '/assets/rooms/mr-02.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    amenities: ['TV/Display', 'Video Conferencing', 'Audio/Mic', 'Natural Light'],
    rate: '₹3,000/hr'
  },
  {
    id: 'mr-3',
    name: 'Focus Room',
    capacity: 4,
    type: 'Meeting Room',
    status: 'In Use',
    image: '/assets/rooms/mr-03.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    amenities: ['TV/Display', 'Whiteboard', 'Audio/Mic'],
    rate: '₹1,200/hr'
  },
  {
    id: 'mr-4',
    name: 'Collaboration Room',
    capacity: 6,
    type: 'Meeting Room',
    status: 'Available',
    image: '/assets/rooms/mr-04.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    amenities: ['Whiteboard', 'Video Conferencing', 'Natural Light'],
    rate: '₹1,800/hr'
  },
  {
    id: 'mr-5',
    name: 'Training Room',
    capacity: 20,
    type: 'Training Room',
    status: 'Available',
    image: '/assets/rooms/mr-05.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    amenities: ['Projector', 'Audio/Mic', 'Whiteboard', 'Catering', 'Accessible'],
    rate: '₹4,000/hr'
  },
  {
    id: 'mr-6',
    name: 'Creative Studio',
    capacity: 8,
    type: 'Event Space',
    status: 'Available',
    image: '/assets/rooms/mr-06.webp',
    fallbackImage: 'https://images.unsplash.com/photo-1504384308090-c894fdcc538d?auto=format&fit=crop&w=800&q=80',
    amenities: ['TV/Display', 'Whiteboard', 'Natural Light', 'Audio/Mic'],
    rate: '₹2,200/hr'
  }
];

export const ROOM_TYPES = [
  'All Rooms',
  'Meeting Room',
  'Conference Room',
  'Training Room',
  'Pitch Room',
  'Boardroom',
  'Event Space'
] as const;

export const AMENITIES_LIST = [
  { name: 'Projector', icon: 'projector' },
  { name: 'Video Conferencing', icon: 'video' },
  { name: 'Whiteboard', icon: 'edit3' },
  { name: 'TV/Display', icon: 'monitor' },
  { name: 'Audio/Mic', icon: 'mic' },
  { name: 'Catering', icon: 'coffee' },
  { name: 'Accessible', icon: 'accessibility' },
  { name: 'Natural Light', icon: 'sun' }
] as const;

export const INITIAL_TODAYS_SCHEDULE: TodayScheduleItem[] = [
  {
    id: 'ts-1',
    time: '09:00 AM – 11:00 AM',
    title: 'Product Planning',
    room: 'Boardroom Alpha',
    attendees: 8,
    dotColor: 'bg-emerald-500',
    tintColor: 'border-l-4 border-l-emerald-500'
  },
  {
    id: 'ts-2',
    time: '11:30 AM – 01:00 PM',
    title: 'Client Meeting',
    room: 'Pitch Arena Nexus',
    attendees: 4,
    dotColor: 'bg-blue-500',
    tintColor: 'border-l-4 border-l-blue-500'
  },
  {
    id: 'ts-3',
    time: '02:00 PM – 03:00 PM',
    title: 'Team Sync',
    room: 'Focus Room',
    attendees: 3,
    dotColor: 'bg-amber-500',
    tintColor: 'border-l-4 border-l-amber-500'
  },
  {
    id: 'ts-4',
    time: '03:30 PM – 05:00 PM',
    title: 'Design Review',
    room: 'Collaboration Room',
    attendees: 6,
    dotColor: 'bg-indigo-500',
    tintColor: 'border-l-4 border-l-indigo-500'
  }
];

export const INITIAL_UPCOMING_BOOKINGS: UpcomingBooking[] = [
  {
    id: 'bkg-1',
    resId: 'RES-8901',
    date: 'Today',
    day: '30',
    month: 'OCT',
    fullDate: 'Fri, 30 Oct 2026',
    time: '03:30 PM – 05:00 PM',
    title: 'Design Review',
    room: 'Collaboration Room',
    roomId: 'mr-4',
    roomImage: '/assets/rooms/mr-04-main.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1527192491265-7e15c55b1ed2?auto=format&fit=crop&w=800&q=80',
    attendees: 6,
    credits: 18,
    status: 'Confirmed',
    isRecurring: false,
    purpose: 'Sprint 4 UI/UX walkthrough, component polish and QA review.',
    statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    barColor: 'bg-blue-500'
  },
  {
    id: 'bkg-2',
    resId: 'RES-8902',
    date: '31 Oct',
    day: '31',
    month: 'OCT',
    fullDate: 'Sat, 31 Oct 2026',
    time: '10:00 AM – 11:30 AM',
    title: 'Weekly Sync',
    room: 'Pitch Arena Nexus',
    roomId: 'mr-2',
    roomImage: '/assets/rooms/mr-02-main.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80',
    attendees: 4,
    credits: 25,
    status: 'Confirmed',
    isRecurring: true,
    recurringPattern: 'Every Friday & Saturday',
    purpose: 'Executive growth metrics, cap-table update & cohort deliverables.',
    statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    barColor: 'bg-emerald-500'
  },
  {
    id: 'bkg-3',
    resId: 'RES-8903',
    date: '02 Nov',
    day: '02',
    month: 'NOV',
    fullDate: 'Mon, 02 Nov 2026',
    time: '11:00 AM – 12:30 PM',
    title: 'Product Demo & Pitch',
    room: 'Boardroom Alpha',
    roomId: 'mr-1',
    roomImage: '/assets/rooms/mr-01-main.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1517502884422-41eaead166d4?auto=format&fit=crop&w=800&q=80',
    attendees: 8,
    credits: 30,
    status: 'Pending',
    isRecurring: false,
    purpose: 'Venture pitch to seed angel syndicates and incubation advisors.',
    statusColor: 'bg-amber-50 text-amber-600 border border-amber-200',
    barColor: 'bg-amber-500'
  },
  {
    id: 'bkg-4',
    resId: 'RES-8904',
    date: '03 Nov',
    day: '03',
    month: 'NOV',
    fullDate: 'Tue, 03 Nov 2026',
    time: '02:00 PM – 04:00 PM',
    title: 'Client Strategy Session',
    room: 'Training Room',
    roomId: 'mr-5',
    roomImage: '/assets/rooms/mr-05-main.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80',
    attendees: 12,
    credits: 40,
    status: 'Cancelled',
    isRecurring: false,
    purpose: 'Quarterly strategic roadmap session with enterprise partner.',
    statusColor: 'bg-rose-50 text-rose-600 border border-rose-200',
    barColor: 'bg-rose-500'
  },
  {
    id: 'bkg-5',
    resId: 'RES-8905',
    date: '28 Oct',
    day: '28',
    month: 'OCT',
    fullDate: 'Wed, 28 Oct 2026',
    time: '04:00 PM – 05:00 PM',
    title: 'Sprint Retrospective',
    room: 'Focus Room',
    roomId: 'mr-3',
    roomImage: '/assets/rooms/mr-03-main.jpg',
    fallbackImage: 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=800&q=80',
    attendees: 4,
    credits: 12,
    status: 'Completed',
    isRecurring: true,
    recurringPattern: 'Bi-weekly Wednesdays',
    purpose: 'Sprint 3 team reflection, process blockers and action items.',
    statusColor: 'bg-slate-100 text-slate-700 border border-slate-200',
    barColor: 'bg-slate-400'
  }
];

