import React, { useState } from "react";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import axios from "axios";

type Step = "LOGIN" | "REGISTER";

const Login = () => {
    const [step, setStep] = useState<Step>("LOGIN");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const backendUrl = import.meta.env.VITE_BACKEND_URL;

    const [loginData, setLoginData] = useState({ email: "", password: "" });
    const [registerData, setRegisterData] = useState({
        first_name: "", last_name: "", business_name: "", email: "", phone: "", password: "", confirm_password: "",
    });

    const handleLogin = async () => {
        if (!loginData.email || !loginData.password) return toast.error("All fields are required");
        try {
            setLoading(true);
            const { data } = await axios.post(`${backendUrl}/api/vendor/login`, loginData, { withCredentials: true });
            console.log(data);
            toast.success(data.message);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Login failed");
        } finally {
            setLoading(false);
        }
    };

    const handleRegister = async () => {
        const { first_name, last_name, email, phone, password, confirm_password } = registerData;
        if (!first_name || !last_name || !email || !phone || !password) return toast.error("All fields are required");
        if (password !== confirm_password) return toast.error("Passwords do not match");

        try {
            setLoading(true);
            const { data } = await axios.post(`${backendUrl}/api/vendor/register`, { ...registerData, country_code: "+91" }, { withCredentials: true });
            toast.success(data.message);
            setStep("LOGIN");
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Registration failed");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-gray-50 overflow-hidden">
            {/* Background Grid Pattern */}
            <div className="absolute inset-0 grid grid-cols-4 md:grid-cols-6 gap-2 opacity-30 blur-[1px] pointer-events-none">
                {[...Array(24)].map((_, i) => <div key={i} className="bg-gray-200 rounded-lg aspect-[4/3]" />)}
            </div>

            {/* Modal */}
            <div className="relative z-10 w-full max-w-[570px] bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
                <div className="relative flex items-center justify-center py-4 border-b border-gray-200">
                    {step === "REGISTER" && (
                        <button onClick={() => setStep("LOGIN")} className="absolute left-4 p-2 rounded-full hover:bg-gray-100"><ArrowLeft size={20} /></button>
                    )}
                    <h2 className="font-semibold text-gray-900">{step === "LOGIN" ? "Log in or sign up" : "Finish signing up"}</h2>
                </div>

                <div className="p-8">
                    {step === "LOGIN" ? (
                        <div className="space-y-4">
                            <h1 className="text-2xl font-semibold mb-6">Welcome to Vendor Portal</h1>
                            <input type="email" placeholder="Email" className="w-full border border-gray-400 rounded-lg p-4 outline-none focus:border-black" value={loginData.email} onChange={(e) => setLoginData({...loginData, email: e.target.value})} />
                            <input type="password" placeholder="Password" className="w-full border border-gray-400 rounded-lg p-4 outline-none focus:border-black" value={loginData.password} onChange={(e) => setLoginData({...loginData, password: e.target.value})} />
                            <button onClick={handleLogin} disabled={loading} className="w-full bg-[#FF385C] text-white py-3.5 rounded-lg font-semibold hover:bg-[#D90B41]">{loading ? "Loading..." : "Continue"}</button>
                            <div className="text-center text-sm">Don't have an account? <button onClick={() => setStep("REGISTER")} className="text-blue-600 font-semibold underline">Register</button></div>
                        </div>
                    ) : (
                        <div className="space-y-0">
                            <input placeholder="First name" className="w-full border border-gray-400 p-4 rounded-t-lg outline-none focus:z-10 relative focus:border-black" value={registerData.first_name} onChange={(e) => setRegisterData({...registerData, first_name: e.target.value})} />
                            <input placeholder="Last name" className="w-full border-x border-b border-gray-400 p-4 outline-none focus:z-10 relative focus:border-black" value={registerData.last_name} onChange={(e) => setRegisterData({...registerData, last_name: e.target.value})} />
                            <input placeholder="Business name" className="w-full border-x border-b border-gray-400 p-4 outline-none focus:z-10 relative focus:border-black" value={registerData.business_name} onChange={(e) => setRegisterData({...registerData, business_name: e.target.value})} />
                            <input placeholder="Email" className="w-full border-x border-b border-gray-400 p-4 outline-none focus:z-10 relative focus:border-black" value={registerData.email} onChange={(e) => setRegisterData({...registerData, email: e.target.value})} />
                            <input placeholder="Phone" className="w-full border-x border-b border-gray-400 p-4 outline-none focus:z-10 relative focus:border-black" value={registerData.phone} onChange={(e) => setRegisterData({...registerData, phone: e.target.value})} />
                            <input type="password" placeholder="Password" className="w-full border-x border-b border-gray-400 p-4 outline-none focus:z-10 relative focus:border-black" value={registerData.password} onChange={(e) => setRegisterData({...registerData, password: e.target.value})} />
                            <input type="password" placeholder="Confirm Password" className="w-full border-x border-b border-gray-400 p-4 rounded-b-lg outline-none focus:z-10 relative focus:border-black" value={registerData.confirm_password} onChange={(e) => setRegisterData({...registerData, confirm_password: e.target.value})} />
                            
                            <button onClick={handleRegister} disabled={loading} className="w-full mt-6 bg-black text-white py-4 rounded-lg font-semibold hover:bg-gray-800 transition">
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