export type RoomType =
  | 'All Rooms'
  | 'Meeting Room'
  | 'Conference Room'
  | 'Training Room'
  | 'Pitch Room'
  | 'Boardroom'
  | 'Event Space';

export type RoomStatus = 'Available' | 'In Use';

export type BookingStatus = 'Confirmed' | 'Pending' | 'In progress' | 'Completed' | 'Cancelled';

export interface Room {
  id: string;
  name: string;
  capacity: number;
  type: RoomType;
  status: RoomStatus;
  image: string;
  fallbackImage: string;
  amenities: string[];
  rate: string;
  floor?: string;
  roomNumber?: string;
}

export interface AmenityItem {
  name: string;
  iconName: string;
}

export interface TodayScheduleItem {
  id?: string;
  time: string;
  title: string;
  room: string;
  attendees: number;
  dotColor: string;
  tintColor: string;
}

export interface UpcomingBooking {
  id: string;
  resId?: string;
  date: string;
  day?: string;
  month?: string;
  fullDate?: string;
  time: string;
  title: string;
  room: string;
  roomId?: string;
  roomImage?: string;
  fallbackImage?: string;
  attendees: number;
  credits?: number;
  status: BookingStatus;
  statusColor: string;
  barColor: string;
  isRecurring?: boolean;
  recurringPattern?: string;
  purpose?: string;
}

export interface StartupPlan {
  name: string;
  totalCredits: number;
  usedCredits: number;
  remainingCredits: number;
  percentUsed: number;
}

