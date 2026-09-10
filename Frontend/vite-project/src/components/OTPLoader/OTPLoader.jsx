import { useEffect, useRef, useState } from "react";
import { Smartphone, ShieldCheck, Fingerprint, Check } from "lucide-react";

const DEFAULT_MESSAGES = {
  sending: "Sending secure verification code...",
  waiting: "Waiting for verification...",
  verifying: "Verifying your OTP...",
  success: "Authentication successful...",
  redirecting: "Redirecting to your dashboard...",
};

export default function OtpAuthLoader({
  isLoading = false,
  phase = "sending",
  theme = "light",
  messages = {},
  onComplete,
}) {
  const mergedMessages = { ...DEFAULT_MESSAGES, ...messages };
  const [internalPhase, setInternalPhase] = useState(phase);
  const completeFired = useRef(false);

  // sync external phase changes in
  useEffect(() => {
    setInternalPhase(phase);
    if (phase !== "success" && phase !== "redirecting") {
      completeFired.current = false;
    }
  }, [phase]);

  // auto-advance success -> redirecting -> onComplete
  useEffect(() => {
    if (internalPhase === "success") {
      const t = setTimeout(() => setInternalPhase("redirecting"), 1450);
      return () => clearTimeout(t);
    }
    if (internalPhase === "redirecting" && !completeFired.current) {
      completeFired.current = true;
      const t = setTimeout(() => {
        onComplete && onComplete();
      }, 1400);
      return () => clearTimeout(t);
    }
  }, [internalPhase, onComplete]);

  if (!isLoading) return null;

  const isSending = internalPhase === "sending";
  const isWaiting = internalPhase === "waiting";
  const isVerifying = internalPhase === "verifying";
  const isSuccess = internalPhase === "success" || internalPhase === "redirecting";
  const isRedirecting = internalPhase === "redirecting";

  return (
    <div className="fixed inset-0 bg-dark/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in" role="dialog" aria-modal="true">
      <div className="w-full max-w-md rounded-modal border border-border bg-surface p-8 shadow-2xl flex flex-col items-center justify-center gap-6 font-body text-center relative overflow-hidden animate-slide-up">
        {/* Glow accent */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        {/* Stage icons */}
        {!isSuccess ? (
          <div className="flex items-center justify-center gap-6 my-4">
            <div className={`w-14 h-14 rounded-full border border-primary/20 bg-background flex items-center justify-center text-primary relative ${isWaiting ? "animate-bounce" : ""}`}>
              <Smartphone size={26} />
              {(isWaiting || isSending) && (
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-ping" />
              )}
            </div>

            <div className="flex items-center gap-1 text-primary">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-150" />
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse delay-300" />
            </div>

            <div className={`w-14 h-14 rounded-full border border-primary/20 bg-background flex items-center justify-center text-primary relative ${isVerifying ? "animate-pulse" : ""}`}>
              <ShieldCheck size={26} />
              {isVerifying && <Fingerprint size={16} className="absolute text-primary" />}
            </div>
          </div>
        ) : (
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary my-2 animate-in zoom-in-95 duration-300">
            <Check size={36} strokeWidth={3} />
          </div>
        )}

        {/* Status Message */}
        <div className="space-y-2">
          <p className="text-base font-semibold text-dark font-heading">
            {mergedMessages[internalPhase] || mergedMessages.sending}
          </p>
          {isRedirecting && (
            <div className="w-32 h-1.5 bg-background rounded-full overflow-hidden mx-auto mt-3 border border-border">
              <div className="h-full bg-primary rounded-full animate-pulse w-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

