import { useState, useEffect } from "react";
import { Eye, EyeOff, FileText, Circle, LogOut } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import "./Admin.css";
import logoWithText from "@/assets/Logo/Logo with Text_White.png";
import { useNavigate } from "react-router-dom";
import { ADMIN_ENDPOINTS, AUTH_ENDPOINTS } from "../../config/api";
import { toast } from "sonner";
import AdminAnalytics from "./AdminAnalytics";

const Admin = () => {
  const navigate = useNavigate();
  const [showPasswords, setShowPasswords] = useState({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showFormPassword, setShowFormPassword] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingUserId, setEditingUserId] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentAdmin, setCurrentAdmin] = useState({ name: 'Admin', email: '' });
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    division: "",
    password: "Pass@123",
    joinedDate: "",
  });
  
  // Pagination & Search states
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [activeTab, setActiveTab] = useState('users'); // 'users' | 'analytics'

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      // Reset to page 1 when search changes
      setCurrentPage(1);
    }, 500); // Wait 500ms after user stops typing

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Fetch current admin info
  useEffect(() => {
    const fetchAdminInfo = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(AUTH_ENDPOINTS.PROFILE, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        if (response.ok && data.user) {
          setCurrentAdmin({
            name: data.user.name || 'Admin',
            email: data.user.email || ''
          });
        }
      } catch (err) {
        // Error fetching admin info
      }
    };
    fetchAdminInfo();
  }, []);

  // Fetch all users (employees) with pagination and search
  useEffect(() => {
    const fetchUsers = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        // Add search query to API call
        const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
        const url = `${ADMIN_ENDPOINTS.EMPLOYEES}?page=${currentPage}&limit=10${searchParam}`;
        
        const response = await fetch(url, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const data = await response.json();
        
        if (response.ok) {
          const usersArray = data.data || [];
          setUsers(usersArray);
          setFilteredUsers(usersArray);
          
          // Set pagination info
          if (data.pagination) {
            setTotalPages(data.pagination.pages);
            setTotalUsers(data.pagination.total);
          }
        } else {
          toast.error('Failed to fetch users');
          setUsers([]);
          setFilteredUsers([]);
        }
      } catch (err) {
        toast.error('Error loading users');
        setUsers([]);
        setFilteredUsers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [currentPage, debouncedSearch]);

  const togglePassword = (userId) => {
    setShowPasswords((prev) => ({
      ...prev,
      [userId]: !prev[userId],
    }));
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Function to refresh users list
  const refreshUsers = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const response = await fetch(`${ADMIN_ENDPOINTS.EMPLOYEES}?page=${currentPage}&limit=10${searchParam}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      
      if (response.ok) {
        const usersArray = data.data || [];
        setUsers(usersArray);
        setFilteredUsers(usersArray);
        
        if (data.pagination) {
          setTotalPages(data.pagination.pages);
          setTotalUsers(data.pagination.total);
        }
      }
    } catch (err) {
      // Error refreshing users
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = sessionStorage.getItem('token');

    try {
      if (isEditMode) {
        // Update existing user
        // Only include email if it's not empty
        const updateData = {
          name: formData.fullName,
          division: formData.division,
          join_date: formData.joinedDate
        };
        
        // Only add email to update if it's provided
        if (formData.email && formData.email.trim() !== '') {
          updateData.email = formData.email;
        }
        
        const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEE(editingUserId), {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        const responseData = await response.json();

        if (response.ok) {
          toast.success('User updated successfully');
          setIsDialogOpen(false);
          setSearchQuery(""); // Clear search to show updated data
          await refreshUsers(); // Refresh the list
        } else {
          toast.error(responseData.message || 'Failed to update user');
        }
      } else {
        // Add new user
        const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEES, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            name: formData.fullName,
            email: formData.email,
            division: formData.division,
            password: formData.password || 'Pass@123',
            join_date: formData.joinedDate,
            role: 'user'
          })
        });

        const responseData = await response.json();

        if (response.ok) {
          toast.success(`User added successfully! Password: ${formData.password || 'Pass@123'}`);
          setIsDialogOpen(false);
          setSearchQuery(""); // Clear search
          setCurrentPage(1); // Go to first page to see new user
          await refreshUsers(); // Refresh the list
        } else {
          toast.error(responseData.message || 'Failed to add user');
        }
      }

      // Reset form
      setFormData({
        fullName: "",
        email: "",
        division: "",
        password: "Pass@123",
        joinedDate: "",
      });
      setIsEditMode(false);
      setEditingUserId(null);
    } catch (err) {
      toast.error('An error occurred');
    }
  };

  const handleEdit = (user) => {
    // Handle join_date properly - extract date part only
    let joinDate = "";
    if (user.join_date) {
      try {
        joinDate = user.join_date.split('T')[0];
      } catch (e) {
        // Error parsing join_date
      }
    }

    setFormData({
      fullName: user.name || user.fullName || "",
      email: user.email || "",
      division: user.division || "",
      password: "Pass@123",
      joinedDate: joinDate
    });
    setEditingUserId(user._id || user.id);
    setIsEditMode(true);
    setIsDialogOpen(true);
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this account?")) {
      try {
        const token = sessionStorage.getItem('token');
        
        // DELETE endpoint expects id in URL params, not body
        const response = await fetch(ADMIN_ENDPOINTS.EMPLOYEE(userId), {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const responseData = await response.json();

        if (response.ok) {
          toast.success('User deleted successfully');
          setSearchQuery(""); // Clear search
          
          // If current page becomes empty after delete, go to previous page
          if (filteredUsers.length === 1 && currentPage > 1) {
            setCurrentPage(prev => prev - 1);
          } else {
            await refreshUsers();
          }
        } else {
          toast.error(responseData.message || 'Failed to delete user');
        }
      } catch (err) {
        toast.error('An error occurred');
      }
    }
  };

  const handleToggleStatus = async (userId, currentStatus) => {
    const action = currentStatus ? 'block' : 'unblock';
    if (window.confirm(`Are you sure you want to ${action} this user?`)) {
      try {
        const token = sessionStorage.getItem('token');
        
        const response = await fetch(ADMIN_ENDPOINTS.TOGGLE_STATUS(userId), {
          method: 'PATCH',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const responseData = await response.json();

        if (response.ok) {
          toast.success(responseData.message);
          await refreshUsers();
        } else {
          toast.error(responseData.message || 'Failed to toggle user status');
        }
      } catch (err) {
        toast.error('An error occurred');
      }
    }
  };

  const handleLogout = () => {
    // Clear session storage
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('user');
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const handleAddAccount = () => {
    setFormData({
      fullName: "",
      email: "",
      division: "",
      password: "Pass@123", // Default strong password
      joinedDate: "",
    });
    setIsEditMode(false);
    setEditingUserId(null);
    setIsDialogOpen(true);
  };

  return (
    <div className="admin-container">
      {/* Header */}
      <header className="admin-header">
        <div className="menubar-header">
          <div className="menubar-logo">
            <img src={logoWithText} alt="NebWork" className="menubar-logo-img" />
          </div>
        </div>
      

        <div className="header-right">
          <button className="add-account-btn" onClick={handleAddAccount}>
            Add Account
          </button>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
            style={{ 
              marginRight: '1rem', 
              padding: '0.5rem 1rem', 
              background: 'transparent',
              border: '1px solid white',
              color: 'white',
              borderRadius: '0.5rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <LogOut size={18} />
            Logout
          </button>
          <div className="user-info">
            <div className="user-details">
              <div className="user-name">{currentAdmin.name}</div>
              <div className="user-role">Admin</div>
            </div>
            <div className="user-avatar">
              {currentAdmin.name.substring(0, 1).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="admin-main">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
          <h2 className="page-title" style={{ margin: 0 }}>
            {activeTab === 'users' ? 'MANAGE USERS' : 'TEAM ANALYTICS'}
          </h2>
          <div style={{ display: 'flex', gap: '0.5rem', background: '#f0f0f0', borderRadius: '0.5rem', padding: '0.25rem' }}>
            <button
              onClick={() => setActiveTab('users')}
              style={{
                padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none',
                fontSize: '0.875rem', cursor: 'pointer', fontWeight: activeTab === 'users' ? 700 : 400,
                background: activeTab === 'users' ? 'white' : 'transparent',
                boxShadow: activeTab === 'users' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                color: '#333', transition: 'all 0.15s'
              }}
            >👥 Manage Users</button>
            <button
              onClick={() => setActiveTab('analytics')}
              style={{
                padding: '0.4rem 1rem', borderRadius: '0.375rem', border: 'none',
                fontSize: '0.875rem', cursor: 'pointer', fontWeight: activeTab === 'analytics' ? 700 : 400,
                background: activeTab === 'analytics' ? 'white' : 'transparent',
                boxShadow: activeTab === 'analytics' ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                color: '#333', transition: 'all 0.15s'
              }}
            >📊 Analytics</button>
          </div>
        </div>

        {activeTab === 'analytics' ? (
          <AdminAnalytics />
        ) : (
          <div>

        {/* Search Bar */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <input
            type="text"
            placeholder="Search by name, email, or division..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              padding: '0.75rem 1rem',
              borderRadius: '0.5rem',
              border: '1px solid #ddd',
              width: '400px',
              fontSize: '0.95rem'
            }}
          />
          <div style={{ color: '#666', fontSize: '0.9rem' }}>
            Showing {filteredUsers.length} of {totalUsers} users (Page {currentPage} of {totalPages})
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem' }}>Loading users...</div>
        ) : (
          <>
            <div className="table-wrapper">
              <table className="users-table">
              <thead>
                <tr>
                  <th>No.</th>
                  <th>Full Name</th>
                  <th>Email</th>
                  <th>Division</th>
                  <th>Joined Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {!Array.isArray(filteredUsers) || filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="7" style={{ textAlign: 'center', padding: '2rem' }}>
                      {searchQuery ? 'No users found matching your search' : 'No users found'}
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((user, index) => (
                    <tr key={user._id || user.id}>
                      <td>{(currentPage - 1) * 10 + index + 1}</td>
                      <td>{user.name || user.fullName}</td>
                      <td className="email-cell">{user.email}</td>
                      <td>{user.division}</td>
                      <td>{user.join_date ? new Date(user.join_date).toLocaleDateString('id-ID') : '-'}</td>
                      <td>
                        <span style={{
                          padding: '0.25rem 0.75rem',
                          borderRadius: '1rem',
                          fontSize: '0.85rem',
                          fontWeight: '500',
                          backgroundColor: user.isActive === false ? '#fee' : '#efe',
                          color: user.isActive === false ? '#c33' : '#3c3'
                        }}>
                          {user.isActive === false ? 'Blocked' : 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="edit-btn"
                            onClick={() => handleEdit({
                              _id: user._id || user.id,
                              name: user.name || user.fullName,
                              email: user.email,
                              division: user.division,
                              join_date: user.join_date
                            })}
                            aria-label="Edit user"
                          >
                            Edit
                          </button>
                          <button
                            className={user.isActive === false ? "unblock-btn" : "block-btn"}
                            onClick={() => handleToggleStatus(user._id || user.id, user.isActive)}
                            aria-label={user.isActive === false ? "Unblock user" : "Block user"}
                            style={{
                              backgroundColor: user.isActive === false ? '#4CAF50' : '#FF9800',
                              color: 'white',
                              padding: '0.5rem 1rem',
                              border: 'none',
                              borderRadius: '0.5rem',
                              cursor: 'pointer',
                              fontSize: '0.9rem'
                            }}
                          >
                            {user.isActive === false ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            className="delete-btn"
                            onClick={() => handleDelete(user._id || user.id)}
                            aria-label="Delete user"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center',
              gap: '1rem',
              marginTop: '2rem',
              padding: '1rem'
            }}>
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #ddd',
                  background: currentPage === 1 ? '#f5f5f5' : 'white',
                  cursor: currentPage === 1 ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Previous
              </button>
              
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    style={{
                      padding: '0.5rem 0.75rem',
                      borderRadius: '0.5rem',
                      border: '1px solid #ddd',
                      background: currentPage === page ? '#4A90E2' : 'white',
                      color: currentPage === page ? 'white' : '#333',
                      cursor: 'pointer',
                      fontWeight: currentPage === page ? '600' : '400'
                    }}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                style={{
                  padding: '0.5rem 1rem',
                  borderRadius: '0.5rem',
                  border: '1px solid #ddd',
                  background: currentPage === totalPages ? '#f5f5f5' : 'white',
                  cursor: currentPage === totalPages ? 'not-allowed' : 'pointer',
                  fontWeight: '500'
                }}
              >
                Next
              </button>
            </div>
          )}
          </>
          )}
          </div>
        )}
      </main>

      {/* Add/Edit Account Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="dialog-content">
          <div className="dialog-form-container">
            <div className="dialog-illustration">
              <FileText className="illustration-icon document" size={120} strokeWidth={1} />
              <Circle className="illustration-icon circle-1" size={60} strokeWidth={1} />
              <Circle className="illustration-icon circle-2" size={80} strokeWidth={1} />
              <div className="illustration-icon phone">
                <div className="phone-screen"></div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="registration-form">
              <div className="form-group">
                <label htmlFor="fullName">Full Name:</label>
                <input
                  type="text"
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="email">Email:</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required={!isEditMode}
                />
              </div>

              <div className="form-group">
                <label htmlFor="division">Division:</label>
                <input
                  type="text"
                  id="division"
                  name="division"
                  value={formData.division}
                  onChange={handleInputChange}
                  required
                />
              </div>

              {!isEditMode && (
                <div className="form-group">
                  <label htmlFor="password">Password:</label>
                  <input
                    type="text"
                    id="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special char"
                    required
                  />
                  <small style={{ color: '#666', fontSize: '0.85rem', display: 'block', marginTop: '0.25rem' }}>
                    Password requirements:<br/>
                    • Minimum 8 characters<br/>
                    • At least 1 uppercase letter (A-Z)<br/>
                    • At least 1 lowercase letter (a-z)<br/>
                    • At least 1 number (0-9)<br/>
                    • At least 1 special character (!@#$%^&*...)
                  </small>
                </div>
              )}

              <div className="form-group">
                <label htmlFor="joinedDate">Joined Date:</label>
                <input
                  type="date"
                  id="joinedDate"
                  name="joinedDate"
                  value={formData.joinedDate}
                  onChange={handleInputChange}
                />
              </div>
 

              <button type="submit" className="submit-btn">
                {isEditMode ? "Update" : "Registrasi"}
              </button>
            </form>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Admin;

