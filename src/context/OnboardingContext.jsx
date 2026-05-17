import React, { createContext, useContext, useState } from 'react';
import { doc, setDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from './AuthContext';

const OnboardingContext = createContext();

export function useOnboarding() {
    return useContext(OnboardingContext);
}

export function OnboardingProvider({ children }) {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [onboardingData, setOnboardingData] = useState({
        income: {
            currency: 'USD',
            frequency: 'monthly',
            primaryIncome: '',
            sideIncome: ''
        },
        expenses: {
            rent: '',
            utilities: '',
            debt: '',
            insurance: '',
            subscriptions: '',
            customCategories: []
        },
        goals: {
            emergencyFund: '',
            travel: '',
            car: '',
            house: '',
            debtPayoff: '',
            customGoals: []
        },
        risk: {
            personality: 'balanced' // conservative, balanced, aggressive
        },
        tracking: {
            method: 'manual' // manual, future_sync
        }
    });

    const updateIncome = (data) => setOnboardingData(prev => ({ ...prev, income: { ...prev.income, ...data } }));
    const updateExpenses = (data) => setOnboardingData(prev => ({ ...prev, expenses: { ...prev.expenses, ...data } }));
    const updateGoals = (data) => setOnboardingData(prev => ({ ...prev, goals: { ...prev.goals, ...data } }));
    const updateRisk = (data) => setOnboardingData(prev => ({ ...prev, risk: { ...prev.risk, ...data } }));
    const updateTracking = (data) => setOnboardingData(prev => ({ ...prev, tracking: { ...prev.tracking, ...data } }));

    const finalizeOnboarding = async () => {
        if (!currentUser) throw new Error("No user authenticated");
        setLoading(true);
        setError(null);
        
        try {
            const userRef = doc(db, 'users', currentUser.uid);
            
            // In a real robust system we'd use batch writes, but for standard user profiles:
            await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'income'), onboardingData.income);
            await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'expenses'), onboardingData.expenses);
            await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'goals'), onboardingData.goals);
            await setDoc(doc(db, 'users', currentUser.uid, 'profile', 'preferences'), {
                risk: onboardingData.risk.personality,
                tracking: onboardingData.tracking.method
            });
            
            // Mark onboarding as complete
            await updateDoc(userRef, {
                onboardingCompleted: true
            });
            
            return true;
        } catch (err) {
            console.error("Failed to save onboarding data:", err);
            setError(err.message);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const value = {
        onboardingData,
        updateIncome,
        updateExpenses,
        updateGoals,
        updateRisk,
        updateTracking,
        finalizeOnboarding,
        loading,
        error
    };

    return (
        <OnboardingContext.Provider value={value}>
            {children}
        </OnboardingContext.Provider>
    );
}
