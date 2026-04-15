import { Navigate } from 'react-router-dom';

function ProtectedRoute({ children }) {
    const token = sessionStorage.getItem('token');
    
    // Check if token exists and is not empty
    if (!token || token.trim() === '') {
        console.log('❌ ProtectedRoute: No valid token - redirecting to login');
        return <Navigate to="/login" replace />;
    }
    
    return children;
}

export default ProtectedRoute;
