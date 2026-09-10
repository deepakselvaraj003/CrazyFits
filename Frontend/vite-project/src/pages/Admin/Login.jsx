import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-hot-toast";
import Button from "../../components/Button/Button";
import { adminLogin } from "../../services/authService";

function Login() {
    const navigate = useNavigate();
    const location = useLocation();

    const [form, setForm] = useState({
        email: "",
        password: "",
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (location.state?.successMessage) {
            toast.success(location.state.successMessage);

            const timer = setTimeout(() => {
                navigate(location.pathname, {
                    replace: true,
                    state: {},
                });
            }, 5000);

            return () => clearTimeout(timer);
        }
    }, [location, navigate]);

    function handleChange(e) {
        setForm((prev) => ({
            ...prev,
            [e.target.name]: e.target.value,
        }));
    }

    async function handleSubmit(e) {
        e.preventDefault();
        setLoading(true);

        const toastId = toast.loading("Authenticating...");

        try {
            const res = await adminLogin(form);

            localStorage.removeItem("customer");
            localStorage.removeItem("access_token");
            localStorage.removeItem("refresh_token");

            localStorage.setItem("admin_access_token", res.data.access_token);
            localStorage.setItem("admin_refresh_token", res.data.refresh_token);
            localStorage.setItem("admin", JSON.stringify(res.data.user));

            toast.success("Login successful.", { id: toastId });
            navigate("/admin/dashboard");
        } catch (err) {
            const errors = err.response?.data?.errors;
            const message = errors
                ? Array.isArray(Object.values(errors)[0])
                    ? Object.values(errors)[0][0]
                    : Object.values(errors)[0]
                : err.response?.data?.message || "Something went wrong.";

            toast.error(String(message), { id: toastId });
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-background px-4 py-10 sm:px-6 lg:px-8 flex items-center justify-center">
            <div className="w-full max-w-md rounded-[28px] border border-border bg-surface p-8 shadow-xl shadow-black/20 transition-all duration-300 sm:p-10">
                <div className="space-y-6">
                    <div className="space-y-2 text-center">
                        <h1 className="text-2xl font-semibold text-primary sm:text-3xl">Admin Login</h1>
                        <p className="mx-auto max-w-[28rem] text-sm leading-6 text-secondary">
                            Log in to access the CrazyFits admin dashboard                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div className="space-y-3">
                            <label htmlFor="email" className="block text-sm font-semibold text-secondary">
                                Email
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                value={form.email}
                                onChange={handleChange}
                                placeholder="admin@example.com"
                                required
                                className="w-full rounded-[18px] border border-border bg-background px-4 py-3 text-m text-black placeholder:text-secondary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <div className="space-y-3">
                            <label htmlFor="password" className="block text-sm font-semibold text-secondary">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                value={form.password}
                                onChange={handleChange}
                                placeholder="••••••••"
                                required
                                className="w-full rounded-[18px] border border-border bg-background px-4 py-3 text-m text-black placeholder:text-secondary outline-none transition-all duration-200 focus:border-primary focus:ring-2 focus:ring-primary/20"
                            />
                        </div>

                        <Button type="submit" variant="primary" isLoading={loading} className="w-full py-3.5 text-sm">
                            Login to Dashboard
                        </Button>
                    </form>
                </div>
            </div>
        </div>
    );
}

export default Login;
