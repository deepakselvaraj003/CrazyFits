import { Link } from "react-router-dom";
import {
    FaEnvelope,
    FaPhoneAlt,
    FaMapMarkerAlt,
    FaGlobe,
    FaInstagram,
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";
import Logo from "../../assets/logo/Logo.png";

/*
 * Design token reference (globals.css @theme):
 *   bg-dark        #4B2E2B  — deepest warm brown  → footer base
 *   text-primary   #C08552  — amber               → headings & hover
 *   text-secondary #8C5A3C  — medium brown        → (too dark on bg-dark; use opacity)
 *   border-border  #E8DED3  — warm beige          → muted text & divider
 *   bg-background  #FFF8F0  — cream               → rest of the page
 */

function Footer({ settings }) {
    return (
        <footer className="bg-dark font-body">
            <div className="mx-auto w-full max-w-7xl px-6 py-12 md:px-10 md:py-16 lg:px-16 lg:py-20">

                <div className="grid grid-cols-1 gap-12 text-center md:grid-cols-2 lg:grid-cols-4 lg:gap-8 lg:text-left">


                    <div className="flex flex-col items-center gap-6 lg:items-start">

                        <div className="inline-flex shrink-0 items-center justify-center">
                            <img
                                src={Logo}
                                alt="CrazyFits Logo"
                                className="h-17 w-auto object-contain"
                            />
                        </div>

                        <p className="max-w-[320px] text-sm leading-relaxed text-border/75">
                            CrazyFits helps you create custom T-shirts with unique designs, effortless personalization, and premium-quality printing.
                        </p>

                    </div>

                    {/* ── Quick Links ─────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-5 lg:items-start">

                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-heading">
                            Quick Links
                        </h3>

                        <nav className="flex flex-col items-center gap-4 lg:items-start">
                            {[
                                { label: "Home", to: "/" },
                                { label: "Gallery", to: "/gallery" },
                                { label: "Customize", to: "/design" },
                            ].map(({ label, to }) => (
                                <Link
                                    key={to}
                                    to={to}
                                    onClick={label === "Home" ? () => window.scrollTo({ top: 0, behavior: "smooth" }) : undefined}
                                    className="text-sm text-border/75 transition-colors duration-200 hover:text-primary"
                                >
                                    {label}
                                </Link>
                            ))}
                            <a
                                href={settings?.design_url || "#"}
                                target={settings?.design_url ? "_blank" : undefined}
                                rel={settings?.design_url ? "noreferrer" : undefined}
                                className="text-sm text-border/75 transition-colors duration-200 hover:text-primary"
                            >
                                Templates
                            </a>
                        </nav>

                    </div>

                    {/* ── Contact ─────────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-5 lg:items-start">

                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-heading">
                            Contact
                        </h3>

                        <div className="flex flex-col items-center gap-4 lg:items-start">

                            {/* Added justify-center on mobile, justify-start on desktop for icons */}
                            {settings?.email && (
                                <a
                                    href={`mailto:${settings.email}`}
                                    className="flex w-full items-center justify-center gap-3 text-sm text-border/75 transition-colors duration-200 hover:text-primary lg:justify-start"
                                >
                                    <FaEnvelope className="shrink-0 text-primary" />
                                    <span className="truncate">{settings.email}</span>
                                </a>
                            )}

                            {settings?.phone_number && (
                                <a
                                    href={`tel:${settings.phone_number}`}
                                    className="flex w-full items-center justify-center gap-3 text-sm text-border/75 transition-colors duration-200 hover:text-primary lg:justify-start"
                                >
                                    <FaPhoneAlt className="shrink-0 text-primary" />
                                    <span>{settings.phone_number}</span>
                                </a>
                            )}

                            {settings?.address && (
                                <div className="flex w-full items-start justify-center gap-3 text-sm text-border/75 lg:justify-start text-center lg:text-left">
                                    <FaMapMarkerAlt className="mt-1 shrink-0 text-primary" />
                                    <span className="max-w-[220px] leading-relaxed">{settings.address}</span>
                                </div>
                            )}

                        </div>

                    </div>

                    {/* ── Follow Us ───────────────────────────────────── */}
                    <div className="flex flex-col items-center gap-5 lg:items-start">

                        <h3 className="text-sm font-bold uppercase tracking-widest text-primary font-heading">
                            Follow Us
                        </h3>

                        {/* Flex-wrap and gap optimization for social icons */}
                        <div className="flex flex-wrap justify-center gap-3 lg:justify-start">

                            {settings?.website_url && (
                                <a
                                    href={settings.website_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Website"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-dark hover:shadow-md"
                                >
                                    <FaGlobe size={18} />
                                </a>
                            )}

                            {settings?.instagram_url && (
                                <a
                                    href={settings.instagram_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Instagram"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-dark hover:shadow-md"
                                >
                                    <FaInstagram size={18} />
                                </a>
                            )}

                            {settings?.twitter_url && (
                                <a
                                    href={settings.twitter_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    aria-label="Twitter / X"
                                    className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary transition-all duration-300 hover:-translate-y-1 hover:bg-primary hover:text-dark hover:shadow-md"
                                >
                                    <FaXTwitter size={18} />
                                </a>
                            )}

                        </div>

                    </div>

                </div>

            </div>

            {/* ── Bottom bar: Optimized padding and text color contrast ── */}
            <div className="border-t border-border/15 bg-dark py-5 text-center text-xs tracking-wider text-border/50 font-body">
                © {new Date().getFullYear()} CrazyFits. All rights reserved.
            </div>

        </footer>
    );
}

export default Footer;
