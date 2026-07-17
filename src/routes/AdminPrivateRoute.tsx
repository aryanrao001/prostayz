import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

const AdminPrivateRoute = () => {
    const {
        admin,
        loading,
        isAuthenticated
    } = useAdminAuth();
    const location = useLocation();
    if (loading) {
        return (
            <div className="flex items-center justify-center h-screen bg-[#F5F2EA]">
                <div className="flex flex-col items-center gap-3">
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#C99A3D] border-t-transparent"></div>
                    <p className="text-[#2F6F62] font-medium">
                        Loading...
                    </p>
                </div>
            </div>
        );
    }
    if (!isAuthenticated || !admin) {
        return (
            <Navigate
                to="/admin/login"
                replace
                state={{ from: location }}
            />
        );
    }
    return <Outlet />;
};

export default AdminPrivateRoute;