import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Eye, Clock } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Menubar from "@/components/Menubar/Menubar";
import Navbar from "@/components/Navbar/Navbar";
import FriendsList from "@/components/FriendsList/FriendsList";
import { WORKLOG_ENDPOINTS } from "../config/api";

const WorkLogVersion = () => {
  const navigate = useNavigate();
  const { id } = useParams(); // id WorkLog nya
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [versions, setVersions] = useState([]);
  const [title, setTitle] = useState("");
  const [selectedHistory, setSelectedHistory] = useState(null);


  useEffect(() => {
    const fetchVersions = async () => {
      try {
        const token = sessionStorage.getItem("token");

        const res = await fetch(WORKLOG_ENDPOINTS.VERSIONS(id), {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`
          }
        });

        const data = await res.json();

        setVersions(data?.versions ?? []);  // fallback aman
        setTitle(data?.title ?? "");
      } catch (err) {
        console.error("fetchVersions error:", err);
      }
    };

    if (!id) return;

    fetchVersions();
  }, [id]);

  const fetchSingleHistory = async (hid) => {
    const token = sessionStorage.getItem("token");

    const res = await fetch(WORKLOG_ENDPOINTS.LOGHISTORY_ONE(hid), {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    const data = await res.json();

    setSelectedHistory(data);
  };


  return (
    <div className="flex h-screen bg-background">
      <Menubar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
      />

      <main className="flex-1 flex flex-col">
        <Navbar />

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="text-foreground"
              >
                <ChevronLeft className="h-6 w-6" />
              </Button>
              <h1 className="text-3xl font-bold">{title}</h1>
            </div>

            <div className="space-y-4 max-w-4xl">
              {Array.isArray(versions) && versions.map(v => (
                <div key={v._id} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4 flex-1">
                        <img
                          src={v.user?.profile_photo ?? "/placeholder.jpeg"}
                          alt={v.user?.name}
                          className="w-14 h-14 rounded-full object-cover ring-2 ring-primary/10"
                        />
                        <div className="flex-1">
                          <p className="font-semibold text-lg">{v.user?.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {v.user?.division}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>
                          {new Date(v.datetime).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </div>
                    </div>
                    <p className="text-base text-foreground mb-4 pl-[72px]">{v.message}</p>
                  </div>
                  
                  {/* Action bar at the bottom */}
                  <div className="bg-muted/30 px-6 py-3 flex items-center justify-end border-t border-border">
                    <Button
                      variant="default"
                      size="sm"
                      className="gap-2"
                      onClick={async () => {
                        await fetchSingleHistory(v._id);
                        navigate(`/blog-post?id=${id}`, {
                          state: {
                            snapshot: v.snapshot,
                            historyId: v._id
                          }
                        });
                      }}
                    >
                      <Eye className="h-4 w-4" />
                      View This Version
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <FriendsList/>
        </div>
      </main>
    </div>
  );
};

export default WorkLogVersion;


