import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./WorkLogList.css";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS } from "../../config/api";

// Utility function to strip HTML tags
const stripHtmlTags = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Estimate reading time based on word count (avg 200 wpm)
const getReadTime = (text) => {
  if (!text) return "< 1 min read";
  const words = text.trim().split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return `${minutes} min read`;
};

// Utility function to ensure hashtag has only one #
const formatHashtag = (tag) => {
  if (!tag) return "";
  // Remove all # from start, then add one #
  return `#${tag.replace(/^#+/, '')}`;
};

const WorkLogList = ({ filters = { searchQuery: "", selectedTags: [], dateRange: { start: "", end: "" } } }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [searchParams] = useSearchParams();
   const [pagination, setPagination] = useState({
      currentPage: 1,
      totalPages: 1,
      totalDocs: 0,
      hasNextPage: false,
      hasPrevPage: false,
      limit: 10
    });
  const handleWorkLogClick = (logId) => {
    navigate(`/blog-post?id=${logId}`);
  };

  const handleCreateNew = () => {
    navigate('/blog-editor'); // Navigate to BlogEditor without ID for create mode
  };

 useEffect(() => {
  const fetchUserWorklogs = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch current user ID
      const userResponse = await fetch(AUTH_ENDPOINTS.PROFILE, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      const userData = await userResponse.json();
      const currentUserId = userData.user?.id || userData.user?._id || userData.id || userData._id;
      
      // Build query params for filter + pagination
      const params = new URLSearchParams();
      if (filters?.searchQuery) params.append('search', filters.searchQuery);
      if (filters?.selectedTags?.length > 0) params.append('tag', filters.selectedTags.join(','));
      if (filters?.dateRange?.start) params.append('from', filters.dateRange.start);
      if (filters?.dateRange?.end) params.append('to', filters.dateRange.end);
      params.append('page', pagination.currentPage);
      params.append('limit', pagination.limit);

      const queryString = params.toString();
      const url = `${WORKLOG_ENDPOINTS.FILTER}${queryString ? '?' + queryString : ''}`;
      
      const worklogsResponse = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!worklogsResponse.ok) {
        console.error('Filter response error:', worklogsResponse.status);
        setFilteredPosts([]);
        setLoading(false);
        return;
      }

      const worklogsData = await worklogsResponse.json();
      const allWorklogs = Array.isArray(worklogsData) ? worklogsData : (worklogsData?.worklogs || []);

      // ✅ Simpan pagination info dari backend
      if (worklogsData?.pagination) {
        setPagination(prev => ({ ...prev, ...worklogsData.pagination }));
      }

      const userWorklogs = allWorklogs.filter(worklog => {
        const isOwner = worklog.user?._id === currentUserId || worklog.user?.id === currentUserId;
        const isCollaborator = worklog.collaborators?.some(collab => 
          collab._id === currentUserId || collab.id === currentUserId
        );
        return isOwner || isCollaborator;
      });
      
      const convertedPosts = userWorklogs.map((worklog) => {
        const plainTextContent = stripHtmlTags(worklog.content);
        const isOwner = worklog.user?._id === currentUserId || worklog.user?.id === currentUserId;
        return {
          id: worklog._id || worklog.id,
          title: worklog.title || "Untitled",
          hashtags: worklog.tag || [],
          description: plainTextContent 
            ? (plainTextContent.length > 500 
                ? `${plainTextContent.substring(0, 500)}...` 
                : plainTextContent)
            : "No description",
          date: new Date(worklog.datetime || worklog.createdAt).toLocaleDateString('id-ID'),
          time: new Date(worklog.datetime || worklog.createdAt).toLocaleTimeString('id-ID', { 
            hour: '2-digit', 
            minute: '2-digit' 
          }),
          readTime: getReadTime(plainTextContent),
          author: {
            name: worklog.user?.name || "Unknown",
            division: worklog.user?.division || "Unknown Division",
            avatar: worklog.user?.profilePicture || worklog.user?.profile_photo || "/placeholder.jpeg",
          },
          isOwner,
          isCollaborator: !isOwner && worklog.collaborators?.some(collab => 
            collab._id === currentUserId || collab.id === currentUserId
          )
        };
    });

      setFilteredPosts(convertedPosts);
    } catch (error) {
      console.error('Error fetching worklogs:', error);
      setFilteredPosts([]);
    } finally {
      setLoading(false);
    }
  };

  fetchUserWorklogs();
}, [filters, pagination.currentPage]); // ✅ Tambahkan dependency ini


  return (
    <div className="worklog-list">
      <Button onClick={handleCreateNew} className="create-new-button">
        CREATE NEW
      </Button>

      <h2 className="worklog-list-title">MY WORK PROJECT</h2>

      <div className="worklog-items-container">
        {loading ? (
          <div className="text-center py-8">Loading work logs...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-8">No work logs found</div>
        ) : (
          filteredPosts.map((log) => (
            <article 
              key={log.id} 
              className="worklog-item" 
              onClick={() => handleWorkLogClick(log.id)} 
              style={{ cursor: "pointer" }}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={log.author.avatar}
                    alt={log.author.name}
                    className="w-10 h-10 rounded-full object-cover"
                  />
                  <div>
                    <p className="font-medium text-sm">{log.author.name}</p>
                    <p className="text-xs text-muted-foreground">{log.author.division}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {log.isOwner ? (
                    <span className="px-2 py-1 bg-primary/10 text-primary text-xs rounded-full">Owner</span>
                  ) : log.isCollaborator ? (
                    <span className="px-2 py-1 bg-purple-500/10 text-purple-500 text-xs rounded-full">Collaborator</span>
                  ) : null}
                </div>
              </div>

              <h3 className="worklog-item-title">{log.title}</h3>

              <p className="worklog-item-hashtags">{log.hashtags.map(tag => formatHashtag(tag)).join(" ")}</p>

              <p className="worklog-item-description">
                {log.description}
                {log.description.endsWith('...') && (
                  <span className="text-primary text-sm ml-1 font-medium">See more</span>
                )}
              </p>

              <div className="worklog-item-footer">
                <span className="worklog-item-date">
                  {log.date}
                  <br />
                  {log.time}
                </span>
                <span className="worklog-item-read-time">⏱ {log.readTime}</span>
              </div>
            </article>
          ))
        )}
        </div>
        {/* Pagination Controls */}
        {!loading && filteredPosts.length > 0 && (
          <div className="flex justify-center items-center gap-2 mt-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
              disabled={!pagination.hasPrevPage || pagination.currentPage <= 1}
            >
              Previous
            </Button>
            
            <div className="flex gap-1">
              {/* Hanya generate pagination jika ada data */}
              {filteredPosts.length > 0 && [...Array(Math.min(Math.ceil(filteredPosts.length / pagination.limit), pagination.totalPages))].map((_, index) => {
                const pageNumber = index + 1;
                const isCurrentPage = pageNumber === pagination.currentPage;
                // Show first page, last page, current page, and pages around current page
                const shouldShow = pageNumber === 1 || 
                                 pageNumber === Math.ceil(filteredPosts.length / pagination.limit) ||
                                 Math.abs(pageNumber - pagination.currentPage) <= 1;

                if (!shouldShow) {
                  // Show dots only for first gap
                  if (pageNumber === 2 || pageNumber === Math.ceil(filteredPosts.length / pagination.limit) - 1) {
                    return <span key={`dot-${pageNumber}`} className="px-2">...</span>;
                  }
                  return null;
                }

                return (
                  <Button
                    key={pageNumber}
                    variant={isCurrentPage ? "default" : "outline"}
                    size="sm"
                    className={`w-8 h-8 p-0 ${isCurrentPage ? 'bg-primary text-primary-foreground' : ''}`}
                    onClick={() => setPagination(prev => ({ ...prev, currentPage: pageNumber }))}
                  >
                    {pageNumber}
                  </Button>
                );
              })}
            </div>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
              disabled={!pagination.hasNextPage || pagination.currentPage >= Math.ceil(filteredPosts.length / pagination.limit)}
            >
              Next
            </Button>
          </div>
        )}
      </div>

  );
};

export default WorkLogList;

