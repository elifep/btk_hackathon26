import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import { useAuth } from '../context/AuthContext';

export function useUserProfile() {
    const { currentUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [metrics, setMetrics] = useState(null);

    useEffect(() => {
        async function fetchProfile() {
            if (!currentUser) return;
            
            try {
                setLoading(true);
                // Fetch main user document and all sub-documents
                const userSnap = await getDoc(doc(db, 'users', currentUser.uid));
                const incomeSnap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'income'));
                const expensesSnap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'expenses'));
                const goalsSnap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'goals'));
                const prefSnap = await getDoc(doc(db, 'users', currentUser.uid, 'profile', 'preferences'));

                const userDoc = userSnap.exists() ? userSnap.data() : null;
                const income = incomeSnap.exists() ? incomeSnap.data() : null;
                const expenses = expensesSnap.exists() ? expensesSnap.data() : null;
                const goals = goalsSnap.exists() ? goalsSnap.data() : null;
                const preferences = prefSnap.exists() ? prefSnap.data() : null;

                setProfileData({ userDoc, income, expenses, goals, preferences });

                // Calculate Metrics
                if (income && expenses) {
                    // 1. Calculate Monthly Income
                    let primary = parseFloat(income.primaryIncome || 0);
                    let side = parseFloat(income.sideIncome || 0);
                    let baseIncome = primary + side;
                    
                    let monthlyIncome = baseIncome;
                    if (income.frequency === 'weekly') monthlyIncome = baseIncome * 4.33;
                    if (income.frequency === 'biweekly') monthlyIncome = baseIncome * 2.16;

                    // 2. Calculate Monthly Expenses
                    const fixedExpenses = 
                        parseFloat(expenses.rent || 0) + 
                        parseFloat(expenses.utilities || 0) + 
                        parseFloat(expenses.debt || 0) + 
                        parseFloat(expenses.insurance || 0) + 
                        parseFloat(expenses.subscriptions || 0);
                        
                    const customExpenses = (expenses.customCategories || []).reduce((acc, curr) => acc + parseFloat(curr.amount || 0), 0);
                    const monthlyExpenses = fixedExpenses + customExpenses;

                    // 3. Free Budget
                    const freeBudget = monthlyIncome - monthlyExpenses;

                    // 4. Spending Health (Simple: 100 - (Expenses/Income)*100)
                    let healthScore = 100;
                    if (monthlyIncome > 0) {
                        const ratio = (monthlyExpenses / monthlyIncome) * 100;
                        healthScore = Math.max(0, Math.min(100, Math.round(100 - ratio)));
                    }

                    setMetrics({
                        monthlyIncome,
                        monthlyExpenses,
                        freeBudget,
                        healthScore,
                        currency: income.currency || 'USD'
                    });
                }

            } catch (err) {
                console.error("Error fetching profile data:", err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        }

        fetchProfile();
    }, [currentUser]);

    return { profileData, metrics, loading, error };
}
