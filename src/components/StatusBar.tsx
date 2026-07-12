
"use client";

import { useEffect, useState } from "react";
import { Signal, Wifi, Battery } from "lucide-react";

export function StatusBar() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-between items-center px-6 py-2 bg-primary text-white text-[12px] font-medium z-50">
      <div>{time}</div>
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-3.5 h-3.5 rotate-90" />
      </div>
    </div>
  );
}
