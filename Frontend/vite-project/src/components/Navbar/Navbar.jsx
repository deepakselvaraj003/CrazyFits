import { Link, useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect, useRef } from "react";
import { Menu, X, User, LogOut } from "lucide-react";
import LoginModal from "../Login/LoginModal";
import { useAuth } from "../../context/AuthContext";
import Logo from "../../assets/logo/Logo.png";

export default function Navbar({ settings }) {

    const [showLoginDropdown, setShowLoginDropdown] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);
    const { customer, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const loginDropdownRef = useRef(null);
    const profileMenuRef = useRef(null);

    useEffect(() => {
        if (location.search.includes("login=true") || location.state?.login) {
            setShowLoginDropdown(true);
        }
    }, [location]);

    useEffect(() => {
        function handleOutsideClick(e) {
            if (
                loginDropdownRef.current &&
                !loginDropdownRef.current.contains(e.target)
            ) {
                setShowLoginDropdown(false);
            }
            if (
                profileMenuRef.current &&
                !profileMenuRef.current.contains(e.target)
            ) {
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("mousedown", handleOutsideClick);
        return () => document.removeEventListener("mousedown", handleOutsideClick);
    }, []);

    // Close on Escape key
    useEffect(() => {
        function handleEscape(e) {
            if (e.key === "Escape") {
                setShowLoginDropdown(false);
                setShowProfileMenu(false);
            }
        }
        document.addEventListener("keydown", handleEscape);
        return () => document.removeEventListener("keydown", handleEscape);
    }, []);

    function closeMenu() {
        setMenuOpen(false);
    }

    function handleFeedbackClick() {
        closeMenu();
        if (customer) {
            navigate("/feedback");
        } else {
            navigate("/");
            setTimeout(() => {
                const feedbackSection = document.getElementById("feedback-section");
                if (feedbackSection) {
                    feedbackSection.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                    });
                }
            }, 100);
        }
    }

    function handleLogout() {
        logout();
        setShowProfileMenu(false);
        closeMenu();
        navigate("/");
    }

    return (
        <nav className="sticky top-0 z-50 w-full h-[76px] bg-background/85 backdrop-blur-md border-b border-border shadow-xs px-6 md:px-16 flex items-center justify-between transition-all duration-300 font-heading">

            <div className="flex items-center">
                <img
                    src={Logo}
                    alt="CrazyFits"
                    className="h-17 w-21  mix-blend-multiply transition-transform duration-300 hover:scale-105"
                />
            </div>

            {/* Hamburger for mobile */}
            <button
                className="md:hidden p-2 rounded-xl text-dark hover:bg-border/40 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all duration-200 cursor-pointer"
                aria-label="Toggle menu"
                onClick={() => setMenuOpen(!menuOpen)}
            >
                {menuOpen ? (
                    <X className="w-6 h-6 animate-in fade-in duration-200" />
                ) : (
                    <Menu className="w-6 h-6 animate-in fade-in duration-200" />
                )}
            </button>

            <ul className={`font-body text-sm font-semibold tracking-wide flex flex-col md:flex-row items-stretch md:items-center gap-4 md:gap-8 absolute md:static top-[76px] md:top-auto left-0 w-full md:w-auto bg-surface md:bg-transparent border-b md:border-b-0 border-border p-6 md:p-0 shadow-lg md:shadow-none transition-all duration-300 ease-in-out z-40 overflow-visible ${menuOpen
                ? "opacity-100 translate-y-0 visible"
                : "opacity-0 -translate-y-4 invisible md:opacity-100 md:translate-y-0 md:visible"
                }`}>

                <li>
                    <Link
                        to="/"
                        onClick={closeMenu}
                        className="text-dark/85 hover:text-primary transition-colors duration-200 py-2 relative block md:inline-block md:after:absolute md:after:bottom-[-4px] md:after:left-0 md:after:w-full md:after:h-[2px] md:after:bg-primary md:after:scale-x-0 md:hover:after:scale-x-100 md:after:transition-transform md:after:duration-200 md:after:origin-left"
                    >
                        Home
                    </Link>
                </li>

                <li>
                    <Link
                        to="/gallery"
                        onClick={closeMenu}
                        className="text-dark/85 hover:text-primary transition-colors duration-200 py-2 relative block md:inline-block md:after:absolute md:after:bottom-[-4px] md:after:left-0 md:after:w-full md:after:h-[2px] md:after:bg-primary md:after:scale-x-0 md:hover:after:scale-x-100 md:after:transition-transform md:after:duration-200 md:after:origin-left"
                    >
                        Gallery
                    </Link>
                </li>

                <li>
                    <a
                        href={settings?.design_url || "#"}
                        target={settings?.design_url ? "_blank" : undefined}
                        rel={settings?.design_url ? "noreferrer" : undefined}
                        onClick={closeMenu}
                        className="text-dark/85 hover:text-primary transition-colors duration-200 py-2 relative block md:inline-block md:after:absolute md:after:bottom-[-4px] md:after:left-0 md:after:w-full md:after:h-[2px] md:after:bg-primary md:after:scale-x-0 md:hover:after:scale-x-100 md:after:transition-transform md:after:duration-200 md:after:origin-left"
                    >
                        Templates
                    </a>
                </li>

                {customer && (
                    <li>
                        <Link
                            to="/my-designs"
                            onClick={closeMenu}
                            className="text-dark/85 hover:text-primary transition-colors duration-200 py-2 relative block md:inline-block md:after:absolute md:after:bottom-[-4px] md:after:left-0 md:after:w-full md:after:h-[2px] md:after:bg-primary md:after:scale-x-0 md:hover:after:scale-x-100 md:after:transition-transform md:after:duration-200 md:after:origin-left"
                        >
                            My Designs
                        </Link>
                    </li>
                )}

                <li>
                    <button
                        className="w-full text-left md:text-center text-dark/85 hover:text-primary transition-colors duration-200 py-2 relative block md:inline-block cursor-pointer md:after:absolute md:after:bottom-[-4px] md:after:left-0 md:after:w-full md:after:h-[2px] md:after:bg-primary md:after:scale-x-0 md:hover:after:scale-x-100 md:after:transition-transform md:after:duration-200 md:after:origin-left font-semibold font-body"
                        onClick={handleFeedbackClick}
                    >
                        Feedback
                    </button>
                </li>

                {/* ── Profile icon ── */}
                {!customer ? (

                    <li className="relative flex flex-col md:flex-row md:items-center" ref={loginDropdownRef}>
                        <button
                            id="profile-icon-btn"
                            className={`flex items-center justify-center w-10 h-10 rounded-full border bg-surface text-dark hover:text-primary hover:border-primary hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 cursor-pointer ${showLoginDropdown ? "border-primary text-primary bg-background shadow-xs" : "border-border"
                                }`}
                            aria-label="Login"
                            aria-expanded={showLoginDropdown}
                            onClick={() => setShowLoginDropdown((prev) => !prev)}
                        >
                            <User className="w-5 h-5" />
                        </button>

                        <div
                            className={`mt-3 md:mt-0 md:absolute md:top-[52px] md:right-0 w-full md:w-[320px] bg-surface border border-border rounded-xl shadow-lg z-50 overflow-hidden transition-all duration-200 ${showLoginDropdown
                                ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto block"
                                : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none hidden md:block"
                                }`}
                        >
                            <LoginModal
                                open={showLoginDropdown}
                                onClose={() => {
                                    setShowLoginDropdown(false);
                                    closeMenu();
                                }}
                            />
                        </div>
                    </li>

                ) : (

                    <li className="relative flex flex-col md:flex-row md:items-center" ref={profileMenuRef}>
                        <button
                            id="profile-icon-btn"
                            className={`flex items-center justify-center w-10 h-10 rounded-full border bg-surface text-dark hover:text-primary hover:border-primary hover:shadow-xs focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all duration-200 cursor-pointer ${showProfileMenu ? "border-primary text-primary bg-background shadow-xs" : "border-border"
                                }`}
                            aria-label="Profile menu"
                            aria-expanded={showProfileMenu}
                            onClick={() => setShowProfileMenu((prev) => !prev)}
                        >
                            <User className="w-5 h-5" />
                        </button>

                        <div
                            className={`mt-3 md:mt-0 md:absolute md:top-[52px] md:right-0 w-full md:w-[260px] bg-surface border border-border rounded-xl shadow-lg overflow-hidden z-50 transition-all duration-200 ${showProfileMenu
                                ? "opacity-100 scale-100 translate-y-0 visible pointer-events-auto block"
                                : "opacity-0 scale-95 -translate-y-2 invisible pointer-events-none hidden md:block"
                                }`}
                        >
                            <div className="px-4 py-3 bg-background/30 border-b border-border">
                                <span className="block text-xs font-semibold text-secondary uppercase tracking-wider mb-1">
                                    Logged in as
                                </span>
                                <span className="block text-sm font-semibold text-dark truncate">
                                    {customer.email}
                                </span>
                            </div>
                            <div className="p-1.5">
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-dark hover:text-primary hover:bg-background rounded-lg text-left transition-colors duration-150 cursor-pointer font-medium"
                                >
                                    <LogOut className="w-4 h-4 text-secondary hover:text-primary transition-colors" />
                                    Logout
                                </button>
                            </div>
                        </div>
                    </li>

                )}

            </ul>

        </nav>
    );
}
