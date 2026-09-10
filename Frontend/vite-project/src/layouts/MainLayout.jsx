import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";

import Navbar from "../components/Navbar/Navbar";
import Footer from "../components/Footer/Footer";

import { getSettings } from "../services/settings";

function MainLayout() {

    const [settings, setSettings] = useState(null);

    useEffect(() => {
        fetchSettings();
    }, []);

    async function fetchSettings() {

        try {

            const response = await getSettings();

            setSettings(response.data.data);

        } catch (error) {

            console.log("Failed to load platform settings:", error);

        }

    }

    return (

        <>
            <Navbar settings={settings} />

            <main>
                <Outlet context={{ settings }} />
            </main>

            <Footer settings={settings} />
        </>

    );

}

export default MainLayout;
