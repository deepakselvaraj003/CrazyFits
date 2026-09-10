import { useState } from "react";
import { Outlet } from "react-router-dom";
import AdminSidebar from "../components/AdminSidebar/AdminSidebar";
import AdminHeader from "../components/AdminHeader/AdminHeader";

function AdminLayout() {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen w-screen overflow-hidden bg-background">
            {/* Mobile overlay */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <AdminSidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:ml-60">
                <AdminHeader onMenuClick={() => setSidebarOpen(true)} />
                <div className="flex-1 flex flex-col min-h-0 p-4 md:p-6 lg:p-8 bg-background overflow-hidden">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}

export default AdminLayout;