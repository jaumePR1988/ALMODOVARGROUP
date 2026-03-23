import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import type { User } from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { removePushToken } from '../utils/pushService';

export type UserRole = 'admin' | 'coach' | 'user';
export type WorkspaceGroup = 'AlmodovarBOX' | 'AlmodovarFIT' | 'VirtualBOX' | 'None';

interface UserData {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: UserRole;
  workspace: WorkspaceGroup;
  credits: number;
  limiteSemanal?: number;
  saldoExtra?: number;
  lastResetDate?: string;
  termsAccepted?: boolean;
  imageRightsAccepted?: boolean;
  photoURL?: string | null;
  pausado?: boolean;
}

interface AuthContextType {
  currentUser: User | null;
  userData: UserData | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  currentUser: null,
  userData: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribeSnapshot: (() => void) | null = null;

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        
        // Fetch or create user data in Firestore with real-time updates
        const userRef = doc(db, 'users', user.uid);
        
        unsubscribeSnapshot = onSnapshot(userRef, async (userSnap) => {
          if (userSnap.exists()) {
            const data = { uid: userSnap.id, ...userSnap.data() } as UserData;
            
            // --- Lazy Weekly Credit Reset Logic ---
            const now = new Date();
            const currentDay = now.getDay();
            let daysSinceSaturday = (currentDay + 1) % 7;
            if (currentDay === 6 && now.getHours() < 8) {
               daysSinceSaturday = 7;
            }
            const lastSaturday = new Date(now);
            lastSaturday.setDate(now.getDate() - daysSinceSaturday);
            lastSaturday.setHours(8, 0, 0, 0);

            const lastReset = data.lastResetDate ? new Date(data.lastResetDate) : new Date(0);

            if (lastReset < lastSaturday && now >= lastSaturday) {
               const newCredits = data.limiteSemanal !== undefined ? data.limiteSemanal : (data.credits || 0);
               const newResetDate = now.toISOString();
               
               await updateDoc(userRef, {
                  credits: newCredits,
                  lastResetDate: newResetDate
               });
               
               data.credits = newCredits;
               data.lastResetDate = newResetDate;
            }
            // ---------------------------------------

            setUserData(data);
          } else {
            // New user defaults to 'user' role with 0 credits
            const newUser: Partial<UserData> = {
              uid: user.uid,
              email: user.email,
              displayName: user.displayName || 'Socio',
              role: 'user',
              workspace: 'None',
              credits: 0,
              limiteSemanal: 0,
              saldoExtra: 0,
              lastResetDate: new Date().toISOString(),
              photoURL: user.photoURL || null
            };
            await setDoc(userRef, newUser, { merge: true });
            // The setDoc will trigger onSnapshot again automatically
          }
          setLoading(false);
        });
      } else {
        setCurrentUser(null);
        setUserData(null);
        setLoading(false);
        if (unsubscribeSnapshot) {
           unsubscribeSnapshot();
           unsubscribeSnapshot = null;
        }
      }
    });

    return () => {
      unsubscribeAuth();
      if (unsubscribeSnapshot) {
         unsubscribeSnapshot();
      }
    };
  }, []);

  const signOut = async () => {
    try {
      if (currentUser) {
        await removePushToken(currentUser.uid);
      }
      await firebaseSignOut(auth);
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userData, loading, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
