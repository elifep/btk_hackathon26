import { GoogleGenerativeAI } from "@google/generative-ai";
import { db } from '../config/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';

const API_KEY = import.meta.env.VITE_GEMINI_API_KEY;

// Initialize the Gemini client. We create this lazily or handle missing keys gracefully.
const getGenAI = () => {
    if (!API_KEY) {
        throw new Error("Gemini API Key is missing.");
    }
    return new GoogleGenerativeAI(API_KEY);
};

function applyDeterministicAnalysisRules(analysis, purchaseData, totalIncome, fixedExpenses, preferences, language) {
    const categoryScores = {
        'Electronics': 5,
        'Education': 8,
        'Software & Subscriptions': 7,
        'Home & Living': 5,
        'Travel': 4,
        'Fashion': 3,
        'Furniture': 4,
        'Gifts': 3
    };
    
    let baseScore = categoryScores[purchaseData.category] || 5;

    let freeBudget = totalIncome - fixedExpenses;
    if (freeBudget <= 0) freeBudget = 1; // avoid division by zero
    
    let isSubscription = purchaseData.category === 'Software & Subscriptions';
    let monthlyEquivalent = isSubscription ? parseFloat(purchaseData.price) : parseFloat(purchaseData.price) / 12;
    let ratio = monthlyEquivalent / freeBudget;

    let budgetAdj = 0;
    if (ratio <= 0.2) budgetAdj = 2;
    else if (ratio <= 0.5) budgetAdj = 1;
    else if (ratio <= 1.0) budgetAdj = -1;
    else budgetAdj = -2;

    let riskAdj = 0;
    let riskProfile = (preferences?.riskProfile || 'balanced').toLowerCase();
    if (riskProfile === 'conservative') riskAdj = -1;
    else if (riskProfile === 'aggressive') riskAdj = 1;

    let necessityScore = baseScore + budgetAdj + riskAdj;
    necessityScore = Math.max(1, Math.min(10, necessityScore));
    analysis.necessityScore = necessityScore;
    
    let confidenceScore = analysis.confidenceScore || 85;
    
    let verdict = 'Avoid';
    if (confidenceScore >= 85 && necessityScore >= 7) verdict = 'Buy';
    else if (confidenceScore >= 70 && necessityScore >= 5) verdict = 'Consider';
    else if (confidenceScore >= 40) verdict = 'Wait';

    if (language === 'tr') {
        if (verdict === 'Buy') verdict = 'Satın Al';
        else if (verdict === 'Consider') verdict = 'Değerlendir';
        else if (verdict === 'Wait') verdict = 'Bekle';
        else if (verdict === 'Avoid') verdict = 'Kaçın';
    }
    analysis.recommendation = verdict;
    analysis.isSubscription = isSubscription;

    let formattedPrice = new Intl.NumberFormat(language === 'tr' ? 'tr-TR' : 'en-US', { 
        style: 'currency', 
        currency: purchaseData.currency || 'USD',
        maximumFractionDigits: 2
    }).format(monthlyEquivalent);

    if (isSubscription) {
        analysis.monthlyBurden = formattedPrice + (language === 'tr' ? ' / ay' : ' /mo');
    } else {
        analysis.monthlyBurden = formattedPrice + (language === 'tr' ? ' / ay (12 aylık eşdeğer)' : ' /mo (12-month equivalent)');
    }

    return analysis;
}

function getDeterministicMockAnalysis(purchaseData) {
    const price = parseFloat(purchaseData.price);

    return {
        confidenceScore: 85,
        budgetImpact: "Moderate impact on your free cash flow.",
        goalDelay: "Could delay your secondary goals by 1-2 weeks.",
        opportunityCost: `Investing this could yield ~5% annually.`,
        smartAlternative: "Consider refurbished or waiting for upcoming seasonal sales.",
        aiCoachingInsight: `This ${purchaseData.category || 'discretionary'} purchase should be carefully evaluated. Sleep on it for 48 hours to prevent impulse buying.`,
        savingsRateImpact: "-3.5% this month"
    };
}

/**
 * Analyzes a potential purchase using Gemini and user profile context.
 * Structured for future migration to Firebase Functions (backend).
 * 
 * @param {Object} purchaseData - Details of the purchase (name, price, currency, category)
 * @param {Object} profileData - User's Firestore profile data
 * @param {string} uid - User's Firebase Auth UID
 * @param {string} language - Interface language to enforce
 * @returns {Promise<Object>} The structured JSON analysis from Gemini
 */
