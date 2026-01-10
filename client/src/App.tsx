import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import RunningCalculator from './pages/RunningCalculator';
import WeightCalculator from './pages/WeightCalculator';
import PitchingCalculator from './pages/PitchingCalculator';
import BadmintonScoreboard from './pages/BadmintonScoreboard';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import { AlertProvider } from './components/AlertContext';

function App() {
    useEffect(() => {
        const fetchSEO = async () => {
            try {
                const response = await fetch('/api/seo');
                if (!response.ok) return;
                const data = await response.json();

                // Update Title
                document.title = data.title;

                // Update Meta Tags
                const updateMeta = (property: string, content: string, attrName: string = 'property') => {
                    const element = document.querySelector(`meta[${attrName}="${property}"]`);
                    if (element) {
                        element.setAttribute('content', content);
                    }
                };

                updateMeta('description', data.description, 'name');
                updateMeta('keywords', data.keywords, 'name');
                updateMeta('og:title', data.title);
                updateMeta('og:description', data.description);
                updateMeta('og:image', data.image);
                updateMeta('og:url', data.url);
                updateMeta('twitter:title', data.title);
                updateMeta('twitter:description', data.description);
                updateMeta('twitter:image', data.image);
            } catch (error) {
                console.error('Failed to fetch SEO data:', error);
            }
        };

        fetchSEO();
    }, []);

    return (
        <BrowserRouter>
            <AlertProvider>
                <Routes>
                    <Route path="/" element={<AppLayout />}>
                        <Route index element={<Navigate to="/running" replace />} />
                        <Route path="running" element={<RunningCalculator />} />
                        <Route path="weight" element={<WeightCalculator />} />
                        <Route path="pitching" element={<PitchingCalculator />} />
                        <Route path="badminton" element={<BadmintonScoreboard />} />
                        <Route path="login" element={<LoginPage />} />
                        <Route path="register" element={<RegisterPage />} />
                    </Route>
                </Routes>
            </AlertProvider>
        </BrowserRouter>
    );
}

export default App;
