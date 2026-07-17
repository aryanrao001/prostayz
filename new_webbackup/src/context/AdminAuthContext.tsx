import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import axios from "axios";

interface Admin {
    id: number;
    first_name: string;
    last_name: string;
    email: string;
    phone: string | null;
    country_code: string;
    profile_image?: string | null;
    role: string;
    status: string;
    last_login_at?: string | null;
}

interface AdminAuthContextType {
    admin: Admin | null;
    loading: boolean;
    isAuthenticated: boolean;
    login: (adminData: Admin) => void;
    logout: () => Promise<void>;
    verifyAdmin: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(
    undefined
);

interface AdminAuthProviderProps {
    children: ReactNode;
}

export const AdminAuthProvider = ({
    children,
}: AdminAuthProviderProps) => {
    const [admin, setAdmin] = useState<Admin | null>(null);
    const [loading, setLoading] = useState(true);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const verifyAdmin = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/admin/verify`,
                {
                    withCredentials: true,
                }
            );

            if (data.success) {
                setAdmin(data.admin);
            } else {
                setAdmin(null);
            }
        } catch (error) {
            console.error(error);
            setAdmin(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        verifyAdmin();
    }, []);

    const login = (adminData: Admin) => {
        setAdmin(adminData);
    };

    const logout = async () => {
        try {
            await axios.post(
                `${backendUrl}/api/admin/logout`,
                {},
                {
                    withCredentials: true,
                }
            );
        } catch (error) {
            console.error(error);
        } finally {
            setAdmin(null);
        }
    };

    return (
        <AdminAuthContext.Provider
            value={{
                admin,
                loading,
                login,
                logout,
                verifyAdmin,
                isAuthenticated: !!admin,
            }}
        >
            {children}
        </AdminAuthContext.Provider>
    );
};

export const useAdminAuth = () => {
    const context = useContext(AdminAuthContext);

    if (!context) {
        throw new Error(
            "useAdminAuth must be used inside AdminAuthProvider"
        );
    }

    return context;
};