/* eslint-disable react-refresh/only-export-components */
import {
  GoogleAuthProvider,
  RecaptchaVerifier,
  onAuthStateChanged,
  signInWithPhoneNumber,
  signInWithPopup,
  signOut,
  type ConfirmationResult,
  type User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { authClient, firebaseConfigured } from "../services/firebaseClient";

export type AuthUser = {
  uid: string;
  email: string | null;
  phoneNumber: string | null;
  displayName: string | null;
  isLocalSession?: boolean;
};

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  firebaseReady: boolean;
  signInWithGoogle: () => Promise<void>;
  sendPhoneOtp: (phoneE164: string, recaptchaContainerId: string) => Promise<void>;
  verifyPhoneOtp: (code: string) => Promise<void>;
  continueLocalSession: () => void;
  logout: () => Promise<void>;
};

const LOCAL_AUTH_KEY = "lazytopper.auth.local.v1";
const AuthContext = createContext<AuthContextType | undefined>(undefined);

function toAuthUser(user: User): AuthUser {
  return {
    uid: user.uid,
    email: user.email,
    phoneNumber: user.phoneNumber,
    displayName: user.displayName,
  };
}

function readLocalSession(): AuthUser | null {
  try {
    const raw = window.localStorage.getItem(LOCAL_AUTH_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed || typeof parsed.uid !== "string") return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeLocalSession(user: AuthUser | null): void {
  try {
    if (!user) {
      window.localStorage.removeItem(LOCAL_AUTH_KEY);
      return;
    }
    window.localStorage.setItem(LOCAL_AUTH_KEY, JSON.stringify(user));
  } catch {
    // ignore local write failures
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    if (firebaseConfigured) return null;
    return readLocalSession();
  });
  const [loading, setLoading] = useState<boolean>(firebaseConfigured);
  const confirmationRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!firebaseConfigured || !authClient) return;
    const unsubscribe = onAuthStateChanged(authClient, (next) => {
      setUser(next ? toAuthUser(next) : null);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  const signInWithGoogleHandler = async () => {
    if (!firebaseConfigured || !authClient) {
      throw new Error("Firebase is not configured.");
    }
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: "select_account" });
    await signInWithPopup(authClient, provider);
  };

  const sendPhoneOtpHandler = async (phoneE164: string, recaptchaContainerId: string) => {
    if (!firebaseConfigured || !authClient) {
      throw new Error("Firebase is not configured.");
    }

    const existing = recaptchaRef.current;
    if (existing) {
      existing.clear();
      recaptchaRef.current = null;
    }

    const verifier = new RecaptchaVerifier(authClient, recaptchaContainerId, {
      size: "normal",
    });
    recaptchaRef.current = verifier;
    confirmationRef.current = await signInWithPhoneNumber(authClient, phoneE164, verifier);
  };

  const verifyPhoneOtpHandler = async (code: string) => {
    const confirmation = confirmationRef.current;
    if (!confirmation) {
      throw new Error("OTP session not found. Send OTP first.");
    }
    await confirmation.confirm(code);
    confirmationRef.current = null;
  };

  const continueLocalSession = () => {
    const localUser: AuthUser = {
      uid: "local-dev-user",
      email: null,
      phoneNumber: null,
      displayName: "Local Student",
      isLocalSession: true,
    };
    setUser(localUser);
    writeLocalSession(localUser);
  };

  const logoutHandler = async () => {
    if (!firebaseConfigured || !authClient) {
      writeLocalSession(null);
      setUser(null);
      return;
    }
    await signOut(authClient);
  };

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      loading,
      firebaseReady: firebaseConfigured,
      signInWithGoogle: signInWithGoogleHandler,
      sendPhoneOtp: sendPhoneOtpHandler,
      verifyPhoneOtp: verifyPhoneOtpHandler,
      continueLocalSession,
      logout: logoutHandler,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}
