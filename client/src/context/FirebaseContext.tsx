import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { 
  collection, 
  onSnapshot, 
  CollectionReference
} from 'firebase/firestore';
import { Location, Lot, Unit, Transaction } from '../types';

interface FirebaseContextType {
  user: User | null;
  loading: boolean;
  locations: Location[];
  lots: Lot[];
  units: Unit[];
  transactions: Transaction[];
  userId: string | null;
}

const FirebaseContext = createContext<FirebaseContextType | undefined>(undefined);

export const useFirebase = () => {
  const context = useContext(FirebaseContext);
  if (!context) {
    throw new Error('useFirebase must be used within a FirebaseProvider');
  }
  return context;
};

export const FirebaseProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [locations, setLocations] = useState<Location[]>([]);
  const [lots, setLots] = useState<Lot[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        setLoading(false);
      } else {
        try {
          await signInAnonymously(auth);
        } catch (error) {
          console.error('Authentication error:', error);
          setLoading(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Listen to Firestore collections
  useEffect(() => {
    if (!user) return;

    const locationsRef = collection(db, 'locations') as CollectionReference<Location>;
    const lotsRef = collection(db, 'lots') as CollectionReference<Lot>;
    const unitsRef = collection(db, 'units') as CollectionReference<Unit>;
    const transactionsRef = collection(db, 'transactions') as CollectionReference<Transaction>;

    const unsubLocations = onSnapshot(locationsRef, (snapshot) => {
      const data: Location[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      setLocations(data);
    });

    const unsubLots = onSnapshot(lotsRef, (snapshot) => {
      const data: Lot[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      setLots(data);
    });

    const unsubUnits = onSnapshot(unitsRef, (snapshot) => {
      const data: Unit[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      setUnits(data);
    });

    const unsubTransactions = onSnapshot(transactionsRef, (snapshot) => {
      const data: Transaction[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      setTransactions(data);
    });

    return () => {
      unsubLocations();
      unsubLots();
      unsubUnits();
      unsubTransactions();
    };
  }, [user]);

  const value: FirebaseContextType = {
    user,
    loading,
    locations,
    lots,
    units,
    transactions,
    userId: user?.uid || null
  };

  return (
    <FirebaseContext.Provider value={value}>
      {children}
    </FirebaseContext.Provider>
  );
};

