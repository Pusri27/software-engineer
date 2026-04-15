import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import VideoCallModal from '../VideoCall/VideoCall';
import "./WorkLogList.css";
import { WORKLOG_ENDPOINTS } from "../../config/api";

// Regex-based HTML stripper — avoids creating DOM elements on every call
const stripHtmlTags = (html) => {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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
  return `#${tag.replace(/^#+/, '')}`;
};

// Parse JWT payload without a library
const parseJwtPayload = (token) => {
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
};

const WorkLogList = ({ filters = { searchQuery: "", selectedTags: [], dateRange: { start: "", end: "" } } }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [callModalOpen, setCallModalOpen] = useState(false);
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

  // Read current user ID once from JWT — avoids a serial profile fetch on every render
  const currentUserIdRef = useRef(null);
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (token) {
      const payload = parseJwtPayload(token);
      currentUserIdRef.current = payload?.id || payload?._id || payload?.userId || null;
    }
  }, []);

  const handleWorkLogClick = (logId) => { navigate(`/blog-post?id=${logId}`); };
  const handleCreateNew  = () => { navigate('/blog-editor'); };

  useEffect(() => {
    const fetchUserWorklogs = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const currentUserId = currentUserIdRef.current;

        // Build query params for filter + pagination
        const params = new URLSearchParams();
        if (filters?.searchQuery)          params.append('search', filters.searchQuery);
        if (filters?.selectedTags?.length) params.append('tag', filters.selectedTags.join(','));
        if (filters?.dateRange?.start)     params.append('from', filters.dateRange.start);
        if (filters?.dateRange?.end)       params.append('to',   filters.dateRange.end);
        params.append('page',  pagination.currentPage);
        params.append('limit', pagination.limit);

        const url = `${WORKLOG_ENDPOINTS.FILTER}?${params.toString()}`;

        const worklogsResponse = await fetch(url, {
          headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!worklogsResponse.ok) {
          console.error('Filter response error:', worklogsResponse.status);
          setFilteredPosts([]);
          return;
        }

        const worklogsData = await worklogsResponse.json();
        const allWorklogs = Array.isArray(worklogsData)
          ? worklogsData
          : (worklogsData?.worklogs || []);

        // Save pagination from backend
        if (worklogsData?.pagination) {
          setPagination(prev => ({ ...prev, ...worklogsData.pagination }));
        }

        // Backend already scopes to division — only mark owner/collaborator badge
        const convertedPosts = allWorklogs.map((worklog) => {
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
              hour: '2-digit', minute: '2-digit'
            }),
            readTime: getReadTime(plainTextContent),
            author: {
              name:     worklog.user?.name || "Unknown",
              division: worklog.user?.division || "Unknown Division",
              avatar:   worklog.user?.profile_photo || worklog.user?.profilePicture || "/placeholder.jpeg",
            },
            isOwner,
            isCollaborator: !isOwner && worklog.collaborators?.some(
              c => c._id === currentUserId || c.id === currentUserId
            ),
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
  }, [filters, pagination.currentPage]);


  return (
      <>
    <div className="worklog-list">
        <div className="flex gap-4 mb-6">
            <Button onClick={handleCreateNew} className="create-new-button">
                CREATE NEW
            </Button>
            <Button onClick={() => setCallModalOpen(true)} variant="outline" className="video-call-button">
                Video Call
            </Button>
        </div>

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
          <VideoCallModal isOpen={callModalOpen} onClose={() => setCallModalOpen(false)} />
      </>
  );
};

export default WorkLogList;

