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

        // For OAuth users (e.g. Google), ensure profile has role and approval_status
        if (profile && !profile.role && sessionUser.app_metadata?.provider === 'google') {
          const meta = sessionUser.user_metadata || {};
          await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: sessionUser.id,
              full_name: meta.full_name || meta.name || '',
              role: 'client',
              company_name: null,
              region: null,
              stakeholder_type: 'client',
              approval_status: 'approved',
            }),
          });
          // Re-fetch profile after update
          const { data: updatedProfile } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", sessionUser.id)
            .maybeSingle();
          if (updatedProfile && mounted) {
            setUser({ ...sessionUser, ...updatedProfile });
          } else if (mounted) {
            setUser(sessionUser);
          }
        } else if (profile && mounted) {
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

  const signInWithGoogle = async (redirectPath = '/auth/callback') => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}${redirectPath}`,
      },
    });

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  };

  const login = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { success: false, error: error.message };
    }

    // Check approval_status from profile before allowing login
    if (data?.user) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('approval_status')
        .eq('id', data.user.id)
        .maybeSingle();

      if (profile?.approval_status === 'pending') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Your registration is pending approval. A CertifyCX administrator will review and verify your account shortly.',
        };
      }

      if (profile?.approval_status === 'rejected') {
        await supabase.auth.signOut();
        return {
          success: false,
          error: 'Your registration has been declined. Please contact support at mvpcertify@gmail.com for more information.',
        };
      }
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
    // Stakeholder registrations (via shareable links / landing page) require admin approval
    const needsApproval = !!stakeholder_type && stakeholder_type !== 'client';
    const approvalStatus = needsApproval ? 'pending' : 'approved';

    // Route signup through the service-role API so the auth user is created
    // with email_confirm: true — otherwise Supabase marks the user as
    // unconfirmed and login returns "Invalid login credentials".
    const signupRes = await fetch('/api/public-signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email, password, name, role: assignedRole,
        company_name, activity,
        number_of_employees, number_of_locations, website,
        city, country, region, contact_number, contact_role,
        stakeholder_type: stakeholder_type || 'client',
        approval_status: approvalStatus,
      }),
    });
    const signupJson = await signupRes.json().catch(() => ({}));

    if (!signupRes.ok || !signupJson.success) {
      return { success: false, error: signupJson.error || 'Signup failed' };
    }

    const createdUser = signupJson.user;

    // For non-approval-required flows, sign the user in right away so the
    // existing "navigate to dashboard" UX works.
    let signInData = null;
    if (!needsApproval) {
      const { data: sData, error: sErr } = await supabase.auth.signInWithPassword({ email, password });
      if (sErr) {
        return { success: false, error: sErr.message };
      }
      signInData = sData;
    }

    // Record referral if user signed up via a referral link (non-blocking)
    if (referral_code && createdUser?.id) {
      fetch('/api/record-referral', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          referralCode: referral_code,
          referredId: createdUser.id,
          referredEmail: email,
        }),
      }).catch(() => {});
    }

    return { success: true, data: signInData || { user: createdUser }, needsApproval };
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
    signInWithGoogle,
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