export async function analyzePurchase(purchaseData, profileData, uid, language = 'en') {
    const currency = profileData?.income?.currency || 'USD';
    const income = profileData?.income || {};
    const expenses = profileData?.expenses || {};
    const preferences = profileData?.preferences || {};

    const totalIncome = parseFloat(income.primaryIncome || 0) + parseFloat(income.sideIncome || 0);
    const fixedExpenses = parseFloat(expenses.rent || 0) + parseFloat(expenses.utilities || 0) + parseFloat(expenses.debt || 0);

    let genAI;
    let missingKeyError = null;

    try {
        genAI = getGenAI();
    } catch (e) {
        missingKeyError = e;
    }

    let lastError = missingKeyError;

    if (!missingKeyError) {
        const generationConfig = {
            responseMimeType: "application/json",
            responseSchema: {
                type: "object",
                properties: {
                    confidenceScore: { type: "number", description: "0 to 100 confidence score" },
                    budgetImpact: { type: "string", description: "Short description of impact on monthly budget" },
                    goalDelay: { type: "string", description: "How this affects their active goals" },
                    opportunityCost: { type: "string", description: "What else they could do with this money" },
                    smartAlternative: { type: "string", description: "A cheaper or better alternative suggestion" },
                    aiCoachingInsight: { type: "string", description: "A personalized coaching tip" },
                    savingsRateImpact: { type: "string", description: "Impact on their savings rate" }
                },
                required: [
                    "confidenceScore", "budgetImpact", "goalDelay", 
                    "opportunityCost", "smartAlternative", "aiCoachingInsight", 
                    "savingsRateImpact"
                ]
            }
        };

        const prompt = `
            Analyze this purchase and return strict JSON matching the schema.
            User:
            - Income: ${totalIncome} ${currency}/mo
            - Expenses: ${fixedExpenses} ${currency}/mo
            - Risk Profile: ${preferences.riskProfile || 'Moderate'}
            
            Purchase:
            - Product: ${purchaseData.name}
            - Price: ${purchaseData.price} ${purchaseData.currency}
            
            Return all explanation values in the selected language. Current language: ${language}. Never return English text when language is Turkish. Return JSON only.
        `;

        const modelsToTry = [
            "gemini-2.5-flash-lite",
            "gemini-2.0-flash-lite",
            "gemini-1.5-flash"
        ];

        for (const modelName of modelsToTry) {
            try {
                console.log(`Trying Gemini Model: ${modelName}`);
                const model = genAI.getGenerativeModel({ model: modelName, generationConfig });
                
                const result = await model.generateContent(prompt);
                const analysisText = result.response.text();
                
                console.log(`Gemini (${modelName}) Raw Response:`, analysisText);
                
                let analysis = JSON.parse(analysisText);
                
                analysis = applyDeterministicAnalysisRules(analysis, purchaseData, totalIncome, fixedExpenses, preferences, language);
                
                analysis.source = "gemini";
                analysis.modelUsed = modelName;

                const analysesRef = collection(db, 'users', uid, 'ai', 'data', 'analyses');
                await addDoc(analysesRef, {
                    purchaseData,
                    analysis,
                    currency,
                    source: "gemini",
                    modelUsed: modelName,
                    createdAt: serverTimestamp()
                });

                return analysis;
            } catch (apiError) {
                console.warn(`Gemini API Error with model ${modelName}:`, apiError.message);
                lastError = apiError;
                // Move on to the next model in the fallback chain
            }
        }
    }

    // Fallback emergency mode if missing API key or all models fail
    console.warn("All real models failed or key is missing. Using emergency fallback. Last error:", lastError?.message);
    let mockAnalysis = getDeterministicMockAnalysis(purchaseData);
    mockAnalysis = applyDeterministicAnalysisRules(mockAnalysis, purchaseData, totalIncome, fixedExpenses, preferences, language);
    mockAnalysis.source = "mock_fallback";
    
    try {
        const analysesRef = collection(db, 'users', uid, 'ai', 'data', 'analyses');
        await addDoc(analysesRef, {
            purchaseData,
            analysis: mockAnalysis,
            currency,
            source: "mock_fallback",
            errorReason: lastError?.message || "All models failed",
            createdAt: serverTimestamp()
        });
    } catch (dbError) {
        console.error("Failed to save mock analysis to DB:", dbError);
    }
    
    return mockAnalysis;
}

