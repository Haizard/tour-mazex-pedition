/* eslint-disable react/prop-types */
import { Navigate, useLocation } from "react-router-dom";

const isBrowser = typeof window !== "undefined";

const HotelPartnerRoute = ({ children }) => {
  const location = useLocation();
  const token = isBrowser ? window.localStorage.getItem("hotelPartnerAuthToken") : "";

  if (!token) {
    return <Navigate to="/hotel-partner/login" replace state={{ from: location }} />;
  }

  return children;
};

export default HotelPartnerRoute;
