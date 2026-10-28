import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { supabase } from "../lib/supabase";
import type { Session, User } from "@supabase/supabase-js";
import type { UserRole } from "../lib/supabase";

/* ── types ── */
export interface AuthProfile {
  id: string;
  full_name: string;
  email: string;
  role: UserRole;
  bureau_id: string | null;
  regional_office_id: string | null;
  avatar_url?: string | null;
}

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  profile: AuthProfile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (updates: { full_name?: string }) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  isRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/* ── provider ── */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession]   = useState<Session | null>(null);
  const [profile, setProfile]   = useState<AuthProfile | null>(null);
  const [loading, setLoading]   = useState(true);

  /* load profile from DB, or auto-provision on OAuth first sign-in */
  const loadProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, role, bureau_id, regional_office_id")
      .eq("id", userId)
      .single();

    if (!error && data) {
      const avatarUrl =
        currentUser?.user_metadata?.avatar_url ||
        currentUser?.user_metadata?.picture ||
        null;
      setProfile({ ...(data as AuthProfile), avatar_url: avatarUrl });
      return;
    }

    // Auto-provision profile row for Google OAuth or new users
    if (currentUser) {
      const meta = currentUser.user_metadata ?? {};
      const fallbackName =
        meta.full_name ||
        meta.name ||
        currentUser.email?.split("@")[0] ||
        "Officer";
      const avatarUrl = meta.avatar_url || meta.picture || null;

      const newProfile: AuthProfile = {
        id: currentUser.id,
        full_name: fallbackName,
        email: currentUser.email ?? "",
        role: "pgrc_officer",
        bureau_id: null,
        regional_office_id: null,
        avatar_url: avatarUrl,
      };

      try {
        await supabase.from("profiles").upsert({
          id: newProfile.id,
          full_name: newProfile.full_name,
          email: newProfile.email,
          role: newProfile.role,
          bureau_id: null,
          regional_office_id: null,
        });
      } catch (upsertErr) {
        console.warn("Could not upsert OAuth profile:", upsertErr);
      }

      setProfile(newProfile);
    } else {
      setProfile(null);
    }
  }, []);

  /* bootstrap */
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      if (data.session?.user) {
        loadProfile(data.session.user.id, data.session.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession(s);
      if (s?.user) loadProfile(s.user.id, s.user);
      else setProfile(null);
    });
    return () => listener.subscription.unsubscribe();
  }, [loadProfile]);

  /* sign in with email + password */
  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  /* sign up — creates auth user + inserts profile row */
  const signUp = useCallback(async (email: string, password: string, fullName: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: fullName } },
    });
    if (error) return { error: error.message };
    if (data.user) {
      // Insert profile with default role — admin can upgrade later via dashboard
      await supabase.from("profiles").upsert({
        id: data.user.id,
        full_name: fullName,
        email: email,
        role: "pgrc_officer" as UserRole,
        bureau_id: null,
        regional_office_id: null,
      });
    }
    return { error: null };
  }, []);

  /* Google OAuth via Supabase provider */
  const signInWithGoogle = useCallback(async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/`,
        queryParams: { access_type: "offline", prompt: "consent" },
      },
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  /* sign out */
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setProfile(null);
    setSession(null);
  }, []);

  /* update profile in DB + auth metadata */
  const updateProfile = useCallback(async (updates: { full_name?: string }) => {
    if (!session?.user) return { error: "Not authenticated" };
    const { error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", session.user.id);
    if (error) return { error: error.message };
    if (updates.full_name) {
      await supabase.auth.updateUser({ data: { full_name: updates.full_name } });
    }
    await loadProfile(session.user.id, session.user);
    return { error: null };
  }, [session, loadProfile]);

  /* manually re-fetch profile */
  const refreshProfile = useCallback(async () => {
    if (session?.user) await loadProfile(session.user.id, session.user);
  }, [session, loadProfile]);

  /* role helper */
  const isRole = useCallback(
    (...roles: UserRole[]) => !!profile && roles.includes(profile.role),
    [profile]
  );

  return (
    <AuthContext.Provider value={{
      session,
      user: session?.user ?? null,
      profile,
      loading,
      signIn,
      signUp,
      signInWithGoogle,
      signOut,
      updateProfile,
      refreshProfile,
      isRole,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
