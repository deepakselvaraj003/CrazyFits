import { useState, useEffect } from "react";

function OTPModal({
    open,
    mode,
    email,
    onVerify,
    onClose,
    loading,
}) {

    const [otp, setOtp] = useState("");

    useEffect(() => {
        if (open) {
            setOtp("");
        }
    }, [open]);

    if (!open) return null;

    function handleSubmit(e) {
        e.preventDefault();
        onVerify({
            email,
            otp,
        });
    }

    function handleClose() {
        setOtp("");
        onClose();
    }

    // SUCCESS MODE
    if (mode === "success") {
        return (
            <div className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
                <div className="w-full max-w-md rounded-modal border border-border bg-surface p-8 shadow-2xl flex flex-col gap-6 font-body text-center">
                    <h2 className="text-2xl font-extrabold font-heading text-dark">🎉 Quote Submitted</h2>
                    <p className="text-secondary text-sm leading-relaxed">
                        CrazyFits will reach you soon.
                        <br />
                        Your quote has been submitted successfully.
                    </p>
                    <button
                        className="w-full py-3.5 bg-primary hover:bg-primary-hover text-surface font-semibold rounded-button shadow-xs transition-colors duration-150 cursor-pointer"
                        onClick={handleClose}
                    >
                        OK
                    </button>
                </div>
            </div>
        );
    }

    // OTP MODE
    return (
        <div className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="w-full max-w-md rounded-modal border border-border bg-surface p-8 shadow-2xl flex flex-col gap-6 font-body text-center relative">
                <button
                    className="absolute top-4 right-4 text-secondary hover:text-dark text-xl font-bold p-1 cursor-pointer transition-colors"
                    onClick={handleClose}
                    aria-label="Close"
                >
                    ✕
                </button>

                <h2 className="text-2xl font-extrabold font-heading text-dark">Email Verification</h2>

                <p className="text-secondary text-sm leading-relaxed">
                    OTP sent to
                    <br />
                    <strong className="text-dark">{email}</strong>
                </p>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <input
                        type="text"
                        placeholder="Enter OTP"
                        value={otp}
                        onChange={(e) => setOtp(e.target.value)}
                        maxLength={6}
                        autoFocus
                        required
                        className="w-full bg-background text-dark border border-border rounded-input p-4 text-center text-2xl font-mono tracking-[0.5em] focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all placeholder-secondary/50 placeholder:font-body placeholder:text-sm placeholder:tracking-normal"
                    />

                    <button
                        type="submit"
                        className="w-full py-3.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-surface font-semibold rounded-button shadow-xs transition-colors duration-150 cursor-pointer"
                        disabled={loading}
                    >
                        {loading ? "Verifying..." : "Verify OTP"}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default OTPModal;