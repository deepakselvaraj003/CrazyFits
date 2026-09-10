import { Link } from "react-router-dom";
import HeroImage from "../../assets/logo/Hero Section.png";

export default function Hero({ settings }) {
    return (
        <section className="min-h-screen py-24 lg:py-32 px-6 md:px-16 lg:px-24 bg-background flex flex-col md:flex-row items-center justify-between gap-12 font-body">

            <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left">

                <h1 className="text-5xl md:text-6xl xl:text-7xl font-extrabold text-dark leading-tight md:leading-[1.1] mb-6 font-heading">
                    Design Your Dream T-Shirt
                </h1>

                <p className="text-lg lg:text-xl leading-8 text-secondary mb-8 max-w-xl leading-relaxed">
                    Create premium custom T-Shirts for your business,
                    college, events, sports teams and personal use.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 flex-wrap justify-center md:justify-start w-full">

                    <Link to="/design" className="inline-flex items-center justify-center px-8 py-3.5 bg-primary hover:bg-primary-hover text-surface font-semibold rounded-button shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer">
                        Design Now
                    </Link>

                    <Link to="/gallery" className="inline-flex items-center justify-center px-8 py-3.5 border-2 border-primary text-primary hover:bg-primary/5 font-semibold rounded-button transition-all duration-200 cursor-pointer">
                        Browse Gallery
                    </Link>

                </div>

<p className="mt-5 flex flex-wrap items-center justify-center gap-2 px-4 text-center font-body text-sm text-secondary sm:text-base">
    <span>
        Explore hundreds of ready-made T-shirt templates.
    </span>

    <a
        href={settings?.design_url || "#"}
        target={settings?.design_url ? "_blank" : undefined}
        rel={settings?.design_url ? "noreferrer" : undefined}
        className="
            inline-flex
            items-center
            font-semibold
            text-primary
            transition-all
            duration-300
            hover:scale-105
            hover:text-primary-hover
        "
    >
        Explore Templates ↗
    </a>
</p>

            </div>

            <div className="w-full md:w-[45%] flex justify-center md:justify-end">

                <img
                    src={HeroImage}
                    alt="Custom T-Shirt"
                    className="w-full max-w-xl rounded-card border border-border shadow-xl transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                />

            </div>

        </section>
    );
}
