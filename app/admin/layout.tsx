'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { onAuthStateChanged } from '@/lib/auth';
import { AdminSidebar } from '@/components/admin/Sidebar';
import { Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, setUser, isLoading, setLoading } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const unsubscribe = onAuthStateChanged((firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      
      if (!firebaseUser && pathname !== '/admin/login') {
        router.replace('/admin/login');
      }
    });

    return () => unsubscribe();
  }, [pathname, router, setUser, setLoading]);

  // Prevent flash during mount
  if (!mounted) return null;

  // Login page doesn't need sidebar and guard
  if (pathname === '/admin/login') {
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-cream flex items-center justify-center">
        <Loader2 size={32} className="text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-cream">
      <AdminSidebar />
      <main className="md:pl-64 pb-24 md:pb-0">
        <div className="max-w-5xl mx-auto px-4 py-6 md:px-8 md:py-10">
          {children}
        </div>
      </main>
    </div>
  );
}
