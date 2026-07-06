import React, { useEffect, useState } from "react";
import { Eye, EyeOff, ShieldCheck } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";
// import { useAuth } from "../context/AuthContext";
import loginBack from "../../assets/loginback.jpg";
import { useAdminAuth } from "../../context/AdminAuthContext";

interface LoginData {
    email: string;
    password: string;
}

const inputCls =
    "w-full bg-white border border-[#DBD3C4] rounded-lg px-3.5 py-3 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition";

const AdminLogin = () => {
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
    const { verifyAdmin } = useAdminAuth(); // Assuming your context exposes an admin verification hook

    useEffect(() => {
        const checkExistingSession = async () => {
            try {
                // Verify if a valid admin session cookie exists
                await verifyAdmin();
                // navigate("/admin/dashboard", { replace: true });
            } catch (error) {
                // No active admin session found; retain on login interface
            }
        };
        checkExistingSession();
    }, [navigate, verifyAdmin]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!loginData.email || !loginData.password) {
            toast.error("All credentials are required");
            return;
        }

        try {
            setLoading(true);

            const { data } = await axios.post(
                `${backendUrl}/api/admin/login`,
                loginData,
                { withCredentials: true }
            );

            toast.success(data.message || "Authentication successful");

            // Refresh context authorization state
            await verifyAdmin();

            navigate("/admin/dashboard");
        } catch (error: any) {
            toast.error(
                error.response?.data?.message || "Internal authentication failed"
            );
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden"
            style={{
                backgroundImage: `url(${loginBack})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <style>{`
                @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
                .font-display { font-family: 'Fraunces', serif; }
                .font-mono-num { font-family: 'JetBrains Mono', monospace; }
            `}</style>

            {/* Premium editorial backdrop blur matrix */}
            <div className="absolute inset-0 bg-[#1E2A23]/40 backdrop-blur-[6px]" />

            {/* Core Card Interface */}
            <div className="relative z-10 w-full max-w-[460px] bg-white rounded-2xl shadow-[0_24px_70px_rgba(0,0,0,0.3)] border border-[#E5DECF] overflow-hidden">
                
                {/* Header Branding Section */}
                <div className="relative flex flex-col items-center justify-center pt-8 pb-5 border-b border-[#EFE9DC] px-8 text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#2F6F62]/10 flex items-center justify-center mb-3 text-[#2F6F62] border border-[#2F6F62]/20">
                        <ShieldCheck size={20} className="stroke-[2]" />
                    </div>
                    <p className="text-[10px] tracking-[0.22em] uppercase text-[#C99A3D] font-bold">
                        Internal Infrastructure
                    </p>
                    <h2 className="font-display text-[22px] text-[#1E2A23] mt-1">
                        Prostayz Administrative Hub
                    </h2>
                </div>

                {/* Form Processing Center */}
                <form onSubmit={handleLogin} className="p-8 space-y-5">
                    <div>
                        <p className="text-[13.5px] text-[#9A917D] text-center mb-2">
                            Authorized personnel entry point.
                        </p>
                    </div>

                    <label className="block">
                        <span className="block text-[11px] font-bold tracking-wide uppercase text-[#6B6354] mb-1.5">
                            Systems Email
                        </span>
                        <input
                            type="email"
                            placeholder="operator@prostayz.com"
                            className={inputCls}
                            value={loginData.email}
                            onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                        />
                    </label>

                    <label className="block">
                        <span className="block text-[11px] font-bold tracking-wide uppercase text-[#6B6354] mb-1.5">
                            Security Key Pass
                        </span>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                className={`${inputCls} pr-11`}
                                value={loginData.password}
                                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A917D] hover:text-[#2F6F62] transition"
                            >
                                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                        </div>
                    </label>

                    <div className="pt-2">
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-[#1E2A23] text-white py-3.5 rounded-lg font-semibold text-[14px] hover:bg-[#2F6F62] transition shadow-md disabled:opacity-50 tracking-wide"
                        >
                            {loading ? "Decrypting Session..." : "Verify Identity"}
                        </button>
                    </div>
                </form>

                {/* Secure System Footer Warning */}
                <div className="bg-[#F5F2EA] px-6 py-4 border-t border-[#E5DECF] text-center">
                    <p className="text-[11px] text-[#9A917D] leading-relaxed">
                        Access is continuously audited. Unauthorized authentication configuration attempt carries immediate termination guidelines.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default AdminLogin;