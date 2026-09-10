import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import {FaCloud,FaEnvelope,FaEye,FaEyeSlash,
  FaGoogleDrive,FaKey,FaLock,FaShieldAlt,FaUser,} 
from "react-icons/fa";
import {
  changeAdminSecurity,
  getGoogleDriveAuthUrl,
  getGoogleDriveStatus,
  updateAdminProfile,
  verifyAdminEmail,
} from "../../services/authService";
import Button from "../../components/Button/Button";
import Modal from "../../components/Modal/Modal";

const inputClass =
  "h-11 w-full rounded-xl border border-border bg-surface px-4 font-body text-sm text-dark shadow-sm outline-none transition-colors placeholder:text-secondary focus:border-primary focus:ring-2 focus:ring-primary/20";
const passwordInputClass = `${inputClass} pr-11`;
const scrollbarClass =
  "[&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50";
const PasswordField = ({
  label,
  value,
  visible,
  onToggle,
  onChange,
  placeholder,
  error,
}) => (
  <div className="space-y-2">
    <label className="block font-heading text-sm font-semibold text-dark">
      {label}
    </label>
    <div className="relative">
      <input
        className={`${passwordInputClass} ${error ? "border-danger focus:border-danger focus:ring-danger/20" : ""}`}
        type={visible ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
      {value && (
        <button
          type="button"
          onClick={onToggle}
          className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-xl text-secondary transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
          aria-label={
            visible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`
          }
        >
          {visible ? <FaEyeSlash /> : <FaEye />}
        </button>
      )}
    </div>
    {error && <p className="font-body text-sm text-danger">{error}</p>}
  </div>
);
const CardHeading = ({ icon: Icon, title, description, tone = "primary" }) => (
  <div className="mb-5 flex items-center gap-4 border-b border-border pb-5">
    <div
      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border ${tone === "warning" ? "border-warning/30 bg-warning/10 text-warning" : "border-primary/20 bg-primary/10 text-primary"}`}
    >
      <Icon aria-hidden="true" />
    </div>
    <div>
      <h2 className="font-heading text-lg font-bold text-dark">{title}</h2>
      <p className="mt-1 font-body text-sm text-secondary">{description}</p>
    </div>
  </div>
);

function AccountSettings() {
  const navigate = useNavigate();
  const admin = JSON.parse(localStorage.getItem("admin"));
  const [profileForm, setProfileForm] = useState({
    full_name: admin?.full_name || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [emailForm, setEmailForm] = useState({
    current_password: "",
    new_email: "",
  });
  const [otp, setOtp] = useState("");
  const [showOTPBox, setShowOTPBox] = useState(false);
  const [loading, setLoading] = useState(false);
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [errorPopup, setErrorPopup] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showEmailPassword, setShowEmailPassword] = useState(false);
  const [driveStatus, setDriveStatus] = useState({
    connected: false,
    last_connected: null,
  });
  const [driveLoading, setDriveLoading] = useState(false);
  const showSuccessToast = (message) =>
    toast.success(message, { duration: 5000 });
  const showError = (message) => {
    setErrorMessage(message);
    setErrorPopup(true);
  };
  const getErrorMessage = (err, fallback) => {
    const errorData = err.response?.data;
    if (errorData?.message) return errorData.message;
    if (errorData?.errors?.non_field_errors?.length)
      return errorData.errors.non_field_errors[0];
    if (errorData?.errors) {
      const firstKey = Object.keys(errorData.errors)[0];
      return errorData.errors[firstKey][0];
    }
    return fallback;
  };
  const loadDriveStatus = async () => {
    try {
      const { data } = await getGoogleDriveStatus();
      setDriveStatus({
        connected: data.connected,
        last_connected: data.last_connected,
      });
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadDriveStatus();
  }, []);


  useEffect(() => {
    const params = new URLSearchParams(window.location.search);

    const googleDriveStatus = params.get("google_drive");

    if (googleDriveStatus === "connected") {
      loadDriveStatus();

      showSuccessToast(
        "Google Drive connected successfully."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }

    if (googleDriveStatus === "error") {
      showError(
        "Unable to connect Google Drive."
      );

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname
      );
    }
  }, []);


  const handleUpdateName = async () => {
    try {
      setErrorMessage("");
      setErrorPopup(false);
      setLoading(true);
      const response = await updateAdminProfile({
        full_name: profileForm.full_name,
      });
      const data = response?.data;

      if (data?.user) {
        localStorage.setItem("admin", JSON.stringify(data.user));
      }

      showSuccessToast(data?.message || "Name updated successfully.");
      window.dispatchEvent(new Event("adminUpdated"));
    } catch (err) {
      showError(err.response?.data?.message || "Unable to update profile.");
    } finally {
      setLoading(false);
    }
  };
  const handlePassword = async () => {
    if (passwordForm.new_password !== passwordForm.confirm_password) {
      setConfirmPasswordError("Passwords do not match.");
      return;
    }
    try {
      setConfirmPasswordError("");
      setErrorPopup(false);
      setErrorMessage("");
      setLoading(true);
      await changeAdminSecurity({
        action: "change_password",
        current_password: passwordForm.current_password,
        new_password: passwordForm.new_password,
        confirm_password: passwordForm.confirm_password,
        refresh: localStorage.getItem("admin_refresh_token"),
      });
      showSuccessToast("Password updated successfully.");
      setTimeout(() => {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin");
        navigate("/admin/login", {
          state: {
            successMessage:
              "Password changed successfully. Please login again.",
          },
        });
      }, 1500);
    } catch (err) {
      showError(getErrorMessage(err, "Failed to change password."));
    } finally {
      setLoading(false);
    }
  };
  const handleSendOTP = async () => {
    try {
      setErrorPopup(false);
      setErrorMessage("");
      setLoading(true);
      await changeAdminSecurity({
        action: "change_email",
        current_password: emailForm.current_password,
        new_email: emailForm.new_email,
        refresh: localStorage.getItem("admin_refresh_token"),
      });
      showSuccessToast("OTP sent successfully.");
      setShowOTPBox(true);
    } catch (err) {
      showError(getErrorMessage(err, "Unable to send OTP."));
    } finally {
      setLoading(false);
    }
  };
  const handleVerifyOTP = async () => {
    try {
      setErrorPopup(false);
      setErrorMessage("");
      setLoading(true);
      await verifyAdminEmail({
        action: "change_email",
        current_password: emailForm.current_password,
        new_email: emailForm.new_email,
        otp,
        refresh: localStorage.getItem("admin_refresh_token"),
      });
      showSuccessToast("Email updated successfully.");
      setTimeout(() => {
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin");
        navigate("/admin/login", {
          state: {
            successMessage: "Email changed successfully. Please login again.",
          },
        });
      }, 1500);
    } catch (err) {
      showError(getErrorMessage(err, "OTP verification failed."));
    } finally {
      setLoading(false);
    }
  };
  const handleDriveConnect = async () => {
    try {
      setDriveLoading(true);
      const { data } = await getGoogleDriveAuthUrl();
      window.location.href = data.url;
    } catch {
      showError("Unable to connect Google Drive.");
    } finally {
      setDriveLoading(false);
    }
  };
  return (
    <div
      className={`flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark ${scrollbarClass}`}
    >
      <header className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 text-primary shadow-sm">
            <FaShieldAlt className="text-xl" />
          </div>
          <div>
            <h1 className="font-heading text-2xl font-bold tracking-tight text-dark">
              Account Settings
            </h1>
            <p className="mt-1 font-body text-sm text-secondary">
              Manage your profile, password and email securely.
            </p>
          </div>
        </div>
      </header>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <CardHeading
            icon={FaUser}
            title="Profile Information"
            description="Update your display name."
          />
          <div className="mb-5 space-y-2">
            <label className="block font-heading text-sm font-semibold text-dark">
              Full Name
            </label>
            <input
              className={inputClass}
              type="text"
              placeholder="Enter your full name"
              value={profileForm.full_name}
              onChange={(e) => setProfileForm({ full_name: e.target.value })}
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleUpdateName}
            disabled={loading}
            className="h-10 rounded-xl px-4 font-heading shadow-sm hover:shadow-md"
          >
            <FaUser className="shrink-0" size={13} />
            Update Name
          </Button>
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <CardHeading
            icon={FaGoogleDrive}
            title="Google Drive Connection"
            description="Manage your Google Drive connection."
          />
          <div
            className={`mb-5 max-h-40 overflow-y-auto divide-y divide-border rounded-xl border border-border bg-background px-4 ${scrollbarClass}`}
          >
            <div className="flex flex-col gap-2 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="font-body text-sm text-secondary">Status</span>
              <span
                className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 font-heading text-xs font-semibold ${driveStatus.connected ? "border-success/30 bg-success/10 text-success" : "border-danger/30 bg-danger/10 text-danger"}`}
              >
                <span
                  className={`h-2 w-2 rounded-full ${driveStatus.connected ? "bg-success" : "bg-danger"}`}
                />
                {driveStatus.connected ? "Connected" : "Not Connected"}
              </span>
            </div>
            <div className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
              <span className="font-body text-sm text-secondary">
                Last Connected
              </span>
              <span className="font-body text-sm font-medium text-dark">
                {driveStatus.last_connected
                  ? new Date(driveStatus.last_connected).toLocaleString()
                  : "-"}
              </span>
            </div>
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleDriveConnect}
            disabled={driveLoading}
            className="h-10 rounded-xl px-4 font-heading shadow-sm hover:shadow-md"
          >
            <FaCloud className="shrink-0" size={13} />
            {driveLoading
              ? "Redirecting..."
              : driveStatus.connected
                ? "Reconnect"
                : "Connect"}
          </Button>
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <CardHeading
            icon={FaLock}
            title="Change Password"
            description="Keep your account safe with a strong password."
          />
          <div className="space-y-5">
            <PasswordField
              label="Current Password"
              value={passwordForm.current_password}
              visible={showCurrentPassword}
              onToggle={() => setShowCurrentPassword(!showCurrentPassword)}
              placeholder="Enter current password"
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  current_password: e.target.value,
                })
              }
            />
            <PasswordField
              label="New Password"
              value={passwordForm.new_password}
              visible={showNewPassword}
              onToggle={() => setShowNewPassword(!showNewPassword)}
              placeholder="Enter new password"
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  new_password: e.target.value,
                })
              }
            />
            <PasswordField
              label="Confirm Password"
              value={passwordForm.confirm_password}
              visible={showConfirmPassword}
              onToggle={() => setShowConfirmPassword(!showConfirmPassword)}
              placeholder="Confirm new password"
              error={confirmPasswordError}
              onChange={(e) => {
                const value = e.target.value;
                setPasswordForm({ ...passwordForm, confirm_password: value });
                setConfirmPasswordError(
                  passwordForm.new_password &&
                    value !== passwordForm.new_password
                    ? "Passwords do not match."
                    : "",
                );
              }}
            />
            <Button
              type="button"
              variant="primary"
              size="sm"
              onClick={handlePassword}
              disabled={loading}
              className="h-10 rounded-xl px-4 font-heading shadow-sm hover:shadow-md"
            >
              <FaLock className="shrink-0" size={13} />
              Update Password
            </Button>
          </div>
        </section>
        <section className="rounded-[18px] border border-border bg-surface p-5 shadow-sm sm:p-6">
          <CardHeading
            icon={FaEnvelope}
            title="Change Email"
            description="Update your admin email address."
          />
          <div className="grid transition-[grid-template-rows] duration-300 ease-out">
            <div className="overflow-hidden">
              {!showOTPBox ? (
                <div className="space-y-5 animate-fade-in">
                  <PasswordField label="Current Password" value={emailForm.current_password} visible={showEmailPassword} onToggle={() => setShowEmailPassword(!showEmailPassword)} placeholder="Confirm with your password" onChange={(e) => setEmailForm({ ...emailForm, current_password: e.target.value })} />
                  <div className="space-y-2">
                    <label className="block font-heading text-sm font-semibold text-dark">New Email</label>
                    <input className={inputClass} type="email" placeholder="Enter new email address" value={emailForm.new_email} onChange={(e) => setEmailForm({ ...emailForm, new_email: e.target.value })} />
                  </div>
                  <Button type="button" variant="primary" size="sm" onClick={handleSendOTP} disabled={loading} className="h-10 rounded-xl px-4 font-heading shadow-sm hover:shadow-md"><FaEnvelope className="shrink-0" size={13} />Send OTP</Button>
                </div>
              ) : (
                <div className="space-y-5 animate-slide-up">
                  <div className="flex items-start gap-3 rounded-xl border border-success/30 bg-success/10 px-4 py-3 font-body text-sm text-secondary">
                    <FaEnvelope className="mt-0.5 shrink-0 text-success" />
                    <span>OTP sent successfully to <strong className="font-semibold text-dark">{emailForm.new_email}</strong>.</span>
                  </div>
                  <div className="space-y-2">
                    <label className="block font-heading text-sm font-semibold text-dark">One-Time Password</label>
                    <input className={`${inputClass} px-5 text-center text-xl font-bold tracking-[0.5em]`} type="text" placeholder="000000" maxLength={6} value={otp} onChange={(e) => setOtp(e.target.value)} />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button type="button" variant="primary" size="sm" onClick={handleVerifyOTP} disabled={loading} className="h-10 rounded-xl px-4 font-heading shadow-sm hover:shadow-md"><FaKey className="shrink-0" size={13} />Verify Email</Button>
                    <Button type="button" variant="secondary" size="sm" onClick={() => setShowOTPBox(false)} disabled={loading} className="h-10 rounded-xl px-4 font-heading">Change Email</Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
      <Modal
        isOpen={errorPopup}
        onClose={() => setErrorPopup(false)}
        title="Something went wrong"
        width="400px"
      >
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border-2 border-danger/30 bg-danger/10 font-heading text-xl font-bold text-danger">
            !
          </div>
          <p className="mb-6 font-body text-sm leading-6 text-secondary">
            {errorMessage}
          </p>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={() => setErrorPopup(false)}
            className="h-10 rounded-xl px-5 font-heading"
          >
            Close
          </Button>
        </div>
      </Modal>
      {loading && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-dark/30 px-4 backdrop-blur-sm"
          role="status"
          aria-live="polite"
        >
          <div className="flex flex-col items-center gap-4 rounded-[24px] border border-border bg-background px-10 py-8 shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary/20 border-t-primary" />
            <p className="font-body text-sm font-medium text-secondary">
              Applying changes...
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountSettings;
