import { createContext, useContext, useState } from "react";
import type { ReactNode } from "react";
import { calculateStrategy } from "../utils/strategy";
import type { StudentProfile, StrategyResult } from "../utils/strategy";


// --------------------
// Context Shape
// --------------------
interface ProfileContextType {
  profile: StudentProfile | null;
  strategy: StrategyResult | null;
  setProfileAndCompute: (profile: StudentProfile) => void;
}

// --------------------
// Create context
// --------------------
const ProfileContext = createContext<ProfileContextType | undefined>(
  undefined
);

// --------------------
// Provider component
// --------------------
export const ProfileProvider = ({ children }: { children: ReactNode }) => {
  const [profile, setProfile] = useState<StudentProfile | null>(null);
  const [strategy, setStrategy] = useState<StrategyResult | null>(null);

  const setProfileAndCompute = (p: StudentProfile) => {
    setProfile(p);
    setStrategy(calculateStrategy(p));
  };

  return (
    <ProfileContext.Provider value={{ profile, strategy, setProfileAndCompute }}>
      {children}
    </ProfileContext.Provider>
  );
};

// --------------------
// Hook to use profile
// --------------------
export const useProfile = () => {
  const ctx = useContext(ProfileContext);

  if (!ctx) {
    throw new Error("useProfile must be used inside ProfileProvider");
  }

  return ctx;
};
