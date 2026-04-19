import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { usePlatformAdminAuth } from "../../context/PlatformAdminAuthContext";

const PlatformAdminRoute = ({ children }) => {
  const location = useLocation();
  const { isAuthenticated, loading } = usePlatformAdminAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center px-6">
        <div className="text-center">
          <p className="text-cyan-400 text-xs font-black uppercase tracking-[0.3em] mb-3">
            Platform Console
          </p>
          <p className="text-sm font-bold text-slate-300">
            Restoring platform admin session...
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/platform/login" replace state={{ from: location }} />;
  }

  return children;
};

export default PlatformAdminRoute;
