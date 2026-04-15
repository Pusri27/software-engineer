import { useState } from "react";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import FriendsList from "@/components/FriendsList/FriendsList";
import HomeContent from "@/components/HomeContent/HomeContent";

const Index = () => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [filters, setFilters] = useState({ searchQuery: "", selectedTags: [], dateRange: { start: "", end: "" } });
  // Lifted state: receive the loaded worklogs from HomeContent → pass to WorklogSummary
  const [homeWorklogs, setHomeWorklogs] = useState([]);

  const handleFilterChange = (newFilters) => {
    setFilters(newFilters);
  };

  return (
    <div className="flex h-screen bg-background">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col">
        <Navbar onFilterChange={handleFilterChange} />

        <div className="flex-1 flex overflow-hidden">
          <HomeContent filters={filters} onWorklogsLoaded={setHomeWorklogs} />
          <FriendsList worklogs={homeWorklogs} />
        </div>
      </main>
    </div>
  );
};

export default Index;


