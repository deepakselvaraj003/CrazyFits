import { NavLink } from "react-router-dom";
import { 
  MdDashboard, 
  MdListAlt, 
  MdPhotoLibrary, 
  MdFeedback, 
  MdSettings,
  MdClose,
  MdSecurity
} from "react-icons/md";
import Logo from "../../assets/logo/Logo.png";

function AdminSidebar({ isOpen, onClose }) {
    return (
        <div className={`fixed inset-y-0 left-0 z-50 w-60 bg-surface border-r border-border flex flex-col transition-transform duration-300 transform lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}>
            <button
                className="absolute top-4 right-4 p-2 rounded-full text-secondary hover:bg-background hover:text-dark lg:hidden transition-colors border-none cursor-pointer"
                onClick={onClose}
                aria-label="Close sidebar"
            >
                <MdClose size={24} />
            </button>

            <div className="flex items-center px-6 py-5 mb-4 shrink-0">
                <img
                    src={Logo}
                    alt="CrazyFits"
                    className="w-full max-w-[120px] h-auto object-contain"
                />
            </div>

            <nav className="flex flex-col gap-2 px-4">
                <NavLink 
                    to="/admin/dashboard" 
                    onClick={onClose} 
                    end
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdDashboard size={20} />
                    <span>Dashboard</span>
                </NavLink>

                <NavLink 
                    to="/admin/requests" 
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdListAlt size={20} />
                    <span>Requests</span>
                </NavLink>

                <NavLink 
                    to="/admin/gallery" 
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdPhotoLibrary size={20} />
                    <span>Gallery</span>
                </NavLink>

                <NavLink 
                    to="/admin/feedback" 
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdFeedback size={20} />
                    <span>Feedbacks</span>
                </NavLink>

                <NavLink 
                    to="/admin/settings" 
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdSettings size={20} />
                    <span>Settings</span>
                </NavLink>

                <NavLink 
                    to="/admin/security" 
                    onClick={onClose}
                    className={({ isActive }) => `flex items-center gap-3 p-3 px-4 rounded-xl text-sm font-semibold transition-all duration-200 ${isActive ? "text-primary bg-primary/10 font-bold" : "text-secondary hover:text-dark hover:bg-background"}`}
                >
                    <MdSecurity size={20} />
                    <span>Security</span>
                </NavLink>
            </nav>
        </div>
    );
}

export default AdminSidebar;