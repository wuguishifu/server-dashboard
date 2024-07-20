import { Eye, EyeOff } from 'lucide-react';
import { useCallback, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import z from 'zod';

import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/providers/auth-provider';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';

const formSchema = z.object({
    login: z.string()
        .min(1, { message: ' - required' }),
    password: z.string()
        .min(1, { message: ' - required' }),
});

type FormSchema = z.infer<typeof formSchema>;

export default function Login() {
    const { login } = useAuth();

    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    const [passwordVisible, setPasswordVisible] = useState(false);
    const togglePasswordVisibility = () => setPasswordVisible(p => !p);

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            login: '',
            password: '',
        },
    });

    const onSubmit = useCallback(async (values: FormSchema) => {
        try {
            await login(values.login, values.password);
            toast.success('logged in');

            const next = searchParams.get('next');
            if (next) navigate(next);

            navigate('/home');
        } catch (error) {
            console.error(error);
            form.setError('login', { message: ' - invalid credentials' });
        }
    }, [login, navigate, searchParams, form]);

    return (
        <main className='h-screen place-content-center'>
            <div className='max-w-[25rem] mx-auto px-6'>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
                        <h1 className='text-3xl font-bold text-center'>log in</h1>
                        <FormField
                            control={form.control}
                            name='login'
                            render={({ field }) => (
                                <FormItem className='space-y-2'>
                                    <div className='flex flex-row items-center'>
                                        <FormLabel className='leading-1'>login{form.formState.errors.login?.message ?? ''}</FormLabel>
                                    </div>
                                    <FormControl>
                                        <Input
                                            placeholder='bo@bramer.dev'
                                            autoComplete='on'
                                            {...field}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name='password'
                            render={({ field }) => (
                                <FormItem className='space-y-2'>
                                    <div className='flex flex-row items-center'>
                                        <FormLabel className='leading-1'>password{form.formState.errors.password?.message ?? ''}</FormLabel>
                                    </div>
                                    <div className='relative'>
                                        <FormControl>
                                            <Input
                                                placeholder={passwordVisible ? 'password' : '••••••••'}
                                                autoComplete='on'
                                                type={passwordVisible ? 'text' : 'password'}
                                                {...field}
                                            />
                                        </FormControl>
                                        <Button
                                            type='button'
                                            variant='ghost'
                                            onClick={togglePasswordVisibility}
                                            className='absolute right-0 top-0 bottom-0 aspect-square p-2'
                                        >
                                            {passwordVisible ? <EyeOff size={20} /> : <Eye size={20} />}
                                        </Button>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <Button
                            type='submit'
                            className='w-full !mt-16'
                        >
                            log in
                        </Button>
                    </form>
                </Form>
            </div>
        </main>
    );
}
