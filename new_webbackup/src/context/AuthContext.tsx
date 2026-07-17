import {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import axios from "axios";

interface Vendor {
    id: number;
    vendor_name: string;
    email: string;
    phone: string;
    business_name: string;
    profile_image?: string;
    status: string;
}

interface VendorSetup {
    currentStep: number;
    step: string;
    redirect: string;
}

interface AuthContextType {
    vendor: Vendor | null;
    loading: boolean;
    isAuthenticated: boolean;
    setup: VendorSetup | null;
    login: (vendorData: Vendor) => void;
    logout: () => Promise<void>;
    verifyVendor: () => Promise<void>;
    verifySetup: () => Promise<void>;
}

// interface AuthContextType {
//     vendor: Vendor | null;
//     loading: boolean;
//     isAuthenticated: boolean;
//     login: (vendorData: Vendor) => void;
//     logout: () => Promise<void>;
//     verifyVendor: () => Promise<void>;
// }

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
    children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
    const [vendor, setVendor] = useState<Vendor | null>(null);
    const [loading, setLoading] = useState(true);
    const [setup, setSetup] = useState<VendorSetup | null>(null);

    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const verifySetup = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/vendor/setup-status`,
                {
                    withCredentials: true,
                }
            );
            if (data.success) {
                setSetup({
                    currentStep: data.currentStep,
                    step: data.step,
                    redirect: data.redirect,
                });
            }
        } catch (error) {
            console.log(error);
            setSetup(null);
        }
    };

    const verifyVendor = async () => {
        try {
            const { data } = await axios.get(
                `${backendUrl}/api/vendor/verify`,
                {
                    withCredentials: true,
                }
            );
            if (data.success) {
                setVendor(data.vendor);
                // Fetch setup status
                await verifySetup();
            } else {
                setVendor(null);
                setSetup(null);
            }
        } catch (error) {
            console.error(error);
            setVendor(null);
            setSetup(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        verifyVendor();
    }, []);

    const login = (vendorData: Vendor) => {
        setVendor(vendorData);
    };

    const logout = async () => {
        try {
            await axios.post(
                `${backendUrl}/api/vendor/logout`,
                {},
                {
                    withCredentials: true,
                }
            );
        } catch (error) {
            console.error(error);
        } finally {
            setVendor(null);
        }
    };

    return (
        <AuthContext.Provider
            value={{
                vendor,
                setup,
                loading,
                login,
                logout,
                verifyVendor,
                verifySetup,
                isAuthenticated: !!vendor,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
};