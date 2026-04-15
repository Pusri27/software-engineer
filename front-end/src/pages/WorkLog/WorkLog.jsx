import { useState } from "react";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import FriendsList from "@/components/FriendsList/FriendsList";
import WorkLogList from "@/components/WorkLogList/WorkLogList";
import "./WorkLog.css";

function WorkLog() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({ searchQuery: "", selectedTags: [], dateRange: { start: "", end: "" } });

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex h-screen bg-background">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col overflow-hidden">
        <Navbar onFilterChange={handleFilterChange} />

        <div className="flex-1 flex overflow-hidden">
          <WorkLogList filters={filters} />
          <FriendsList />
        </div>
      </main>
    </div>
  );
}

export default WorkLog;


