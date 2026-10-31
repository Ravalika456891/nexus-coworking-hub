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
    date: 'Today',
    time: '03:00 PM',
    title: 'Design Review',
    room: 'Collaboration Room',
    attendees: 6,
    status: 'Confirmed',
    statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    barColor: 'bg-blue-500'
  },
  {
    id: 'bkg-2',
    date: '31 Oct',
    time: '10:00 AM',
    title: 'Weekly Sync',
    room: 'Pitch Arena Nexus',
    attendees: 4,
    status: 'Confirmed',
    statusColor: 'bg-emerald-50 text-emerald-600 border border-emerald-200',
    barColor: 'bg-emerald-500'
  },
  {
    id: 'bkg-3',
    date: '02 Nov',
    time: '11:00 AM',
    title: 'Product Demo',
    room: 'Boardroom Alpha',
    attendees: 8,
    status: 'Pending',
    statusColor: 'bg-amber-50 text-amber-600 border border-amber-200',
    barColor: 'bg-amber-500'
  }
];

