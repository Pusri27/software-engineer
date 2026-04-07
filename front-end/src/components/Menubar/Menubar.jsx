import { Home, MessageCircle, ClipboardList, ChevronLeft, FileText, BarChart2 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import "./Menubar.css";
import logoWithText from "@/assets/Logo/Logo with Text_White.png";
import logoOnly from "@/assets/Logo/Logo Only_White.png";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS } from "../../config/api";

const Menubar = ({ collapsed, onToggleCollapse, onNavigate }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const activeMenu = location.pathname;
  const [recentProjects, setRecentProjects] = useState([
    {
      id: "loading-1",
      title: "Loading..."
    },
    {
      id: "loading-2",
      title: "Loading..."
    },
    {
      id: "loading-3",
      title: "Loading..."
    }
  ]);
  const [loading, setLoading] = useState(true);

  // Fetch 3 newest work logs from current user
  useEffect(() => {
    const fetchRecentProjects = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) {
          console.warn('No token available');
          setRecentProjects([]);
          setLoading(false);
          return;
        }
        
        // Get current user ID
        const userResponse = await fetch(AUTH_ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const userData = await userResponse.json();
        const currentUserId = userData.user?.id || userData.user?._id || userData.id || userData._id;
        
        // Fetch all worklogs
        const worklogsResponse = await fetch(WORKLOG_ENDPOINTS.FILTER, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!worklogsResponse.ok) {
          console.error('Worklog filter error:', worklogsResponse.status);
          const errorText = await worklogsResponse.text();
          console.error('Error response:', errorText);
          setRecentProjects([]);
          setLoading(false);
          return;
        }
        
        const worklogsData = await worklogsResponse.json();
        
        let allWorklogs = Array.isArray(worklogsData) ? worklogsData : (worklogsData?.worklogs || []);
        
        // Filter: only works created by current user (owner)
        const userWorklogs = allWorklogs.filter(worklog => {
          const isOwner = worklog.user?._id === currentUserId || worklog.user?.id === currentUserId;
          return isOwner;
        });
        
        
        // Sort by date (newest first) and take top 3
        const sortedWorklogs = userWorklogs.sort((a, b) => {
          const dateA = new Date(a.datetime || a.createdAt);
          const dateB = new Date(b.datetime || b.createdAt);
          return dateB - dateA; // Descending order
        });
        
        const recent3 = sortedWorklogs.slice(0, 3).map(worklog => ({
          id: worklog._id || worklog.id,
          title: worklog.title || "Untitled"
        }));
        
        setRecentProjects(recent3);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching recent projects:', err);
        setRecentProjects([]);
        setLoading(false);
      }
    };
    
    fetchRecentProjects();
  }, []);

  const handleRecentProjectClick = (projectId) => {
    // Don't navigate if still loading
    if (loading) return;
    
    const path = `/blog-post?id=${projectId}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  const handleMenuClick = (e, path) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  return (
    <aside className={cn("menubar", collapsed && "menubar-collapsed")}>
      {collapsed ? (
        <div 
          className="menubar-collapsed-logo" 
          onClick={handleLogoClick}
          style={{ 
            cursor: 'pointer', 
            userSelect: 'none',
            WebkitUserSelect: 'none',
            MozUserSelect: 'none',
            msUserSelect: 'none'
          }}
        >
          <img 
            src={logoOnly} 
            alt="NebWork" 
            className="menubar-collapsed-logo-img"
            draggable={false}
          />
        </div>
      ) : (
        <div className="menubar-header">
          <div 
            className="menubar-logo"
            onClick={handleLogoClick}
            style={{ 
              cursor: 'pointer', 
              userSelect: 'none',
              WebkitUserSelect: 'none',
              MozUserSelect: 'none',
              msUserSelect: 'none'
            }}
          >
            <img 
              src={logoWithText} 
              alt="NebWork" 
              className="menubar-logo-img"
              draggable={false}
            />
          </div>
        </div>
      )}

      <nav className="menubar-nav">
        <div className="menubar-toggle-container">
          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleCollapse}
            className="menubar-toggle-btn"
          >
            <ChevronLeft className={cn("menubar-toggle-icon", collapsed && "menubar-toggle-icon-collapsed")} />
          </Button>
        </div>
        <div className="menubar-nav-section">
          {!collapsed && <p className="menubar-nav-label">Menus</p>}
          <div className="menubar-nav-items">
            <Link to="/" onClick={(e) => handleMenuClick(e, "/")}>
              <Button
                variant="ghost"
                className={cn(
                  "menubar-nav-button",
                  activeMenu === "/" && "menubar-nav-button-active"
                )}
              >
                <Home className="menubar-nav-icon" />
                {!collapsed && <span>Home</span>}
              </Button>
            </Link>
            <Link to="/chatbot" onClick={(e) => handleMenuClick(e, "/chatbot")}>
              <Button
                variant="ghost"
                className={cn(
                  "menubar-nav-button",
                  activeMenu === "/chatbot" && "menubar-nav-button-active"
                )}
              >
                <MessageCircle className="menubar-nav-icon" />
                {!collapsed && <span>Chat Bot</span>}
              </Button>
            </Link>
            <Link to="/worklog" onClick={(e) => handleMenuClick(e, "/worklog")}>
              <Button
                variant="ghost"
                className={cn(
                  "menubar-nav-button",
                  activeMenu === "/worklog" && "menubar-nav-button-active"
                )}
              >
                <ClipboardList className="menubar-nav-icon" />
                {!collapsed && <span>Work Log</span>}
              </Button>
            </Link>
            <Link to="/my-stats" onClick={(e) => handleMenuClick(e, "/my-stats")}>
              <Button
                variant="ghost"
                className={cn(
                  "menubar-nav-button",
                  activeMenu === "/my-stats" && "menubar-nav-button-active"
                )}
              >
                <BarChart2 className="menubar-nav-icon" />
                {!collapsed && <span>My Stats</span>}
              </Button>
            </Link>
          </div>
        </div>

        {!collapsed && (
          <div className="menubar-recent-section">
            <p className="menubar-nav-label">Recent Work</p>
            <div className="menubar-recent-items">
              {recentProjects.length > 0 ? (
                recentProjects.map((project) => (
                  <button
                    key={project.id}
                    className="menubar-recent-button"
                    onClick={() => handleRecentProjectClick(project.id)}
                    title={project.title}
                    disabled={loading}
                    style={{ cursor: loading ? 'default' : 'pointer' }}
                  >
                    {project.title}
                  </button>
                ))
              ) : (
                <p className="text-sm text-white px-3 py-2">No recent work</p>
              )}
            </div>
          </div>
        )}
      </nav>
    </aside>
  );
};

export default Menubar;
