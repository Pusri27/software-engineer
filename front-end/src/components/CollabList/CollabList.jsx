import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MoreVertical } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import "./CollabList.css";

const CollabList = ({ owner, collaborators = [], onRemoveCollaborator, isOwner = false, onNavigate }) => {
  const navigate = useNavigate();
  const [openMenuId, setOpenMenuId] = useState(null);

  const handleProfileClick = (userId) => {
    const path = `/profile?userId=${userId}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      navigate(path);
    }
  };

  return (
    <aside className="collab-list">
      {/* Owner Section */}
      <div className="collab-section">
        <h3 className="collab-list-title">Owner</h3>
        {owner ? (
          <div 
            className="collab-item collab-item-clickable"
            onClick={() => handleProfileClick(owner.id)}
          >
            <Avatar className="collab-avatar">
              <AvatarImage src={owner.avatar} />
              <AvatarFallback>{owner.name.substring(0, 2).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="collab-name">{owner.name}</p>
              <p className="collab-division">{owner.division}</p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">Loading owner...</p>
        )}
      </div>

      {/* Collaborators Section */}
      <div className="collab-section">
        <h3 className="collab-list-title">Collaborators</h3>
        <div className="collab-list-container">
          {collaborators.length === 0 ? (
            <p className="text-sm text-muted-foreground">No collaborator.</p>
          ) : (
            collaborators.map((collaborator) => (
              <div key={collaborator.id} className="collab-item-wrapper">
                <div 
                  className="collab-item collab-item-clickable"
                  onClick={() => handleProfileClick(collaborator.id)}
                >
                  <Avatar className="collab-avatar">
                    <AvatarImage src={collaborator.avatar} />
                    <AvatarFallback>{collaborator.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="collab-name">{collaborator.name}</p>
                    <p className="collab-division">{collaborator.division}</p>
                  </div>
                  {isOwner && (
                    <DropdownMenu open={openMenuId === collaborator.id} onOpenChange={(open) => setOpenMenuId(open ? collaborator.id : null)}>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <button className="collab-menu-button">
                          <MoreVertical className="h-4 w-4" />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={(e) => {
                          e.stopPropagation();
                          handleProfileClick(collaborator.id);
                        }}>
                          Show Profile
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => {
                            e.stopPropagation();
                            onRemoveCollaborator(collaborator.id);
                            setOpenMenuId(null);
                          }}
                          className="text-red-600"
                        >
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </aside>
  );
};

export default CollabList;

