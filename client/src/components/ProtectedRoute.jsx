import { Navigate } from 'react-router-dom';
import { useAuth } from '../store/AuthContext';

const ProtectedRoute = ({ children }) => {
  const { token, authUser } = useAuth();
  
  if (!token || !authUser) {
    return <Navigate to="/login" replace />;
  }
  
  return children;
};

export default ProtectedRoute;
