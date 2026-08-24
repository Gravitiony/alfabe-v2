"use client";

import { useEffect } from "react";

export default function Heartbeat() {
  useEffect(() => {
    const ping = () => {
      fetch("/api/auth/me").catch(() => {});
    };
    ping();
    const interval = setInterval(ping, 45000);
    return () => clearInterval(interval);
  }, []);

  return null;
}
