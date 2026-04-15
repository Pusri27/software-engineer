"use client"

import * as React from "react"
import { Search, LogOut, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { logout } from "@/utils/authUtils";
import "./Navbar.css";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS } from "../../config/api";

// Utility function to ensure hashtag has only one #
const formatHashtag = (tag) => {
  if (!tag) return "";
  // Remove all # from start, then add one #
  return `#${tag.replace(/^#+/, '')}`;
};

const Navbar = ({ children, onFilterChange, onNavigate }) => {
  const navigate = useNavigate();
  const [employee, setEmployee] = useState({
    name: "Loading...",
    division: "Loading...",
    profilePicture: "/placeholder.jpeg"
  });
  const [loading, setLoading] = useState(true);
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [userDivision, setUserDivision] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  
  // Filter and limit tags
  const filteredTags = React.useMemo(() => {
    let filtered = [...availableTags];
    
    // Apply search filter if there's a search query
    if (tagSearch) {
      const searchLower = tagSearch.toLowerCase();
      filtered = filtered.filter(tag => 
        tag.toLowerCase().includes(searchLower)
      );
    }
    
    // If no search, limit to 15 most recent tags
    if (!tagSearch && filtered.length > 15) {
      filtered = filtered.slice(0, 15);
    }
    
    return filtered;
  }, [availableTags, tagSearch]);

  // Fetch user profile
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    
    if (!token) {
      setLoading(false);
      setEmployee({
        name: "User",
        division: "Employee",
        profilePicture: "/placeholder.jpeg"
      });
      return;
    }

    fetch(AUTH_ENDPOINTS.PROFILE, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => res.json())
      .then(data => {
        const userData = data.user || data;
        const division = userData.division || "Employee";
        setUserDivision(division);
        setEmployee({
          name: userData.name || "User",
          division: division,
          profilePicture: userData.profilePicture || "/placeholder.jpeg"
        });
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching profile:', err);
        setLoading(false);
      });
  }, []);

  // Fetch available tags dari worklogs se-divisi
  useEffect(() => {
    if (!userDivision) return;

    const token = sessionStorage.getItem('token');
    fetch(WORKLOG_ENDPOINTS.FILTER, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    })
      .then(res => {
        if (!res.ok) {
          console.error('Navbar fetch tags - error status:', res.status);
          throw new Error(`HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        const worklogs = data.worklogs || data || [];
        const divisionWorklogs = worklogs.filter(w => w.user?.division === userDivision);
        // Extract unique tags
        const tags = new Set();
        divisionWorklogs.forEach(w => {
          if (w.tag && Array.isArray(w.tag)) {
            w.tag.forEach(tag => tags.add(tag));
          }
        });
        
        setAvailableTags(Array.from(tags).sort());
      })
      .catch(err => {
        console.error('Error fetching tags:', err);
        setAvailableTags([]);
      });
  }, [userDivision]);

  // Handle filter changes - notify parent
  useEffect(() => {
    const filterData = {
      searchQuery,
      selectedTags,
      dateRange
    };
    
    if (onFilterChange) {
      onFilterChange(filterData);
    }
  }, [searchQuery, selectedTags, dateRange]);

  const handleProfileClick = () => {
    if (onNavigate) {
      onNavigate("/profile");
    } else {
      navigate("/profile");
    }
  };

  const handleLogout = () => {
    if (onNavigate) {
      onNavigate(() => logout(navigate));
    } else {
      logout(navigate);
    }
  };

  const toggleTag = (tag) => {
    // Remove # from tag for consistent comparison
    const cleanTag = tag.replace(/^#+/, '');
    setSelectedTags(prev => 
      prev.includes(cleanTag) 
        ? prev.filter(t => t !== cleanTag)
        : [...prev, cleanTag]
    );
  };

  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTags([]);
    setDateRange({ start: "", end: "" });
  };

  return (
    <header className="navbar">
      {/* Left spacer for centering */}
      <div className="navbar-spacer"></div>

      <div className="navbar-search">
        <Search className="navbar-search-icon" />
        <Input
          placeholder="Search by title, content, or user..."
          className="navbar-search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <Button 
          variant="ghost" 
          size="icon"
          onClick={() => setShowFilter(!showFilter)}
          className={showFilter ? "text-primary" : ""}
          title="Toggle Filters"
        >
          <Filter className="navbar-settings-icon" />
        </Button>
      </div>

      {/* Filter Panel */}
      {showFilter && (
        <div className="absolute top-16 left-0 right-0 bg-card border border-border rounded-lg p-4 shadow-lg z-50 max-w-2xl mx-auto">
          <div className="flex justify-between items-center mb-4">
            <h4 className="font-semibold">Filters</h4>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={clearFilters}
              className="text-xs"
            >
              Clear All
            </Button>
          </div>

          <div className="space-y-4">
            {/* Tags Filter */}
            {availableTags.length > 0 && (
              <div>
                <label className="text-sm font-medium block mb-2">Tags</label>
                <Input
                  placeholder="Search tags..."
                  className="mb-2"
                  value={tagSearch}
                  onChange={(e) => setTagSearch(e.target.value)}
                />
                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                  {filteredTags.map(tag => {
                    const cleanTag = tag.replace(/^#+/, '');
                    return (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className={`px-3 py-1 rounded text-sm transition-all ${
                          selectedTags.includes(cleanTag)
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80'
                        }`}
                      >
                        {formatHashtag(tag)}
                      </button>
                    );
                  })}
                </div>
                {availableTags.length > 15 && filteredTags.length === 15 && !tagSearch && (
                  <p className="text-xs text-muted-foreground mt-2">Showing 15 most recent tags. Use search to find more.</p>
                )}
              </div>
            )}

            {/* Date Range Filter */}
            <div>
              <label className="text-sm font-medium block mb-2">Date Range</label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="flex-1"
                  placeholder="Start date"
                />
                <span className="text-sm text-muted-foreground py-2">to</span>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="flex-1"
                  placeholder="End date"
                />
              </div>
            </div>

            {/* Apply Filter Button */}
            <div className="flex gap-2 justify-end pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilter(false)}
              >
                Close
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowFilter(false);
                }}
              >
                Apply Filter
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Custom content (search/filter specific to page) */}
      {children && <div className="navbar-custom-content">{children}</div>}

      {/* User Actions */}
      <div className="navbar-actions">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={handleLogout}
          title="Logout"
        >
          <LogOut className="navbar-settings-icon" />
        </Button>
        <div className="navbar-user" onClick={handleProfileClick} style={{ cursor: "pointer" }}>
          <Avatar className="navbar-user-avatar">
            <AvatarImage src={employee.profilePicture} />
            <AvatarFallback>{employee.name.substring(0, 2).toUpperCase()}</AvatarFallback>
          </Avatar>
          <div className="navbar-user-info">
            <p className="navbar-user-name">{employee.name}</p>
            <p className="navbar-user-division">{employee.division}</p>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;

