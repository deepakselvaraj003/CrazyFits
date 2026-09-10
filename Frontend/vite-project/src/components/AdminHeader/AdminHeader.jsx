import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdMenu, MdLogout, MdPerson, MdNotifications } from "react-icons/md";
import api from "../../api/axios";
import { getNotifications, markNotificationAsRead } from "../../services/notificationService";

function formatNotificationTime(dateStr) {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        const now = new Date();
        const diffMs = now - date;
        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHours = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHours / 24);

        if (diffMins < 1) return "Just now";
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays < 7) return `${diffDays}d ago`;
        return date.toLocaleDateString();
    } catch {
        return "";
    }
}

function AdminHeader({ onMenuClick }) {
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const [showMenu, setShowMenu] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const menuRef = useRef();
    const notifRef = useRef();

    const loadNotifications = async () => {
        try {
            const res = await getNotifications();
            if (res.data?.success) {
                setNotifications(res.data.data || []);
                setUnreadCount(res.data.unread_count || 0);
            }
        } catch (err) {
            // Keep header intact if notification loading fails
        }
    };

    useEffect(() => {
        const loadAdmin = () => {
            const admin = JSON.parse(localStorage.getItem("admin"));
            setProfile(admin);
        };
        loadAdmin();
        loadNotifications();

        window.addEventListener("adminUpdated", loadAdmin);
        window.addEventListener("notificationsUpdated", loadNotifications);
        return () => {
            window.removeEventListener("adminUpdated", loadAdmin);
            window.removeEventListener("notificationsUpdated", loadNotifications);
        };
    }, []);

    useEffect(() => {
        function handleClick(e) {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setShowMenu(false);
            }
            if (notifRef.current && !notifRef.current.contains(e.target)) {
                setShowNotifications(false);
            }
        }
        document.addEventListener("click", handleClick);
        return () => document.removeEventListener("click", handleClick);
    }, []);

    const handleMarkAsRead = async (e, id) => {
        e.stopPropagation();
        try {
            await markNotificationAsRead(id);
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
            window.dispatchEvent(new Event("notificationsUpdated"));
        } catch {
            // Do not alter UI if mark as read fails on backend
        }
    };

    const handleNotificationClick = (notification) => {
        setShowNotifications(false);
        navigate("/admin/requests");
    };

    async function logout() {
        try {
            await api.post("account/logout/");
        } catch {
            // Ignore errors — clear local state regardless
        }
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");
        localStorage.removeItem("admin");
        navigate("/admin/login", {
            replace: true,
        });
    }

    return (
        <div className="flex justify-between items-center py-3.5 px-6 md:px-8 bg-surface border-b border-border sticky top-0 z-30 gap-4 shrink-0">
            <div className="flex items-center">
                <button
                    className="lg:hidden text-dark p-2 -ml-2 rounded-lg hover:bg-background transition-colors cursor-pointer border-none"
                    onClick={onMenuClick}
                    aria-label="Open Menu"
                >
                    <MdMenu size={24} />
                </button>
            </div>

            <div className="flex items-center gap-3 shrink-0">
                {/* Notification Bell */}
                <div className="relative" ref={notifRef}>
                    <button
                        className="relative p-2 rounded-xl text-secondary hover:text-dark hover:bg-background transition-all duration-200 cursor-pointer border-none flex items-center justify-center"
                        onClick={() => {
                            setShowNotifications(!showNotifications);
                            setShowMenu(false);
                        }}
                        aria-label="Notifications"
                    >
                        <MdNotifications size={22} />
                        {/* Brown Notification Dot */}
                        {unreadCount > 0 && (
                            <span
                                className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-[#8C5A3C] border-2 border-surface"
                                title={`${unreadCount} unread notification(s)`}
                            />
                        )}
                    </button>

                    {/* Notification Dropdown */}
                    {showNotifications && (
                        <div className="absolute right-0 top-full mt-2 w-80 md:w-96 bg-surface border border-border rounded-2xl shadow-xl overflow-hidden z-50 animate-slide-up flex flex-col max-h-[420px]">
                            <div className="p-3.5 px-4 border-b border-border bg-background flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <h3 className="font-heading font-bold text-sm text-dark m-0">Notifications</h3>
                                    {unreadCount > 0 && (
                                        <span className="text-[11px] font-semibold bg-[#8C5A3C]/15 text-[#8C5A3C] px-2 py-0.5 rounded-full">
                                            {unreadCount} new
                                        </span>
                                    )}
                                </div>
                            </div>

                            <div className="overflow-y-auto flex-1 divide-y divide-border/60">
                                {notifications.length === 0 ? (
                                    <div className="p-6 text-center text-xs text-secondary">
                                        No notifications yet.
                                    </div>
                                ) : (
                                    notifications.slice(0, 5).map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => handleNotificationClick(item)}
                                            className={`p-3.5 px-4 hover:bg-background/80 transition-colors cursor-pointer flex items-start justify-between gap-3 text-left ${!item.is_read ? "bg-[#8C5A3C]/5 font-medium" : ""
                                                }`}
                                        >
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    {!item.is_read && (
                                                        <span className="w-1.5 h-1.5 rounded-full bg-[#8C5A3C] shrink-0" />
                                                    )}
                                                    <p className="text-xs font-semibold text-dark truncate m-0">
                                                        {item.customer_name ? `${item.customer_name}` : "New Quote Request"}
                                                    </p>
                                                    {item.request_number && (
                                                        <span className="text-[10px] text-secondary font-mono">
                                                            #{item.request_number}
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-[11px] text-secondary mt-1 line-clamp-2 m-0 leading-tight">
                                                    {item.message}
                                                </p>
                                                <span className="text-[10px] text-secondary/80 mt-1 block">
                                                    {formatNotificationTime(item.created_at)}
                                                </span>
                                            </div>

                                            {!item.is_read && (
                                                <button
                                                    onClick={(e) => handleMarkAsRead(e, item.id)}
                                                    className="px-2 py-1 text-[11px] font-semibold rounded-lg bg-surface border border-border hover:bg-primary/10 hover:text-primary hover:border-primary/30 text-secondary transition-all shrink-0 cursor-pointer"
                                                    title="Mark as read"
                                                >
                                                    Read
                                                </button>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>

                            {/* Dropdown Footer: All Notifications Button */}
                            <div className="p-2.5 border-t border-border bg-background/50 text-center">
                                <button
                                    onClick={() => {
                                        setShowNotifications(false);
                                        navigate("/admin/notifications");
                                    }}
                                    className="w-full py-1.5 text-xs font-bold text-primary hover:text-primary-hover transition-colors border-none cursor-pointer"
                                >
                                    All Notifications
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Profile Menu */}
                <div className="relative flex items-center shrink-0" ref={menuRef}>
                    <div
                        className="flex items-center gap-2.5 cursor-pointer p-1.5 pr-2.5 rounded-xl border border-transparent hover:bg-background hover:border-border transition-all duration-200 select-none"
                        onClick={() => {
                            setShowMenu(!showMenu);
                            setShowNotifications(false);
                        }}
                    >
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/35 to-primary/10 border-2 border-primary/40 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                            {profile?.full_name?.charAt(0).toUpperCase() || <MdPerson size={20} />}
                        </div>
                        <div className="flex flex-col gap-0.5 text-left">
                            <strong className="text-xs md:text-sm font-semibold text-dark leading-tight whitespace-nowrap">
                                {profile?.full_name || "Admin"}
                            </strong>
                            <p className="text-[0.7rem] md:text-xs text-secondary m-0 whitespace-nowrap">Admin</p>
                        </div>
                    </div>

                    {showMenu && (
                        <div className="absolute right-0 top-full mt-2 w-56 bg-surface border border-border rounded-xl shadow-xl overflow-hidden z-50 animate-slide-up">
                            <div className="p-3 px-4 border-b border-border bg-background text-left">
                                <p className="font-bold text-sm text-dark m-0">{profile?.full_name || "Admin"}</p>
                                <small className="text-xs text-secondary block truncate">
                                    {profile?.email || "admin@crazyfits.com"}
                                </small>
                            </div>
                            <button
                                className="w-full flex items-center gap-2.5 p-3 px-4 text-danger hover:bg-danger/8 font-bold text-sm cursor-pointer text-left transition-colors border-none"
                                onClick={logout}
                            >
                                <MdLogout size={18} />
                                <span>Logout</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

export default AdminHeader;