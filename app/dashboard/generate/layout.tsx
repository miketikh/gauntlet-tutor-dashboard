import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function GenerateLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/sign-in');
  }

  // Check if user has admin role
  // Note: Using email to lookup because auth.users.id may not match public.users.id
  const { data: userData } = await supabase
    .from('users')
    .select('role')
    .eq('email', user.email)
    .single();

  if (userData?.role !== 'admin') {
    redirect('/dashboard');
  }

  return <>{children}</>;
}
