import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { sendOTP, verifyOTP } from "../../services/authService";
import { useAuth } from "../../context/AuthContext";
import Button from "../Button/Button";

function LoginModal({ open, onClose }) {
    const navigate = useNavigate();
    const [step, setStep] = useState("choose");
    const [email, setEmail] = useState("");
    const [otp, setOtp] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const { login } = useAuth();

    useEffect(() => {
        if (open) {
            setStep("choose");
            setEmail("");
            setOtp("");
            setError("");
        }
    }, [open]);

    async function handleSendOTP() {
        if (!email) {
            setError("Enter email");
            return;
        }
        try {
            setLoading(true);
            setError("");
            await sendOTP({ email });
            setStep("otp");
        } catch (err) {
            setError(err.response?.data?.message || "Failed to send OTP.");
        } finally {
            setLoading(false);
        }
    }

    async function handleVerify() {
        if (!otp) {
            setError("Enter OTP");
            return;
        }
        try {
            setLoading(true);
            setError("");
            const res = await verifyOTP({ email, otp });
            login(res.data);
            onClose();
        } catch (err) {
            setError(err.response?.data?.message || "Invalid OTP");
        } finally {
            setLoading(false);
        }
    }

    if (!open) return null;

    return (
        <div className="w-full max-w-sm rounded-[10px] border border-border bg-surface p-6 shadow-2xl shadow-black/10 transition-all duration-300 sm:p-8">
            {step === "choose" && (
                <div className="space-y-6">
                    <div className="space-y-3">
                        <Button
                            variant="primary"
                            onClick={() => setStep("customer")}
                            className="w-full"
                        >
                            👤 Customer Login
                        </Button>
                        <Button
                            variant="secondary"
                            onClick={() => {
                                onClose();
                                navigate("/admin/login");
                            }}
                            className="w-full"
                        >
                            🛠 Admin Login
                        </Button>
                    </div>
                </div>
            )}

            {step === "customer" && (
                <div className="space-y-5">
                    <div className="border-b border-border pb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-secondary">
                            Customer Login
                        </p>
                    </div>

                    {error && (
                        <p className="rounded-[18px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                            {error}
                        </p>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-secondary">
                            Email Address
                        </label>
                        <input
                            type="email"
                            className="w-full rounded-[18px] border border-border bg-background px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter your email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleSendOTP()}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                            variant="secondary"
                            onClick={() => setStep("choose")}
                            className="h-10 w-full px-4 text-sm"
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSendOTP}
                            isLoading={loading}
                            className="h-10 w-full px-4 text-sm"
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            )}

            {step === "otp" && (
                <div className="space-y-5">
                    <div className="border-b border-border pb-4">
                        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-secondary">
                            Verify OTP
                        </p>
                    </div>

                    <p className="text-sm text-secondary">
                        Sent to <span className="font-semibold text-dark">{email}</span>
                    </p>

                    {error && (
                        <p className="rounded-[18px] border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                            {error}
                        </p>
                    )}

                    <div className="space-y-3">
                        <label className="block text-sm font-semibold text-secondary">OTP</label>
                        <input
                            type="text"
                            className="w-full rounded-[18px] border border-border bg-background px-4 py-3 text-sm text-dark outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20"
                            placeholder="Enter OTP"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && handleVerify()}
                            autoFocus
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <Button
                            variant="secondary"
                            onClick={() => setStep("customer")}
                            className="w-full"
                        >
                            Back
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleVerify}
                            isLoading={loading}
                            className="w-full"
                        >
                            Verify
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default LoginModal;
