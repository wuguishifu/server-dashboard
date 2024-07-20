import { BrowserRouter, Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

import { AuthProvider, useAuth } from '@/providers/auth-provider';
import { ThemeProvider } from '@/providers/theme-provider';

import Login from '@/app/login/page';
import Index from '@/app/page';
import Home from '@/app/home/page';

export default function App() {
    return (
        <AuthProvider>
            <ThemeProvider defaultTheme='dark' storageKey='vite-ui-theme'>
                <div className='w-full min-h-screen h-full dark'>
                    <BrowserRouter>
                        <Routes>
                            <Route path='/'>
                                <Route index element={<Index />} />
                                <Route path='login' element={<Login />} />
                                <Route element={<Protected />}>
                                    <Route path='home' element={<Home />} />
                                </Route>
                            </Route>
                        </Routes>
                    </BrowserRouter>
                    <Toaster richColors />
                </div>
            </ThemeProvider>
        </AuthProvider>
    );
}

function Protected() {
    const { user, hasCheckedAuth } = useAuth();
    if (!hasCheckedAuth) return null;
    if (!user) return <Navigate to='/login' />;
    else return <Outlet />;
}
