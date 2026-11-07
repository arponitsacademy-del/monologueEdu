import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { SettingsProvider } from './context/SettingsContext';
import { AppRoutes } from './routes/AppRoutes';
import { captureReferralFromUrl } from './utils/referralTracker';

// Capture any incoming referral parameter (?ref=CODE)
captureReferralFromUrl();

const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            refetchOnWindowFocus: false,
            retry: 1,
        },
    },
});

const rootElement = document.getElementById('root');

if (rootElement) {
    ReactDOM.createRoot(rootElement).render(
        <React.StrictMode>
            <QueryClientProvider client={queryClient}>
                <BrowserRouter>
                    <SettingsProvider>
                        <ThemeProvider>
                            <LanguageProvider>
                                <AuthProvider>
                                    <AppRoutes />
                                </AuthProvider>
                            </LanguageProvider>
                        </ThemeProvider>
                    </SettingsProvider>
                </BrowserRouter>
            </QueryClientProvider>
        </React.StrictMode>
    );
}
