import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ROLES, getRegionFromCountry } from '../utils/roles';

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

    // Helper to fetch profile
    const fetchProfile = async (sessionUser) => {
      try {
        const { data: profile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", sessionUser.id)
          .maybeSingle();

        if (profile && mounted) {
          setUser({ ...sessionUser, ...profile });
        } else if (mounted) {
          setUser(sessionUser); // Fallback if no profile yet
        }
      } catch (err) {
        console.error("Profile fetch error", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    // 1. Initial Session Check
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      if (mounted) setSession(currentSession);
      if (currentSession?.user) {
        fetchProfile(currentSession.user);
      } else {
        if (mounted) setLoading(false);
      }
    });

    // 2. Auth State Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, currentSession) => {
        if (mounted) setSession(currentSession);
        if (currentSession?.user) {
          // If a new session comes in, ensure we are loading while fetching the profile
          if (mounted) setLoading(true);
          fetchProfile(currentSession.user);
        } else {
          if (mounted) {
            setUser(null);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
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
    contact_number, contact_role, certification_types,
    referral_code, role, stakeholder_type,
  }) => {
    const region = getRegionFromCountry(country);
    const assignedRole = role || ROLES.CLIENT;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role: assignedRole,
          company_name,
          activity,
          number_of_employees: number_of_employees || null,
          number_of_locations: number_of_locations || null,
          website: website || null,
          city,
          country,
          region,
          contact_number,
          contact_role: contact_role || null,
          certification_types: certification_types || [],
          stakeholder_type: stakeholder_type || 'client',
        },
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Update profile with full details via API (bypasses RLS timing issues)
    if (data?.user) {
      await fetch('/api/update-profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: data.user.id,
          full_name: name,
          role: assignedRole,
          company_name: company_name || null,
          region,
          stakeholder_type: stakeholder_type || 'client',
        }),
      });

      // Record referral if user signed up via a referral link
      if (referral_code) {
        await fetch('/api/record-referral', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            referralCode: referral_code,
            referredId: data.user.id,
            referredEmail: email,
          }),
        }).catch(() => {}); // non-blocking
      }
    }

    return { success: true, data };
  };

  const logout = async () => {
    await supabase.auth.signOut();
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
