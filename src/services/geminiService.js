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

function getDeterministicMockAnalysis(purchaseData) {
    const price = parseFloat(purchaseData.price);
    let recommendation = "Wait";
    if (price > 50000) recommendation = "Avoid";
    else if (price < 15000) recommendation = "Buy";

    return {
        recommendation,
        confidenceScore: 85,
        budgetImpact: "Moderate impact on your free cash flow.",
        goalDelay: "Could delay your secondary goals by 1-2 weeks.",
        opportunityCost: `Investing this could yield ~5% annually.`,
        smartAlternative: "Consider refurbished or waiting for upcoming seasonal sales.",
        aiCoachingInsight: `This ${purchaseData.category || 'discretionary'} purchase should be carefully evaluated. Sleep on it for 48 hours to prevent impulse buying.`,
        necessityScore: 4,
        monthlyBurden: price > 20000 ? `${(price / 12).toFixed(2)} /mo if financed` : "None (One-time payment)",
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
 * @returns {Promise<Object>} The structured JSON analysis from Gemini
 */
export async function analyzePurchase(purchaseData, profileData, uid) {
    const currency = profileData.income?.currency || 'USD';
    const income = profileData.income || {};
    const expenses = profileData.expenses || {};
    const preferences = profileData.preferences || {};

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
                    recommendation: { type: "string", enum: ["Buy", "Wait", "Avoid"] },
                    confidenceScore: { type: "number", description: "0 to 100 confidence score" },
                    budgetImpact: { type: "string", description: "Short description of impact on monthly budget" },
                    goalDelay: { type: "string", description: "How this affects their active goals" },
                    opportunityCost: { type: "string", description: "What else they could do with this money" },
                    smartAlternative: { type: "string", description: "A cheaper or better alternative suggestion" },
                    aiCoachingInsight: { type: "string", description: "A personalized coaching tip" },
                    necessityScore: { type: "number", description: "1 to 10 score of how necessary this is" },
                    monthlyBurden: { type: "string", description: "If financed or recurrent, what is the monthly burden" },
                    savingsRateImpact: { type: "string", description: "Impact on their savings rate" }
                },
                required: [
                    "recommendation", "confidenceScore", "budgetImpact", "goalDelay", 
                    "opportunityCost", "smartAlternative", "aiCoachingInsight", 
                    "necessityScore", "monthlyBurden", "savingsRateImpact"
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
                
                const analysis = JSON.parse(analysisText);
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
    const mockAnalysis = getDeterministicMockAnalysis(purchaseData);
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
