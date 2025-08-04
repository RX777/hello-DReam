/**
 * @file ReportGenerator.gs
 * @description 報告生成模組 - 專家系統版 v2.0 (含進階策略系統)
 * 負責調度、組裝並生成所有前端報告區塊的 HTML 內容。
 */

/**
 * @description 報告生成調度中心：組裝所有報告區塊。
 * @param {object} financials - 財務數據物件。
 * @param {object} scores - 六大維度分數物件。
 * @param {string} personaId - 已計算出的使用者人格ID。
 * @param {object} formData - 來自前端的原始表單數據。
 * @returns {object} 包含所有報告區塊 HTML 的物件。
 */
function generateTextReports(financials, scores, personaId, formData) {
    return {
        snapshot: createFinancialSnapshot(financials),
        macro: createMacroPerspective(financials),
        warnings: createRiskWarnings(financials, scores),
        summary: createSummary(personaId),
        swot: createSwotAnalysis(scores, personaId),
        plan: createActionPlan(personaId, scores, financials, formData),
        recommendations: createRecommendations(personaId),
        personalityExplanation: createPersonalityExplanation(personaId),
        weightsExplanation: createWeightsExplanation(scores),
        disclaimer: createDisclaimer(),
    };
}

// --- 各區塊內容生成器 (Section Generators) ---

function createFinancialSnapshot(financials) {
    const formatCurrency = (num) => `NT$ ${Math.round(num).toLocaleString()}`;
    return `
      <h3 class="text-lg font-semibold text-gray-800 mb-2">您的財務快照</h3>
      <div class="grid grid-cols-2 gap-4 text-sm">
        <div><span class="text-gray-500">總收入:</span> <span class="font-medium text-green-600">${formatCurrency(financials.totalIncome)}</span></div>
        <div><span class="text-gray-500">總支出:</span> <span class="font-medium text-red-600">${formatCurrency(financials.totalExpenses)}</span></div>
        <div><span class="text-gray-500">可動用頭期款:</span> <span class="font-medium">${formatCurrency(financials.availableDownpayment)}</span></div>
        <div><span class="text-gray-500">總負債比 (DTI):</span> <span class="font-medium">${financials.dti.toFixed(1)}%</span></div>
      </div>`;
}

function createMacroPerspective(financials) {
    const formatCurrency = (num) => `NT$ ${Math.round(num).toLocaleString()}`;
    return `
      <h3 class="text-lg font-semibold text-gray-800 mb-2">宏觀分析與學習資源</h3>
      <p class="text-sm text-gray-600 mb-2">您的購屋目標總價為 ${formatCurrency(financials.houseGoalPrice)}，預計需要準備頭期款約 ${formatCurrency(financials.requiredDownpayment)}。</p>
      <p class="text-sm text-gray-600"><b>常見投資詐騙風險提示：</b>請警惕任何保證高獲利、要求匯款至個人帳戶的投資機會。守護資產的第一步，是提升自己的財商認知。</p>`;
}

function createRiskWarnings(financials, scores) {
    let warnings = [];
    if (financials.dti > 70) warnings.push('<li>您的負債比已達危險區間，建議立即進行債務健檢。</li>');
    else if (financials.dti > 50) warnings.push('<li>您的負債比偏高，建議優先處理高利率債務。</li>');
    if (financials.monthlyCashflow < financials.totalIncome * 0.1 && financials.dti > 40) warnings.push('<li>您的淨現金流比例過低，財務緩衝空間嚴重不足。</li>');
    if (scores.market < 50) warnings.push('<li>您對市場的理解有待加強，建議可以從學習全面的買房知識與技能輔以教練陪跑以增進買房的安全係數。</li>');
    
    if (warnings.length === 0) {
        return `<h3 class="text-lg font-semibold text-gray-800 mb-2">風險警示錄</h3><p class="text-sm text-green-700">目前您的財務風險控制得不錯！</p>`;
    }
    return `<h3 class="text-lg font-semibold text-red-800 mb-2">知識卷軸：風險警示錄</h3><ul class="list-disc list-inside text-sm text-red-700 space-y-1">${warnings.join('')}</ul>`;
}

function createSummary(personaId) {
    const persona = PERSONA_CONTENT_LIBRARY[personaId] || PERSONA_CONTENT_LIBRARY['DEFAULT'];
    return `<div class="p-4 bg-blue-50 rounded-lg mb-6 pdf-no-break"><h3 class="font-semibold text-blue-800">最終診斷：您的買房人格</h3><p class="mt-1 text-blue-700">【${persona.name}】</p><p class="text-sm mt-2">${persona.description}</p></div>`;
}

