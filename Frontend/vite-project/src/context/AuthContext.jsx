import { createContext, useContext, useState, useEffect } from "react";
import api from "../api/axios";

const AuthContext = createContext();

export function AuthProvider({ children }) {

    const [customer, setCustomer] = useState(null);

    useEffect(() => {

        const storedCustomer = localStorage.getItem("customer");

        if (storedCustomer) {

            try {

                setCustomer(JSON.parse(storedCustomer));

            } catch {

                localStorage.removeItem("customer");

            }

        }

        const handleLogoutEvent = () => {
            setCustomer(null);
        };

        window.addEventListener("customer-logout", handleLogoutEvent);
        return () => {
            window.removeEventListener("customer-logout", handleLogoutEvent);
        };

    }, []);

    const login = (data) => {

        localStorage.removeItem("admin");
        localStorage.removeItem("admin_access_token");
        localStorage.removeItem("admin_refresh_token");

        localStorage.setItem(
            "access_token",
            data.access_token
        );

        localStorage.setItem(
            "refresh_token",
            data.refresh_token
        );

        localStorage.setItem(
            "customer",
            JSON.stringify(data.user)
        );

        setCustomer(data.user);

    };

    const logout = async () => {

        // Call backend to clear the HttpOnly access_token cookie.
        // JavaScript cannot delete HttpOnly cookies directly — only the server can.
        try {
            await api.post("account/logout/");
        } catch {
            // Ignore errors — clear local state regardless
        }

        localStorage.removeItem("access_token");

        localStorage.removeItem("refresh_token");

        localStorage.removeItem("customer");

        setCustomer(null);

    };

    return (

        <AuthContext.Provider
            value={{
                customer,
                login,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>

    );

}

export function useAuth() {

    return useContext(AuthContext);

}