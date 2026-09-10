import Hero from "../../components/Hero/Hero";
import { useOutletContext } from "react-router-dom";
import FeaturedGallery from "../../components/FeaturedGallery/FeaturedGallery";
import WhyChooseUs from "../../components/WhyChooseUs/WhyChooseUs";
import HowItWorks from "../../components/HowItWorks/HowItWorks";
import FeedbackSection from "../../components/FeedbackSection/FeedbackSection";


export default function Home() {

    const { settings } = useOutletContext();

    return (
        <>
            <Hero settings={settings} />
            <FeaturedGallery />
            <WhyChooseUs />
            <HowItWorks />
            <FeedbackSection />
        </>
    );

}
