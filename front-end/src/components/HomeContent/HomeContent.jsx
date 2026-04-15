import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useState, useEffect } from "react";
import "./HomeContent.css";
import { AUTH_ENDPOINTS, WORKLOG_ENDPOINTS} from "../../config/api";
import { Loading } from "@/components/ui/loading";

// Utility function to strip HTML tags
const stripHtmlTags = (html) => {
  if (!html) return "";
  const tmp = document.createElement("DIV");
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || "";
};

// Utility function to ensure hashtag has only one #
const formatHashtag = (tag) => {
  if (!tag) return "";
  // Remove all # from start, then add one #
  return `#${tag.replace(/^#+/, '')}`;
};

const HomeContent = ({ filters = { searchQuery: "", selectedTags: [], dateRange: { start: "", end: "" } }, onWorklogsLoaded }) => {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("User");
  const [userDivision, setUserDivision] = useState("");
  const [searchParams] = useSearchParams();
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDocs: 0,
    hasNextPage: false,
    hasPrevPage: false,
    limit: 10
  });
  const selectedTag = searchParams.get('tag');  // ← Extract ?tag=AI

  // Fetch user profile untuk greeting + divisi
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        const userData = data.user || data;
        setUserName(userData.name || "User");
        setUserDivision(userData.division || "");
      } catch (err) {
        console.error('Error fetching user profile:', err);
      }
    };
    fetchUserProfile();
  }, []);

  // Reset pagination when selectedTag changes
  useEffect(() => {
    setPagination(prev => ({
      ...prev,
      currentPage: 1
    }));
  }, [selectedTag]);

  // Fetch worklogs dari backend dengan filters applied
  useEffect(() => {
    const fetchWorklogs = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        
        // Build query params
        const params = new URLSearchParams();
        if (filters?.searchQuery) params.append('search', filters.searchQuery);
        if (filters?.selectedTags?.length > 0) params.append('tag', filters.selectedTags.join(','));
        if (filters?.dateRange?.start) params.append('from', filters.dateRange.start);
        if (filters?.dateRange?.end) params.append('to', filters.dateRange.end);
        if (selectedTag) params.append('tag', selectedTag); // URL query param priority
        
        // Add pagination params
        params.append('page', pagination.currentPage);
        params.append('limit', pagination.limit);
        
        const queryString = params.toString();
        const url = `${WORKLOG_ENDPOINTS.FILTER}${queryString ? '?' + queryString : ''}`;
        
        const response = await fetch(url, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Filter response error:', response.status);
          console.error('Error response:', errorText);
          setPosts([]);
          setLoading(false);
          return;
        }

        const data = await response.json();

        // Update pagination state
        if (data.pagination) {
          setPagination(data.pagination);
        }
        
        // Extract worklogs array from response
        let worklogsArray = [];
        
        if (data?.worklogs && Array.isArray(data.worklogs)) {
          worklogsArray = data.worklogs.filter(worklog => worklog.user);
        } else if (Array.isArray(data)) {
          worklogsArray = data.filter(worklog => worklog.user);
        }
        
        // Validate it's an array
        if (!Array.isArray(worklogsArray)) {
          console.error('worklogsArray is not an array:', worklogsArray);
          setPosts([]);
          setLoading(false);
          return;
        }
    
        // Backend filterWorkLogs() now handles division filtering with JWT token

        // Notify parent with raw worklog data (for AI summary)
        onWorklogsLoaded?.(worklogsArray);

        const convertedPosts = worklogsArray.map((worklog) => {
          // Strip HTML tags from content for preview
          const plainTextContent = stripHtmlTags(worklog.content);
          
          // Create post object
          const post = {
            id: worklog._id || worklog.id,
            title: worklog.title || "Work Log",
            author: {
              name: worklog.user?.name || "User",
              division: worklog.user?.division || "Unknown Division",
              avatar: worklog.user?.profilePicture || worklog.user?.profile_photo || "/placeholder.jpeg",
            },
            date: new Date(worklog.datetime || worklog.createdAt).toLocaleDateString('id-ID', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            }),
            hashtags: worklog.tag || [],
            content: plainTextContent 
              ? (plainTextContent.length > 500 
                  ? `${plainTextContent.substring(0, 500)}...` 
                  : plainTextContent)
              : "",
            image: worklog.media?.[0] || null,
          };
          
          return post;
        });
        
        setPosts(convertedPosts);
      } catch (err) {
        console.error('Error fetching worklogs:', err);
        setPosts([]);
      } finally {
        setLoading(false);
      }
    };
    fetchWorklogs();
  }, [selectedTag, filters, pagination.currentPage]); // Add pagination.currentPage as dependency

  // detail post => navigate ke halaman blog-post
  const handlePostClick = (postId) => {
    navigate(`/blog-post?id=${postId}`);
  };

  return (
    <div className="home-content">
      <h1 className="home-greeting">Hello, {userName}</h1>

      {selectedTag && (
        <div className="filter-tag-banner">
          <div className="filter-tag-content">
            <span className="filter-label">Filtering by tag:</span>
            <span className="filter-tag-value">{formatHashtag(selectedTag)}</span>
          </div>
          <button className="clear-filter-btn" onClick={() => navigate('/')}>
            <svg 
              xmlns="http://www.w3.org/2000/svg" 
              width="16" 
              height="16" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            >
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
            Clear Filter
          </button>
        </div>
      )}
      
      
      {loading ? (
        <Loading message="Loading work logs..." />
      ) : posts.length === 0 ? (
        <div className="text-center py-8">No work logs yet</div>
      ) : (
        <div className="posts-container">
          {posts.map((post) => (
            <article key={post.id} className="post-card" onClick={() => handlePostClick(post.id)} style={{ cursor: "pointer" }}>
              <div className="post-header">
                <div className="post-author">
                  <Avatar className="post-avatar">
                    <AvatarImage src={post.author.avatar} />
                    <AvatarFallback>
                      {post.author.name.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="post-author-name">{post.author.name}</p>
                    <p className="post-author-division">{post.author.division}</p>
                  </div>
                </div>
                <span className="post-date">{post.date}</span>
              </div>

              <h2 className="post-title">{post.title}</h2>

              {post.hashtags.length > 0 && (
                <p className="post-hashtags">
                  {post.hashtags.map((tag) => (
                    <span 
                      key={tag}
                      onClick={(e) => {
                        e.stopPropagation();
                        // Reset pagination and navigate
                        setPagination(prev => ({
                          ...prev,
                          currentPage: 1
                        }));
                        // Clean tag: remove # and trim
                        const cleanTag = tag.replace(/^#+/, '').trim();
                        navigate(`/?tag=${cleanTag}`);
                      }}
                      style={{ cursor: "pointer", color: "blue", marginRight: "8px" }}
                    >
                      {formatHashtag(tag)}
                    </span>
                  ))}
                </p>
              )}

              {post.content && (
                <p className="post-content">
                  {post.content}
                  {post.content.endsWith('...') && (
                    <span className="text-primary text-sm ml-1 font-medium">See more</span>
                  )}
                </p>
              )}

              {post.image && (
                <div className="post-image-container">
                  <img src={post.image} alt={post.title} className="post-image" />
                </div>
              )}
            </article>
          ))}
        </div>
      )}

      {/* Pagination Controls */}
      {!loading && posts.length > 0 && (
        <div className="flex justify-center items-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
            disabled={!pagination.hasPrevPage}
          >
            Previous
          </Button>
          
          <div className="flex gap-1">
            {[...Array(pagination.totalPages)].map((_, index) => {
              const pageNumber = index + 1;
              const isCurrentPage = pageNumber === pagination.currentPage;
              // Show first page, last page, current page, and pages around current page
              const shouldShow = pageNumber === 1 || 
                               pageNumber === pagination.totalPages ||
                               Math.abs(pageNumber - pagination.currentPage) <= 1;

              if (!shouldShow) {
                // Show dots only for first gap
                if (pageNumber === 2 || pageNumber === pagination.totalPages - 1) {
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
            disabled={!pagination.hasNextPage}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
};

export default HomeContent;

