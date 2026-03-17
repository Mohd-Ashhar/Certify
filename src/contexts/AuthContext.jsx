import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ROLES } from '../utils/roles';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // ---------------------------------------------------
  // Initialize Session
  // ---------------------------------------------------
  useEffect(() => {
    let mounted = true;

    // Safety timeout to prevent infinite loading
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false);
    }, 3000);

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        
        const currentSession = data.session;
        if (mounted) setSession(currentSession);

        if (currentSession?.user) {
          const currentUser = currentSession.user;

          const { data: profile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", currentUser.id)
            .maybeSingle();

          if (profile) {
            console.log("Profile found");
            if (mounted) setUser({ ...currentUser, ...profile });
          } else {
            console.log("Creating profile");

            await supabase.from("profiles").insert({
              id: currentUser.id,
              email: currentUser.email,
              role: "super_admin"
            });

            if (mounted) setUser({ ...currentUser, role: "super_admin" });
          }
        }
      } catch (err) {
        console.error("Auth error", err);
      } finally {
        if (mounted) {
          setLoading(false); // VERY IMPORTANT
        }
      }
    };

    init();

    return () => {
      mounted = false;
      clearTimeout(timeout);
    };
  }, []);

  // ---------------------------------------------------
  // Auth actions
  // ---------------------------------------------------

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  const signup = async ({
    name, email, password,
    company_name, activity, number_of_employees,
    number_of_locations, website, city, country,
    contact_number, certification_types,
  }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: ROLES.CLIENT,
          company_name,
          activity,
          number_of_employees: number_of_employees || null,
          number_of_locations: number_of_locations || null,
          website: website || null,
          city,
          country,
          contact_number,
          certification_types: certification_types || [],
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    localStorage.clear();
    sessionStorage.clear();
    window.location.href = '/login';
  };

  const resetPassword = async (email) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const updatePassword = async (newPassword) => {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const getRoleDashboard = (role) => {
    const map = {
      [ROLES.SUPER_ADMIN]: '/admin/dashboard',
      [ROLES.REGIONAL_ADMIN]: '/admin/dashboard',
      [ROLES.AUDITOR]: '/auditor/dashboard',
      [ROLES.CERTIFICATION_BODY]: '/cert-body/dashboard',
      [ROLES.CLIENT]: '/client/dashboard',
    };
    return map[role] || '/dashboard';
  };

  // ---------------------------------------------------
  // Context value
  // ---------------------------------------------------
  const value = {
    user,
    session,
    loading,
    isAuthenticated: !!session,
    login,
    signup,
    logout,
    resetPassword,
    updatePassword,
    getRoleDashboard,
    supabase,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
