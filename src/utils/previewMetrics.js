import { formatCurrency } from './currency';

export function calculatePreviewMetrics(product, profileData, lang = 'en') {
    const income = profileData?.income || {};
    const expenses = profileData?.expenses || {};
    const preferences = profileData?.preferences || {};

    const totalIncome = parseFloat(income.primaryIncome || 0) + parseFloat(income.sideIncome || 0);
    const fixedExpenses = parseFloat(expenses.rent || 0) + parseFloat(expenses.utilities || 0) + parseFloat(expenses.debt || 0);
    
    // Safe fallback if free budget is negative or zero
    let monthlyFreeBudget = totalIncome - fixedExpenses;
    if (monthlyFreeBudget <= 0) monthlyFreeBudget = 1;

    // Simple heuristic: 12 months financing assumption for expensive items, else 1 month
    const months = product.price > 500 ? 12 : 1;
    const estimatedMonthlyCost = product.price / months;
    
    const compatibilityRatio = estimatedMonthlyCost / monthlyFreeBudget;

    let baseScore = 100 - (compatibilityRatio * 200); // 50% of free budget = 0 score
    
    // Adjust by risk profile
    const riskProfile = preferences.riskProfile || 'Moderate';
    if (riskProfile === 'Conservative') baseScore -= 10;
    if (riskProfile === 'Aggressive') baseScore += 10;
    
    // Discretionary/Expensive penalty
    if (product.price > 10000 && !['Education', 'Home & Living'].includes(product.category)) {
        baseScore -= 15;
    }

    baseScore = Math.max(0, Math.min(100, Math.round(baseScore)));

    let quickPreview = "Evaluate this purchase carefully.";
    if (lang === 'tr') {
        if (baseScore >= 80) quickPreview = "Tahmini bütçenizle oldukça uyumlu görünüyor.";
        else if (baseScore >= 50) quickPreview = "Aylık serbest nakit akışınız üzerinde orta düzeyde etki.";
        else quickPreview = "Yüksek bütçe baskısı. Beklemeniz veya biriktirmeniz önerilir.";
    } else {
        if (baseScore >= 80) quickPreview = "Looks well within your estimated budget.";
        else if (baseScore >= 50) quickPreview = "Moderate impact on your monthly free cash flow.";
        else quickPreview = "High budget impact. Waiting or saving up is recommended.";
    }

    const monthlyCostEstimate = lang === 'tr'
        ? `${formatCurrency(estimatedMonthlyCost, product.currency)}/ay (${months} ay)`
        : `${formatCurrency(estimatedMonthlyCost, product.currency)}/mo (${months} mos)`;

    // Format estimated impact based on whether the product currency matches user currency
    // If we had an exchange rate we'd use it, but for now just show product currency
    return {
        estimatedCompatibility: `${Math.max(0, Math.min(100, Math.round(100 - (compatibilityRatio * 100))))}%`,
        estimatedImpact: `-${formatCurrency(product.price, product.currency)}`,
        monthlyCostEstimate,
        previewScore: baseScore,
        quickPreview
    };
}