function createSwotAnalysis(scores, personaId) {
    const personaContent = PERSONA_CONTENT_LIBRARY[personaId] || PERSONA_CONTENT_LIBRARY['DEFAULT'];
    
    let strengths = personaContent.strengths.slice(0, 1);
    if (scores.credit > 80) strengths.push('<li>信用條件極佳，是申請貸款的利器。</li>');
    if (scores.cashflow > 80) strengths.push('<li>每月現金流充裕，還款能力強。</li>');

    let weaknesses = personaContent.weaknesses.slice(0, 1);
    if (scores.downpayment < 50) weaknesses.push('<li>自備款相對不足，選擇範圍受限。</li>');
    if (scores.market < 50) weaknesses.push('<li>市場洞察力尚待加強，可能錯失良機或誤判情勢。</li>');
    
    let opportunities = ['<li>可研究優惠貸款方案以利降低買房的難度。</li>'];
    if (scores.support > 80) opportunities.push('<li>擁有家庭支援系統，是縮短購屋時程的關鍵機會。</li>');

    let threats = ['<li>未來市場的升息循環，將增加您的房貸月付金壓力。</li>', '<li>房市政策變動（如打房政策或限貸令）可能影響您的貸款條件。</li>'];

    const swotSummary = `<p class="mt-4 p-3 bg-gray-100 rounded-lg text-sm"><strong>小結：</strong>${personaContent.swotSummary}</p>`;
    
    return `<h3 class="text-lg font-semibold text-gray-800 mb-2">SWOT 分析</h3><div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm"><div><strong class="text-green-700">優勢 (Strengths)</strong><ul class="list-disc pl-5">${strengths.join('')}</ul></div><div><strong class="text-red-700">劣勢 (Weaknesses)</strong><ul class="list-disc pl-5">${weaknesses.join('')}</ul></div><div><strong class="text-blue-700">機會 (Opportunities)</strong><ul class="list-disc pl-5">${opportunities.join('')}</ul></div><div><strong class="text-amber-700">威脅 (Threats)</strong><ul class="list-disc pl-5">${threats.join('')}</ul></div></div>${swotSummary}`;
}

function createActionPlan(personaId, scores, financials, formData) {
    const persona = PERSONA_CONTENT_LIBRARY[personaId] || PERSONA_CONTENT_LIBRARY['DEFAULT'];
    let strategicPath = '';

    // 決定策略路徑
    if (scores.financial < 60) {
        // 路徑一：優先降壓 (Debt First)
        strategicPath = `
            <div class="p-4 mt-4 bg-red-50 border-l-4 border-red-400">
                <h4 class="font-bold text-red-800">💡 策略路徑建議：【優先降壓】</h4>
                <p class="text-sm text-red-700 mt-1">
                    系統偵測到您目前的負債比較高，這是影響您買房能力最關鍵的因素。在財務壓力過大的情況下，貿然購屋風險極高。
                    <br><b>核心建議：</b>強烈建議您暫緩看房，將未來3-6個月的重心完全放在「處理負債」上。請優先償還利率最高的債務，並可嘗試使用「債務整合模擬計算機」找出最適合您的減壓方案。
                </p>
            </div>`;
    } else if (scores.cashflow < 70) {
        // 路徑二：開源為王 (Income First)
        strategicPath = `
            <div class="p-4 mt-4 bg-blue-50 border-l-4 border-blue-400">
                <h4 class="font-bold text-blue-800">💡 策略路徑建議：【開源為王】</h4>
                <p class="text-sm text-blue-700 mt-1">
                    您目前的負債狀況在可控範圍，但每月收入扣除所有開銷後剩餘不多，這會讓您存頭期款的過程非常漫長，且無法應對未來的升息風險。
                    <br><b>核心建議：</b>您當前的首要任務是「提升總收入或是改變收入結構」。建議您可以打開「購屋加速器」，輸入一個更高的目標月收入，親身體驗「開源」對於縮短買房時程的巨大威力。
                </p>
            </div>`;
    } else if (formData['purchase-purpose'] === 'self-use' && scores.downpayment < 60) {
        // 路徑三：資產先行 (Asset First)
        strategicPath = `
            <div class="p-4 mt-4 bg-amber-50 border-l-4 border-amber-400">
                <h4 class="font-bold text-amber-800">💡 策略路徑建議：【資產先行】</h4>
                <p class="text-sm text-amber-700 mt-1">
                    系統偵測到您的財務狀況穩健，但距離理想的自住房頭期款尚有距離。與其辛苦地慢慢存錢，不如逆向思考，讓資產為您工作。
                    <br><b>核心建議：</b>考慮先購入一個總價較低、有租金收益的投資房。利用租金支付貸款，讓您在不增加過多財務壓力的情況下，先搭上資產增值的列車。幾年後再將其出售或轉貸，作為購買理想自住房的堅實基礎。
                </p>
            </div>`;
    }

    let plan = [`<p>${persona.advice}</p>`, strategicPath];

    if (scores.market < 60) {
        plan.push('<p class="mt-2"><strong>支線任務：</strong>由於市場洞察力分數較低，強烈建議您投入時間研究目標區域的實價登錄，並至少再實地看5-10間房，以建立更精準的價格體感。</p>');
    }

    return `<h3 class="text-lg font-semibold text-gray-800 mb-2">專屬行動方案 (英雄之路)</h3><div class="space-y-2 text-sm">${plan.join('')}</div>`;
}

