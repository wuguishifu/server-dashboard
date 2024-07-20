import endpoints from '@/config/endpoints';
import { createContext, useCallback, useContext, useEffect, useState } from 'react';

type User = {
    email: string;
};

type AuthContextProps = {
    hasCheckedAuth: boolean;
    user: User | null;
    login: (email: string, password: string) => Promise<void>;
    logout: () => Promise<void>;
};

const AuthContext = createContext({} as AuthContextProps);

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: Readonly<React.ReactNode> }) {
    const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
    const [user, setUser] = useState<User | null>(null);

    const login = useCallback(async (email: string, password: string) => {
        const response = await fetch(endpoints.auth.login, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email,
                password
            }),
            credentials: 'include',
        });

        const data = await response.json();
        if (data.error) throw new Error(data.error);
        setUser(data.user);
    }, []);

    const logout = useCallback(async () => {
        const response = await fetch(endpoints.auth.logout, {
            method: 'POST',
            credentials: 'include',
        });

        if (response.ok) {
            setUser(null);
        } else {
            console.error('failed to log out:', response.statusText);
        }
    }, []);

    const checkSession = useCallback(async () => {
        try {
            const response = await fetch(endpoints.auth.checkSession, {
                method: 'GET',
                credentials: 'include',
            });
            if (response.ok) {
                const data = await response.json();
                setUser(data.user);
            } else if (response.status === 401) {
                setUser(null);
            } else {
                console.error('failed to check session:', response.statusText);
            }
        } catch (error) {
            console.error(error);
        }
    }, []);

    useEffect(() => {
        checkSession().then(() => setHasCheckedAuth(true));
        const interval = setInterval(checkSession, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [checkSession]);

    const value = {
        hasCheckedAuth,
        user,
        login,
        logout,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
