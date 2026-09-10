import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import "@fontsource/nunito";
import "@fontsource/roboto";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";

import "./styles/globals.css";

ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <AuthProvider>
            <App />
            <Toaster
                position="bottom-right"
                toastOptions={{
                    style: {
                        background: '#FFFFFF',
                        color: '#4B2E2B',
                        border: '1px solid #E8DED3',
                        borderRadius: '12px',
                    },
                    success: {
                        iconTheme: {
                            primary: '#22C55E',
                            secondary: '#FFFFFF',
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: '#EF4444',
                            secondary: '#FFFFFF',
                        },
                    },
                }}
            />
        </AuthProvider>
    </BrowserRouter>
);