import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAdminAuth } from "../../context/AdminAuthContext";

const AdminRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = useAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-primary text-xs font-black uppercase tracking-[0.3em] mb-3">
            Admin Portal
          </p>
          <p className="text-sm font-bold text-slate-300">
            Restoring your secure session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    const demoMatch = location.pathname.match(/^\/demo\/[^/]+/);
    const loginPath = demoMatch ? `${demoMatch[0]}/login` : "/login";
    return <Navigate to={loginPath} replace state={{ from: location }} />;
  }

  return children;
};

export default AdminRoute;
