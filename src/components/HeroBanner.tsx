'use client';

import React from 'react';
import { Zap } from 'lucide-react';

export default function HeroBanner() {
  return (
    <div className="relative rounded-2xl border border-[#ECEEF4] overflow-hidden bg-white shadow-soft flex items-center min-h-[220px]">
      {/* Left Lavender Gradient */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#EAE6FF] via-[#F4F2FF] to-transparent z-10 w-[60%]" />

      {/* Office Photo Background (fading in from the right) */}
      <div className="absolute right-0 top-0 bottom-0 w-[55%] h-full z-0 overflow-hidden">
        <img
          src="/assets/rooms/banner-hero.jpg"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = 'https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=1200&q=80';
          }}
          alt="Modern Boardroom"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#F4F2FF] via-transparent to-black/10" />
      </div>

      {/* Left Hero Content */}
      <div className="relative z-20 p-8 max-w-[560px]">
        <div className="flex items-center gap-1.5 text-xs font-bold text-[#4F3FE0] uppercase tracking-wider mb-2">
          <Zap className="w-3.5 h-3.5 fill-[#4F3FE0] text-[#4F3FE0]" />
          <span>NEXUS HUB</span>
        </div>

        <h2 className="text-[34px] xl:text-[38px] font-black text-[#111827] leading-[1.12] tracking-tight">
          Book the right space <br />for every idea
        </h2>

        <p className="text-[13px] text-[#374151] font-medium mt-2 max-w-[460px]">
          Modern meeting rooms for productive discussions, workshops and client calls.
        </p>

        {/* 4 Feature Chips */}
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
  );
}

