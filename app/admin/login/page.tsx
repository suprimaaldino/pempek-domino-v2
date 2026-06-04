'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Lock, User, UtensilsCrossed, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import { useToast } from '@/components/ui/Toast';
import { loginAdmin } from '@/lib/auth';

const schema = z.object({
  username: z.string().min(1, 'Masukkan username'),
  password: z.string().min(1, 'Masukkan password'),
});

type FormValues = z.infer<typeof schema>;

export default function AdminLoginPage() {
  const router = useRouter();
  const { error: toastError } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      username: '',
      password: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    setLoading(true);
    try {
      await loginAdmin(data.username, data.password);
      router.push('/admin/dashboard');
    } catch (err: any) {
      console.error(err);
      toastError(err.message || 'Login gagal. Periksa kembali username dan password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-cream flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8 flex flex-col items-center justify-center">
          <div className="w-24 h-24 rounded-2xl overflow-visible shadow-card mb-4 relative bg-white flex items-center justify-center">
            <Image
              src="/icons/icon-192.png"
              alt="Logo Pempek Domino"
              width={96}
              height={96}
              className="w-20 h-20 object-contain"
              priority
            />
          </div>
          <h1 className="font-display font-bold text-2xl text-brown">Pempek Domino</h1>
          <p className="text-brown/50 text-sm">Masuk ke Panel Admin</p>
        </div>

        <Card>
          <CardBody className="p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <Input
                label="Username"
                placeholder="Masukkan username"
                leftIcon={<User size={18} />}
                autoComplete="off"
                error={errors.username?.message}
                {...register('username')}
              />
              <Input
                label="Password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Masukkan password"
                leftIcon={<Lock size={18} />}
                autoComplete="new-password"
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="hover:text-brown focus:outline-none transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                }
                error={errors.password?.message}
                {...register('password')}
              />
              <Button type="submit" className="w-full mt-2" loading={loading}>
                Masuk
              </Button>
            </form>
          </CardBody>
        </Card>

        <div className="text-center mt-4">
          <Link
            href="/order"
            className="text-xs font-semibold text-primary hover:underline transition-all inline-flex items-center gap-1"
          >
            &larr; Kembali ke Menu Pemesanan
          </Link>
        </div>

        <p className="text-center text-xs text-brown/40 mt-8">
          &copy; {new Date().getFullYear()} Pempek Domino. All rights reserved.
        </p>
      </div>
    </main>
  );
}