function createRecommendations(personaId) {
    const personaContent = PERSONA_CONTENT_LIBRARY[personaId] || PERSONA_CONTENT_LIBRARY['DEFAULT'];
    let html = `<h3 class="text-lg font-semibold text-gray-800 mb-2">推薦服務與資源</h3><div class="space-y-3">`;
    personaContent.recommendedServices.forEach(serviceId => {
        const service = SERVICES_LIBRARY[serviceId];
        if(service) html += `<div class="p-3 bg-blue-50 rounded-lg border border-blue-200"><h4 class="font-bold text-blue-800">${service.title}</h4><p class="text-sm text-gray-700 mt-1">${service.description}</p></div>`;
    });
    html += `</div>`;
    return html;
}

function createPersonalityExplanation(personaId) {
    const persona = PERSONA_CONTENT_LIBRARY[personaId] || PERSONA_CONTENT_LIBRARY['DEFAULT'];
    let html = `<h3 class="text-lg font-semibold text-gray-800 mb-2">附錄：買房人格詳解</h3>`;
    html += `<div class="text-sm text-gray-700 space-y-2">
                <p><strong>⭐ 核心優勢:</strong> ${persona.strengths.map(s => s.replace(/<\/?li>/g,'')).join('、')}</p>
                <p><strong>⚠️ 潛在風險:</strong> ${persona.weaknesses.map(w => w.replace(/<\/?li>/g,'')).join('、')}</p>
                <p><strong>🤝 互補角色：</strong>${persona.complementaryRole}</p>
             </div>`;
    html += `<h4 class="font-semibold text-gray-700 mt-4">所有買房人格類型：</h4><ul class="list-disc pl-5 text-xs">`;
    for (const key in PERSONA_CONTENT_LIBRARY) {
        html += `<li><strong>${PERSONA_CONTENT_LIBRARY[key].name}:</strong> ${PERSONA_CONTENT_LIBRARY[key].description}</li>`;
    }
    html += `</ul>`;
    return html;
}

function createWeightsExplanation(scores) {
    const weights = CONFIG.scoringWeights.final;
    const scoreItems = Object.keys(weights).map(key => {
        const labels = { downpayment: '💰 頭期款實力', financial: '🏥 財務健康度', cashflow: '💧 現金流穩定性', credit: '🏦 銀行信用條件', market: '📈 市場洞察力', support: '🤝 支援系統' };
        return `<li>${labels[key]}: ${scores[key]}分 (權重: ${weights[key]*100}%)</li>`;
    }).join('');
    return `<h3 class="text-lg font-semibold text-gray-800 mb-2">評分權重說明</h3><ul class="text-sm space-y-1">${scoreItems}</ul>`;
}

function createDisclaimer() {
    return `<div class="mt-8 pt-4 border-t text-xs text-gray-500"><h4 class="font-semibold mb-2">免責聲明與資料保護</h4><p>本報告僅基於您所提供的數據進行分析，結果僅供參考，不構成任何投資、貸款或財務決策之最終建議。實際狀況請諮詢專業人士。我們承諾保護您的資料安全，不會將您的個人數據分享給任何第三方。</p></div>`;
}