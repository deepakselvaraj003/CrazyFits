import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    MdNotifications,
    MdDelete,
    MdDeleteSweep,
    MdCheckCircleOutline,
    MdArrowForward,
} from "react-icons/md";
import { toast } from "react-hot-toast";
import {
    getNotifications,
    deleteNotification,
    emptyAllNotifications,
    markNotificationAsRead,
} from "../../services/notificationService";

function formatFullTime(dateStr) {
    if (!dateStr) return "";
    try {
        const date = new Date(dateStr);
        return date.toLocaleString(undefined, {
            year: "numeric",
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
        });
    } catch {
        return "";
    }
}

function Notifications() {
    const navigate = useNavigate();
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState(null);
    const [emptying, setEmptying] = useState(false);

    const loadData = async () => {
        try {
            setLoading(true);
            const res = await getNotifications();
            if (res.data?.success) {
                setNotifications(res.data.data || []);
            }
        } catch (err) {
            toast.error("Failed to load notifications.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleDeleteSingle = async (e, id) => {
        e.stopPropagation();
        try {
            setDeletingId(id);
            await deleteNotification(id);
            setNotifications((prev) => prev.filter((item) => item.id !== id));
            window.dispatchEvent(new Event("notificationsUpdated"));
            toast.success("Notification deleted.");
        } catch (err) {
            toast.error("Failed to delete notification.");
        } finally {
            setDeletingId(null);
        }
    };

    const handleEmptyAll = async () => {
        if (notifications.length === 0) return;
        try {
            setEmptying(true);
            await emptyAllNotifications();
            setNotifications([]);
            window.dispatchEvent(new Event("notificationsUpdated"));
            toast.success("All notifications deleted.");
        } catch (err) {
            toast.error("Failed to delete all notifications.");
        } finally {
            setEmptying(false);
        }
    };

    const handleRowClick = async (item) => {
        if (!item.is_read) {
            try {
                await markNotificationAsRead(item.id);
                window.dispatchEvent(new Event("notificationsUpdated"));
            } catch {
                // Ignore failure
            }
        }
        navigate("/admin/requests");
    };

    if (loading) {
        return (
            <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark">
                <div className="space-y-2">
                    <div className="h-8 w-48 animate-pulse rounded bg-border/60" />
                    <div className="h-4 w-64 animate-pulse rounded bg-border/60" />
                </div>
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="h-20 animate-pulse rounded-2xl border border-border bg-surface p-4" />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="m-0 font-heading text-2xl font-bold tracking-tight text-dark">
                        All Notifications
                    </h1>
                    <p className="mt-1 font-body text-sm text-secondary">
                        Manage your incoming customer request alerts and activity
                    </p>
                </div>

                {notifications.length > 0 && (
                    <button
                        onClick={handleEmptyAll}
                        disabled={emptying}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-danger/30 text-danger hover:bg-danger/10 text-xs md:text-sm font-semibold transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                        <MdDeleteSweep size={18} />
                        <span>{emptying ? "Deleting..." : "Empty All"}</span>
                    </button>
                )}
            </header>

            {/* Notifications List */}
            {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-4 rounded-2xl border border-border bg-surface text-center">
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                        <MdCheckCircleOutline size={28} />
                    </div>
                    <h3 className="font-heading font-bold text-base text-dark m-0">No Notifications</h3>
                    <p className="text-xs text-secondary mt-1 max-w-sm">
                        You have cleared all alerts. New quote request notifications will appear here automatically.
                    </p>
                </div>
            ) : (
                <div className="flex flex-col gap-3">
                    {notifications.map((item) => (
                        <div
                            key={item.id}
                            onClick={() => handleRowClick(item)}
                            className={`group relative flex items-start sm:items-center justify-between gap-4 p-4 md:p-5 rounded-2xl border transition-all duration-200 cursor-pointer ${
                                !item.is_read
                                    ? "bg-surface border-primary/40 shadow-sm hover:border-primary"
                                    : "bg-surface/80 border-border hover:bg-surface hover:border-border"
                            }`}
                        >
                            <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                                <div
                                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                                        !item.is_read
                                            ? "bg-[#8C5A3C]/15 text-[#8C5A3C]"
                                            : "bg-background text-secondary"
                                    }`}
                                >
                                    <MdNotifications size={20} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex flex-wrap items-center gap-2">
                                        <h4 className="font-heading font-bold text-sm text-dark m-0 truncate">
                                            {item.customer_name ? item.customer_name : "Quote Request"}
                                        </h4>
                                        {item.request_number && (
                                            <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded-md bg-background text-secondary border border-border">
                                                #{item.request_number}
                                            </span>
                                        )}
                                        {!item.is_read && (
                                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#8C5A3C] text-white">
                                                NEW
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-xs text-secondary mt-1 m-0 line-clamp-2 leading-relaxed">
                                        {item.message}
                                    </p>

                                    <span className="text-[11px] text-secondary/70 mt-1.5 block">
                                        {formatFullTime(item.created_at)}
                                    </span>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 self-center">
                                <button
                                    onClick={(e) => handleDeleteSingle(e, item.id)}
                                    disabled={deletingId === item.id}
                                    className="p-2 text-secondary hover:text-danger hover:bg-danger/10 rounded-xl transition-all border-none cursor-pointer"
                                    title="Delete notification"
                                    aria-label="Delete"
                                >
                                    <MdDelete size={19} />
                                </button>
                                <span className="text-secondary/50 group-hover:text-primary transition-colors hidden sm:block">
                                    <MdArrowForward size={18} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default Notifications;
