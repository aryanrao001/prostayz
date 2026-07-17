import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const SetupRoute = () => {
    const { loading, isAuthenticated, setup } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div>Loading...</div>;
    }

    // User not logged in
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Setup status not loaded
    if (!setup) {
        return <div>Loading...</div>;
    }

    // Current page
    const currentPath = location.pathname;

    // Address not completed
    if (
        setup.step === "address" &&
        currentPath !== "/vendor/setup/address"
    ) {
        return <Navigate to="/vendor/setup/address" replace />;
    }

    // Listing not completed
    if (
        setup.step === "listing" &&
        currentPath !== "/vendor/setup/listing"
    ) {
        return <Navigate to="/vendor/setup/listing" replace />;
    }

    // Documents not completed
    if (
        setup.step === "documents" &&
        currentPath !== "/vendor/setup/documents"
    ) {
        return <Navigate to="/vendor/setup/documents" replace />;
    }

    // Setup completed but vendor is trying to open setup pages
    if (
        setup.step === "completed" &&
        currentPath.startsWith("/vendor/setup")
    ) {
        return <Navigate to="/vendor/dashboard" replace />;
    }

    return <Outlet />;
};

export default SetupRoute;