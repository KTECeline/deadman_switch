"use client";

import { useState, type ReactNode } from "react";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navbar onToggleSidebar={() => setSidebarOpen((prev) => !prev)} />

      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      <main className="pt-16 md:pl-[240px]">
        <div className="p-4 md:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  );
}
