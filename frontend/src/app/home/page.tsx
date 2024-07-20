import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/auth-provider';

export default function Home() {
    const { user, logout } = useAuth();

    return (
        <main>
            <h1>Home</h1>
            <p>account: {user!.email}</p>
            <Button
                type='button'
                onClick={logout}
            >
                log out
            </Button>
        </main>
    );
}
