import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getExternalSupabase } from '@/integrations/external-supabase/client';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userRoles: string[];
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userRoles, setUserRoles] = useState<string[]>([]);

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);

      if (error) {
        logger.error('Failed to fetch user roles', 'AuthContext', { error: error.message });
        return;
      }
      setUserRoles(data?.map(r => r.role) ?? []);
    } catch (err) {
      logger.error('Error fetching user roles', 'AuthContext', { error: String(err) });
    }
  };

  useEffect(() => {
    const client = getExternalSupabase();
    if (!client) {
      setIsLoading(false);
      return;
    }

    // Set up auth state listener FIRST
    const { data: { subscription } } = client.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setIsLoading(false);

        if (session?.user) {
          // Defer role fetch to avoid Supabase deadlock
          setTimeout(() => fetchUserRoles(session.user.id), 0);
        } else {
          setUserRoles([]);
        }
      }
    );

    // THEN check for existing session
    client.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);

      if (session?.user) {
        fetchUserRoles(session.user.id);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const client = getExternalSupabase();
    if (!client) {
      return { error: new Error('Authentication not configured') };
    }

    const { error } = await client.auth.signInWithPassword({
      email,
      password,
    });

    return { error: error as Error | null };
  };

  const signOut = async () => {
    const client = getExternalSupabase();
    if (client) {
      await client.auth.signOut();
    }
    setUser(null);
    setSession(null);
    setUserRoles([]);
  };

  const value = useMemo(() => ({
    user,
    session,
    isLoading,
    isAuthenticated: !!user,
    userRoles,
    signIn,
    signOut,
  }), [user, session, isLoading, userRoles]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
