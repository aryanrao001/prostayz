import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate } from "react-router-dom";

type Step = "LOGIN" | "REGISTER";

interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    first_name: string;
    last_name: string;
    business_name: string;
    email: string;
    phone: string;
    password: string;
    confirm_password: string;
}

const inputCls =
    "w-full bg-white border border-[#DBD3C4] rounded-lg px-3.5 py-3 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition";

const stackedInputCls =
    "w-full bg-white border border-[#DBD3C4] px-3.5 py-3 text-[14px] text-[#1E2A23] placeholder-[#B3AB99] outline-none focus:z-10 relative focus:border-[#2F6F62] focus:ring-2 focus:ring-[#2F6F62]/15 transition";

const Login = () => {
    const [step, setStep] = useState<Step>("LOGIN");
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL as string;
    const navigate = useNavigate();

    const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
    const [registerData, setRegisterData] = useState<RegisterData>({
        first_name: "",
        last_name: "",
        business_name: "",
        email: "",
        phone: "",
        password: "",
        confirm_password: "",
    });

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) {
            toast.error("All fields are required");
            return;
        }
        try {
            setLoading(true);
            const { data } = await axios.post(`${backendUrl}/api/vendor/login`, loginData, {
                withCredentials: true,
            });
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        const { first_name, last_name, email, phone, password, confirm_password } = registerData;
        if (!first_name || !last_name || !email || !phone || !password) {
            toast.error("All fields are required");
            return;
        }
        if (password !== confirm_password) {
            toast.error("Passwords do not match");
            return;
        }

        try {
            setLoading(true);
            const { data } = await axios.post(
                `${backendUrl}/api/vendor/register`,
                { ...registerData, country_code: "+91" },
                { withCredentials: true }
            );
            toast.success(data.message);
            navigate("/vendor/address");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="relative min-h-screen w-full flex items-center justify-center p-4 overflow-hidden"
            style={{
                background: "#F5F2EA",
                fontFamily: "'Inter', ui-sans-serif, system-ui, sans-serif",
            }}
        >
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500&display=swap');
        .font-display { font-family: 'Fraunces', serif; }
        .font-mono-num { font-family: 'JetBrains Mono', monospace; }
      `}</style>

            {/* Background texture */}
            <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 gap-2 opacity-20 blur-[1px] pointer-events-none">
                {[...Array(24)].map((_, i) => (
                    <div key={i} className="bg-[#E5DECF] rounded-xl aspect-[4/3]" />
                ))}
            </div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-[520px] bg-white rounded-2xl shadow-2xl border border-[#E5DECF] overflow-hidden">
                <div className="relative flex items-center justify-center py-5 border-b border-[#EFE9DC]">
                    {step === "REGISTER" && (
                        <button
                            onClick={() => setStep("LOGIN")}
                            className="absolute left-4 p-2 rounded-full hover:bg-[#F5F2EA] text-[#1E2A23] transition"
                        >
                            <ArrowLeft size={18} />
                        </button>
                    )}
                    <p className="text-[11px] tracking-[0.18em] uppercase text-[#9A917D] font-semibold absolute top-2 left-0 right-0 text-center opacity-0">
                        {/* reserved for future breadcrumb */}
                    </p>
                    <h2 className="font-display text-[19px] text-[#1E2A23]">
                        {step === "LOGIN" ? "Log in or sign up" : "Finish signing up"}
                    </h2>
                </div>

                <div className="p-8">
                    {step === "LOGIN" ? (
                        <div className="space-y-4">
                            <div className="mb-6">
                                <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">Vendor Portal</p>
                                <h1 className="font-display text-[26px] text-[#1E2A23] mt-1">Welcome back</h1>
                                <p className="text-[13.5px] text-[#9A917D] mt-1">List and manage your properties.</p>
                            </div>

                            <label className="block">
                                <span className="block text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-1.5">
                                    Email
                                </span>
                                <input
                                    type="email"
                                    placeholder="you@business.com"
                                    className={inputCls}
                                    value={loginData.email}
                                    onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
                                />
                            </label>

                            <label className="block">
                                <span className="block text-[11px] font-semibold tracking-wide uppercase text-[#6B6354] mb-1.5">
                                    Password
                                </span>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="••••••••"
                                        className={inputCls + " pr-11"}
                                        value={loginData.password}
                                        onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A917D] hover:text-[#1E2A23] transition"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </label>

                            <button
                                onClick={handleLogin}
                                disabled={loading}
                                className="w-full bg-[#1E2A23] text-white py-3.5 rounded-lg font-semibold text-[14.5px] hover:bg-[#16201A] transition disabled:opacity-50"
                            >
                                {loading ? "Loading..." : "Continue"}
                            </button>

                            <div className="text-center text-[13px] text-[#6B6354] pt-1">
                                Don't have an account?{" "}
                                <button
                                    onClick={() => setStep("REGISTER")}
                                    className="text-[#2F6F62] font-semibold underline underline-offset-2"
                                >
                                    Register
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div>
                            <div className="mb-6">
                                <p className="text-[11px] tracking-[0.18em] uppercase text-[#C99A3D] font-semibold">Vendor Portal</p>
                                <h1 className="font-display text-[26px] text-[#1E2A23] mt-1">Create your account</h1>
                                <p className="text-[13.5px] text-[#9A917D] mt-1">A few details before you start listing.</p>
                            </div>

                            <div className="rounded-lg overflow-hidden border border-[#DBD3C4]">
                                <input
                                    placeholder="First name"
                                    className={stackedInputCls}
                                    value={registerData.first_name}
                                    onChange={(e) => setRegisterData({ ...registerData, first_name: e.target.value })}
                                />
                                <input
                                    placeholder="Last name"
                                    className={stackedInputCls + " border-t"}
                                    value={registerData.last_name}
                                    onChange={(e) => setRegisterData({ ...registerData, last_name: e.target.value })}
                                />
                                <input
                                    placeholder="Business name"
                                    className={stackedInputCls + " border-t"}
                                    value={registerData.business_name}
                                    onChange={(e) => setRegisterData({ ...registerData, business_name: e.target.value })}
                                />
                                <input
                                    placeholder="Email"
                                    className={stackedInputCls + " border-t"}
                                    value={registerData.email}
                                    onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                                />
                                <input
                                    placeholder="Phone"
                                    className={stackedInputCls + " border-t"}
                                    value={registerData.phone}
                                    onChange={(e) => setRegisterData({ ...registerData, phone: e.target.value })}
                                />
                                <div className="relative border-t border-[#DBD3C4]">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Password"
                                        className={stackedInputCls + " pr-11"}
                                        value={registerData.password}
                                        onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A917D] hover:text-[#1E2A23] transition"
                                    >
                                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                                <div className="relative border-t border-[#DBD3C4]">
                                    <input
                                        type={showConfirmPassword ? "text" : "password"}
                                        placeholder="Confirm Password"
                                        className={stackedInputCls + " pr-11"}
                                        value={registerData.confirm_password}
                                        onChange={(e) => setRegisterData({ ...registerData, confirm_password: e.target.value })}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword((v) => !v)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9A917D] hover:text-[#1E2A23] transition"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={handleRegister}
                                disabled={loading}
                                className="w-full mt-6 bg-[#1E2A23] text-white py-3.5 rounded-lg font-semibold text-[14.5px] hover:bg-[#16201A] transition disabled:opacity-50"
                            >
                                {loading ? "Creating..." : "Agree and continue"}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Login;