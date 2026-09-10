import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

import MainLayout from "../layouts/MainLayout";
import AdminLayout from "../layouts/AdminLayout";
import Login from "../pages/Admin/Login";
import Home from "../pages/Home/Home";
import Gallery from "../pages/Gallery/Gallery";
import Design from "../pages/Design/Design";

import Feedback from "../pages/Feedback/Feedback";
import MyDesigns from "../pages/MyDesigns/MyDesign";
import Security from "../pages/Admin/Security";
import Dashboard from "../pages/Admin/Dashboard";
import Requests from "../pages/Admin/Requests";
import GalleryAdmin from "../pages/Admin/GalleryManagement";
import Settings from "../pages/Admin/BusinessSettings";
import FeedbackAdmin from "../pages/Admin/Feedback";
import Notifications from "../pages/Admin/Notifications";

function ProtectedCustomerRoute({ children }) {
    const { customer } = useAuth();
    const location = useLocation();

    if (!customer) {
        return <Navigate to="/?login=true" state={{ from: location }} replace />;
    }
    return children;
}

function ProtectedAdminRoute({ children }) {
    const isAdmin = !!localStorage.getItem("admin");

    if (!isAdmin) {
        return <Navigate to="/admin/login" replace />;
    }
    return children;
}

export default function AppRoutes() {
    return (
        <Routes>

            {/* Customer */}

            <Route element={<MainLayout />}>

                <Route path="/" element={<Home />} />

                <Route path="/gallery" element={<Gallery />} />

                <Route path="/design" element={<Design />} />

                <Route path="/feedback" element={
                    <ProtectedCustomerRoute>
                        <Feedback />
                    </ProtectedCustomerRoute>
                } />

                <Route path="/my-designs" element={
                    <ProtectedCustomerRoute>
                        <MyDesigns />
                    </ProtectedCustomerRoute>
                } />

            </Route>

            {/* Admin */}

            <Route path="/admin/login" element={<Login />} />

            <Route path="/admin" element={
                <ProtectedAdminRoute>
                    <AdminLayout />
                </ProtectedAdminRoute>
            }>
                <Route path="dashboard" element={<Dashboard />} />
                <Route path="requests" element={<Requests />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="gallery" element={<GalleryAdmin />} />
                <Route path="settings" element={<Settings />} />
                <Route path="feedback" element={<FeedbackAdmin />} />
                <Route path="security" element={<Security />} />
            </Route>

        </Routes>
    );
}