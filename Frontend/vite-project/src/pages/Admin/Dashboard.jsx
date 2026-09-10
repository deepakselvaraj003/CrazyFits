import { useEffect, useState } from "react";
import { MdCancel, MdCheckCircle, MdDashboard, MdEmail, MdPending, MdShoppingCart } from "react-icons/md";
import { getDashboard } from "../../services/requestService";

function Dashboard() {
    const [dashboard, setDashboard] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadDashboard();
    }, []);

    async function loadDashboard() {
        try {
            const res = await getDashboard();
            setDashboard(res.data.data);
        } catch (err) {
            console.log(err);
        } finally {
            setLoading(false);
        }
    }

    if (loading) {
        return <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50"><div className="space-y-2"><div className="h-8 w-40 animate-pulse rounded bg-border/60" /><div className="h-5 w-64 animate-pulse rounded bg-border/60" /></div><div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <div key={index} className="h-40 animate-pulse rounded-[18px] border border-border bg-surface p-5 shadow-sm"><div className="h-11 w-11 rounded-xl bg-border/60" /><div className="mt-5 h-4 w-24 rounded bg-border/60" /><div className="mt-3 h-8 w-16 rounded bg-border/60" /></div>)}</div></div>;
    }

    return <div className="flex flex-1 flex-col gap-6 overflow-y-auto pb-6 pr-1 text-dark [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-border/80 hover:[&::-webkit-scrollbar-thumb]:bg-primary/50">
        <header><h1 className="m-0 font-heading text-2xl font-bold tracking-tight text-dark">Dashboard</h1><p className="mt-1 font-body text-sm text-secondary">Welcome back, {JSON.parse(localStorage.getItem("admin"))?.full_name || "Admin"} 👋</p></header>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-warning/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-warning/10 text-warning"><MdPending size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Pending</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.pending_requests}</p></div></div>
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-blue-500/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600"><MdEmail size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Contacted</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.contacted_requests}</p></div></div>
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-purple-500/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600"><MdShoppingCart size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Order Confirmed</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.order_confirmed_requests}</p></div></div>
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-success/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/10 text-success"><MdCheckCircle size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Completed</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.completed_requests}</p></div></div>
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-danger/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-danger/10 text-danger"><MdCancel size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Cancelled</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.cancelled_requests}</p></div></div>
            <div className="flex h-40 flex-col justify-between rounded-[18px] border border-primary/30 bg-surface p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"><div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary"><MdDashboard size={23} /></div><div><h2 className="font-heading text-sm font-semibold text-secondary">Total Requests</h2><p className="mt-1 font-heading text-3xl font-bold text-dark">{dashboard.total_requests}</p></div></div>
        </div>
    </div>;
}

export default Dashboard;
