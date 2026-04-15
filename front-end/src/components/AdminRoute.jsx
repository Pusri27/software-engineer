import { Navigate } from 'react-router-dom';

function AdminRoute({ children }) {
    const token = sessionStorage.getItem('token');
    const userStr = sessionStorage.getItem('user');
    
    // Check if token exists
    if (!token || token.trim() === '') {
        console.log('❌ AdminRoute: No valid token - redirecting to login');
        return <Navigate to="/login" replace />;
    }
    
    // Check if user data exists and role is admin
    try {
        const user = userStr ? JSON.parse(userStr) : null;
        const userRole = user?.role || 'user';
        
        if (userRole !== 'admin') {
            console.log('❌ AdminRoute: User is not admin - redirecting to home');
            return <Navigate to="/" replace />;
        }
        
        console.log('✅ AdminRoute: Admin access granted');
        return children;
    } catch (error) {
        console.error('❌ AdminRoute: Error parsing user data', error);
        return <Navigate to="/login" replace />;
    }
}

export default AdminRoute;
