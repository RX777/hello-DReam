/**
 * @file Code.gs
 * @description 後端主服務與核心計算邏輯 v4.4 (最終修正版)
 * 負責提供網頁服務、接收前端請求，並調度報告生成。
 */

// ===================================================================================
//  I. 靜態設定檔 (Static Configuration)
// ===================================================================================
const CONFIG = {
    debtTypes: [
        { id: 'credit-card-debt', name: '信用卡債(循環利息)', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'rate', placeholder: '年利率(%)', type: 'number' }] },
        { id: 'credit-loan', name: '信用貸款', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'payment', placeholder: '總月付金', type: 'number' }, { id: 'rate', placeholder: '年利率(%)', type: 'number' }] },
        { id: 'mortgage', name: '其他房貸', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'payment', placeholder: '總月付金', type: 'number' }, { id: 'rate', placeholder: '年利率(%)', type: 'number' }] },
        { id: 'car-loan', name: '汽車貸款', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'payment', placeholder: '總月付金', type: 'number' }, { id: 'rate', placeholder: '年利率(%)', type: 'number' }] },
        { id: 'student-loan', name: '就學貸款', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'payment', placeholder: '總月付金', type: 'number' }] },
        { id: 'other-loan', name: '其他貸款', fields: [{ id: 'total', placeholder: '剩餘總本金(萬)', type: 'number' }, { id: 'payment', placeholder: '總月付金', type: 'number' }, { id: 'rate', placeholder: '年利率(%)', type: 'number' }] }
    ],
    scoringWeights: {
        final: { downpayment: 0.25, financial: 0.20, cashflow: 0.15, credit: 0.20, market: 0.10, support: 0.10 }
    }
};

const PERSONA_CONTENT_LIBRARY = {
    FORTRESS: { name: '財務堡壘', description: '資產、現金流、信用俱佳的夢想狀態，是市場中的頂級玩家。', strengths: ['<li>資產雄厚，現金與投資部位健康。</li>', '<li>現金流極度充裕，還款能力無虞。</li>'], weaknesses: ['<li>可能因過於安逸而錯失資產擴張的時機。</li>'], swotSummary: '您的整體財務結構非常穩固，主要挑戰在於如何進行更高效的資產配置與財富傳承，而非單純的購屋。', advice: '您的核心課題已從「買房」提升至「資產管理與傳承」的宏觀層面。建議尋求頂尖的稅務與法律顧問，為您的資產帝國保駕護航，並考慮利用財務槓桿進行更大規模的資產佈局。', complementaryRole: '您需要頂尖的稅務與法律顧問。', recommendedServices: ['HNW_SERVICES', 'TAX_SERVICES', 'FINANCIAL_PLANNING'] },
    LEVERAGED_MAGNATE: { name: '槓桿巨擘', description: '總資產驚人，但現金流被高額負債嚴重侵蝕，行走在財富鋼索上。', strengths: ['<li>總資產規模龐大，懂得利用槓桿創造機會。</li>'], weaknesses: ['<li>現金流極度脆弱，DTI過高，財務風險極高。</li>', '<li>任何市場利率波動都可能對您造成巨大衝擊。</li>'], swotSummary: '您擁有巨大的資產，但同時也被巨大的負債所束縛。當務之急是降低財務風險，將高槓桿轉化為可持續的健康資產。', advice: '首要任務是「活化資產以清償高利負債」，立即為您的財務狀況進行洩壓。可以考慮出售部分增值空間較小的資產，償還高利率的信貸或短期貸款，將財務槓桿維持在健康水位。', complementaryRole: '您需要一位【保守型】的財務顧問來為您建立風險控管機制。', recommendedServices: ['DEBT_CONSOLIDATION', 'FINANCIAL_PLANNING', 'HNW_SERVICES'] },
    ASSET_FROZEN: { name: '資產凍結者', description: '帳面富貴，但資產多為不易變現的不動產，導致現金流緊張。', strengths: ['<li>不動產價值高，總資產體質不差。</li>'], weaknesses: ['<li>資產流動性極差，缺乏可動用的現金。</li>', '<li>現金流可能無法應對突發狀況。</li>'], swotSummary: '您的財富主要被鎖在不動產中，如同擁有一座金山卻沒有開採工具。啟動資產活化是釋放您購買力的關鍵。', advice: '核心課題是「啟動資產活化」。考慮將持有的不動產進行「轉增貸」或「理財型房貸」，將不動產的價值轉化為可動用的資金。若房產不具備貸款條件，則應考慮出售部分房產。', complementaryRole: '您需要一位擅長不動產活化與租賃管理的專家。', recommendedServices: ['FINANCIAL_PLANNING', 'REAL_ESTATE_BROKERAGE', 'LOAN_ASSISTANCE'] },
    HIGH_INCOME_SPENDER: { name: '高薪月光族', description: '收入極高，但支出同樣驚人，如同一個華麗的漏水池。', strengths: ['<li>收入天花板高，潛在的儲蓄能力強。</li>', '<li>銀行通常視您為優質客戶，信用條件不差。</li>'], weaknesses: ['<li>缺乏預算控管，儲蓄率極低，難以累積頭期款。</li>', '<li>消費習慣可能導致DTI升高。</li>'], swotSummary: '您擁有最強大的武器——高收入，卻沒有用它來鞏固城池。只要能有效控制支出，您的購屋進程將會突飛猛進。', advice: '立即開始「預算與記帳」，分析支出結構，設定強制儲蓄目標（例如薪資入帳後自動轉帳30%至另一個帳戶）是您的首要任務。將儲蓄目標視覺化，能有效提升您的儲蓄動力。', complementaryRole: '一位能協助您規劃預算的理財教練會很有幫助。', recommendedServices: ['FINANCIAL_PLANNING', 'COURSES'] },
    PRUDENT_ACCUMULATOR: { name: '穩健儲蓄家', description: '收入穩定，負債極少，儲蓄率高但資產規模不大，是典型的步兵玩家。', strengths: ['<li>儲蓄紀律強，現金流健康，負債極低。</li>'], weaknesses: ['<li>資產累積速度較慢，可能錯過市場上漲的機會。</li>', '<li>較為保守，可能對投資或適度槓桿感到恐懼。</li>'], swotSummary: '您擁有非常健康的財務體質，但如同一個只懂得防守的戰士。您的下一步是學習如何進攻，讓您的資產能為您工作。', advice: '核心課題是「啟動錢滾錢的引擎」。在保有3-6個月緊急預備金的前提下，將您的部分儲蓄投入到穩健的指數型ETF中，開始學習資產配置，讓您的購買力能跟上通膨。', complementaryRole: '您需要一位能啟發您投資觀念的導師或課程。', recommendedServices: ['COURSES', 'GROUP_BUYING', 'FINANCIAL_PLANNING'] },
    CONSERVATIVE_IRON_BOWL: { name: '保守鐵飯碗', description: '職業極度穩定，但因過度厭惡風險而將資金全放在低收益的資產中。', strengths: ['<li>職業與現金流極度穩定，銀行信用極好。</li>'], weaknesses: ['<li>通膨正在嚴重侵蝕您的購買力。</li>', '<li>資產活化效率極低，財富增長緩慢。</li>'], swotSummary: '您的穩定性是銀行最愛的特質，但在零利率時代，過度保守等於資產縮水。您需要為您的資金找到比定存更有效率的去處。', advice: '核心是「觀念啟發」。理解「適度且健康」的財務槓桿，是保護資產不被通膨侵蝕的有效武器。銀行會非常樂意借錢給您，應善用此優勢，考慮將部分資金轉入風險較低的REITs或全球型ETF。', complementaryRole: '一位能平衡風險與報酬的投資顧問是您的好夥伴。', recommendedServices: ['FINANCIAL_PLANNING', 'COURSES'] },
    STRATEGIST: { name: '智慧策略家', description: '擁有絕佳的市場敏銳度和研究能力，是典型的「用腦袋」買房的玩家。', strengths: ['<li>市場洞察力強，研究能力出眾，能找到高CP值的物件。</li>'], weaknesses: ['<li>自有資金可能不足，空有屠龍之術卻無倚天之劍。</li>'], swotSummary: '您的知識就是您最大的財富，但需要將其與實際的資金實力結合。您的挑戰在於如何補強財務基礎，或找到能欣賞您才華的資金夥伴。', advice: '核心任務是「補強財務基礎」。在積極儲蓄的同時，可以考慮製作專業的「購房計畫書」，向家人或信賴的朋友展示您的研究成果，尋求資金合作的可能性。', complementaryRole: '您需要能提供資金的夥伴。', recommendedServices: ['LOAN_ASSISTANCE', 'GROUP_BUYING'] },
    FAMILY_FUNDED: { name: '長輩金援者', description: '擁有強大的家庭作為后盾，在購屋起跑點上擁有巨大優勢。', strengths: ['<li>頭期款能力極強，能輕鬆跨越購屋的第一道門檻。</li>'], weaknesses: ['<li>可能忽略自身長期的還款能力與財務規劃。</li>', '<li>容易在無壓力下做出衝動的購屋決策。</li>'], swotSummary: '您在起跑線上已經領先，但買房是一場馬拉松而非短跑。關鍵在於如何將這份支持轉化為您獨立財務規劃的基石。', advice: '核心課題是「責任與獨立」。將這份支持視為「啟動資產」，並以此為基礎，嚴謹地規劃未來的獨立還款計畫。在做決定前，務必進行詳盡的壓力測試，確保在沒有後援的情況下也能負擔月付金。', complementaryRole: '一位能幫助您建立獨立財務觀的規劃師很重要。', recommendedServices: ['FINANCIAL_PLANNING', 'TAX_SERVICES'] },
    CREDIT_NEWBIE: { name: '信用小白', description: '收入與儲蓄狀況良好，但因缺乏信用紀錄，可能在貸款時面臨挑戰。', strengths: ['<li>還款潛力強，無不良負債。</li>'], weaknesses: ['<li>缺乏信用數據，銀行不了解你，可能導致貸款條件不佳。</li>'], swotSummary: '您如同一個沒有履歷的優秀求職者，銀行很難評估您的可靠性。建立一份漂亮的信用履歷是您當前的首要之務。', advice: '立即啟動「信用培養計畫」。申辦1-2張信用卡並規律使用（每月消費並全額繳清），是您現階段最重要的任務。持續6個月以上，您的信用分數將會顯著提升。', complementaryRole: '一位熟悉銀行貸款策略的顧問能幫您少走彎路。', recommendedServices: ['LOAN_ASSISTANCE', 'COURSES'] },
    GIG_ECONOMY_DREAMER: { name: '斜槓夢想家', description: '擁有多元或非典型的收入來源，總額可能很高，但缺乏穩定的薪轉證明。', strengths: ['<li>賺錢能力多元，工作彈性。</li>'], weaknesses: ['<li>收入不穩定，難以向銀行證明還款能力。</li>', '<li>財務文件通常不齊全。</li>'], swotSummary: '您的賺錢能力毋庸置疑，但銀行只相信「看得到」的文件。您的核心挑戰是將您的才華轉化為銀行看得懂的語言。', advice: '核心策略是「財務文件化」。建議成立工作室或公司，將所有收入透過公司帳戶處理，並保留至少一至兩年完整的「401/403報表」與銀行流水紀錄。這將大幅提升您在銀行眼中的可信度。', complementaryRole: '一位專業的會計師或記帳士能幫您將不穩定的收入變得「銀行看得懂」。', recommendedServices: ['LOAN_ASSISTANCE', 'FINANCIAL_PLANNING'] },
    PRECARIOUS_BEGINNER: { name: '奮鬥起步者', description: '資產與現金儲備尚在起步階段，且可能背負必要性負債。', strengths: ['<li>年輕，擁有最寶貴的時間優勢。</li>', '<li>學習潛力大，可塑性強。</li>'], weaknesses: ['<li>財務基礎薄弱，離購屋目標遙遠。</li>'], swotSummary: '您正處於打基礎的黃金階段，此時的每一步積累都至關重要。避免不必要的消費和負債，將所有資源專注於提升自我。', advice: '專注於「打好基本功」：全力提升本業收入、嚴格執行儲蓄計畫、優先償還高利率負債、並開始培養信用。買房對您來說是長期目標，不必急於一時，紮實的基本功將讓您未來走得更穩。', complementaryRole: '您需要系統性的課程學習與一位能提供方向的導師。', recommendedServices: ['COURSES'] },
    DEFAULT: { name: '穩健平衡者', description: '您的財務狀況相當均衡，沒有致命的弱點，顯示出您在理財上採取了穩健的策略。', strengths: ['<li>財務結構全面且無明顯短版。</li>'], weaknesses: ['<li>您的收入與存款比例均衡，但若想挑戰更高總價的房屋，需要集中資源提高其中一項。</li>'], swotSummary: '您如同一個各項能力值都平均的冒險者，沒有致命弱點，但可能也缺乏一擊必殺的絕招。您的下一步是找到您的「突破口」，集中資源，讓某項優勢變得突出。', advice: '您的下一步是找到您的「突破口」。審視您的財務狀況，找出最容易提升的維度（例如，是否有機會大幅提升收入？或者能否透過更積極的投資來加速資產累積？），並將您的資源集中在能帶來最大效益的維度上。', complementaryRole: '您需要一位能幫助您發現機會的策略夥伴。', recommendedServices: ['FINANCIAL_PLANNING', 'COURSES', 'REAL_ESTATE_BROKERAGE'] }
};

// 🔥 修正：將 SERVICES_LIBRARY 加回來，確保 ReportGenerator.gs 可以使用
const SERVICES_LIBRARY = {
    COURSES: { title: '課程學習', description: '我們的系列課程將幫助您建立完整的房地產知識體系，從市場分析到法規稅務，讓您成為真正的專家。' },
    DEBT_CONSOLIDATION: { title: '債務整合諮詢', description: '當您的負債過於複雜或利率過高時，我們的專家能協助您規劃債務整合，降低月付金與總利息，優化您的財務健康。' },
    LOAN_ASSISTANCE: { title: '貸款需求規劃', description: '因為信用條件、收入證明等問題而無法順利貸款嗎？我們能為您進行健檢，規劃最適合您的貸款申請策略。' },
    FINANCIAL_PLANNING: { title: '財務規劃服務', description: '您的資產狀況較為複雜，或是有活化資產的需求嗎？讓我們的財務顧問為您量身打造最佳的資產配置與活化方案。' },
    GROUP_BUYING: { title: '團購買房 (投資物件)', description: '對於高潛力的投資型物件，我們組織專業的團購社群，讓您能以更優惠的條件，參與高門檻的投資機會。' },
    REAL_ESTATE_BROKERAGE: { title: '買賣房服務', description: '無論您是自住需求，或是需要出售名下房產，我們專業的房仲團隊都能提供最在地、最全面的市場資訊與服務。' },
    TAX_SERVICES: { title: '專業節稅服務', description: '房地產交易涉及複雜的稅務問題，從房地合一稅、贈與稅到繼承，我們的稅務專家能為您合法節稅。' },
    HNW_SERVICES: { title: '高資產客戶服務', description: '針對地主、微型建商或商用不動產投資者，我們提供從土地開發、合建規劃到大型物業管理的頂級服務。' },
};

// ===================================================================================
//  II. 後端主服務 & 入口點 (Main Service & Entry Points)
// ===================================================================================

function doGet() {
  const template = HtmlService.createTemplateFromFile('Index');
  template.CONFIG_FROM_SERVER = JSON.stringify(CONFIG);
  return template.evaluate()
      .setTitle('好棧AI智慧買房家 v4.4')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}

function analyzeBuyingPower(formData) {
  try {
    const cleanedData = sanitizeFormData(formData);
    const financials = calculateFinancials(cleanedData);
    const scores = calculateScores(financials, cleanedData);
    const personaId = determinePersona(financials, scores, cleanedData);
    
    // 調用您在 ReportGenerator.gs 中定義的函數
    const reports = generateTextReports(financials, scores, personaId, cleanedData);
    
    // 將 personaId 添加到 reports 物件中，這樣前端才能根據它找到對應的圖片和Slogan
    reports.personalityType = personaId;
    
    return {
      success: true,
      data: { scores, financials, reports }
    };
  } catch (e) {
    Logger.log(`分析錯誤: ${e.message} \n堆疊追蹤: ${e.stack}`);
    return {
      success: false,
      error: `後端計算時發生錯誤: ${e.message}`
    };
  }
}

// ===================================================================================
//  III. 核心計算邏輯 (Core Calculation Logic)
// ===================================================================================

function sanitizeFormData(formData) {
    const cleanedData = {};
    for (const key in formData) {
        if (typeof formData[key] === 'string' && !isNaN(parseFloat(formData[key])) && isFinite(formData[key])) {
            cleanedData[key] = parseFloat(formData[key]);
        } else {
            cleanedData[key] = formData[key];
        }
    }
    return cleanedData;
}

function calculateFinancials(data) {
    const cash = (data['cash-assets'] || 0) * 10000;
    const stock = (data['stock-assets'] || 0) * 10000;
    const property = (data['property-assets'] || 0) * 10000;
    const totalAssets = cash + stock + property;
    const ownedProperties = data['owned-properties'] || 0;
    const ltv = ownedProperties >= 2 ? 0.7 : (ownedProperties === 1 ? 0.7 : 0.8);
    const goalPrice = (data['house-goal-price'] || 0) * 10000;
    const requiredDownPayment = goalPrice * (1 - ltv);
    const availableDownPayment = cash + (stock * 0.9);
    const downpaymentRate = requiredDownPayment > 0 ? (availableDownPayment / requiredDownPayment) * 100 : 150;
    const totalIncome = (data['main-income'] || 0) + (data['other-income'] || 0);
    const livingExpenses = data['living-expenses'] || 0;
    let totalDebtPayment = 0;
    CONFIG.debtTypes.forEach(debt => {
        if (data[`has-${debt.id}`]) {
            if (debt.fields.some(f => f.id === 'payment')) {
                totalDebtPayment += (data[`${debt.id}-payment`] || 0);
            } else if (debt.id === 'credit-card-debt' && (data[`${debt.id}-rate`] || 0) > 0) {
                totalDebtPayment += (data[`${debt.id}-total`] || 0) * 10000 * ((data[`${debt.id}-rate`] / 100) / 12);
            }
        }
    });
    const totalExpenses = livingExpenses + totalDebtPayment;
    const dti = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    const monthlyCashflow = totalIncome - totalExpenses;
    return {
        cashAssets: cash, stockAssets: stock, propertyAssets: property,
        availableDownpayment: availableDownPayment, downpaymentRate: downpaymentRate,
        totalIncome: totalIncome, totalDebtPayment: totalDebtPayment,
        livingExpenses: livingExpenses, totalExpenses: totalExpenses,
        dti: dti, monthlyCashflow: monthlyCashflow,
        requiredDownpayment: requiredDownPayment, houseGoalPrice: goalPrice,
        totalAssets: totalAssets
    };
}

function calculateScores(financials, data) {
    const { downpaymentRate, dti, monthlyCashflow, totalAssets } = financials;
    const mainIncome = data['main-income'] || 1; 
    const downpaymentScore = Math.min(100, Math.max(0, downpaymentRate));
    const financialScore = dti > 70 ? 20 : (dti > 50 ? 60 : (dti > 30 ? 80 : 100));
    const assetAdjustment = totalAssets > mainIncome * 36 ? 10 : (totalAssets > mainIncome * 18 ? 5 : 0);
    const adjustedFinancialScore = Math.min(100, financialScore + assetAdjustment);
    const cashflowRatio = mainIncome > 0 ? monthlyCashflow / mainIncome : 0;
    const cashflowScore = cashflowRatio < 0.1 ? 20 : (cashflowRatio < 0.3 ? 70 : (cashflowRatio < 0.5 ? 90 : 100));
    const creditScoreMap = { 'excellent': 30, 'good': 20, 'fair': 10 };
    const jobScoreMap = { 'stable': 30, 'sme': 20, 'cash-based': 10 };
    const savingHabitMap = { 'stable': 25, 'breakeven': 15, 'moonlight': 5, 'newbie': 10 };
    const emergencyFundMap = { 'over-6': 15, '3-to-6': 10, '1-to-3': 5, 'none': 0 };
    const creditScore = (creditScoreMap[data['credit-score']] || 0) +
                        (jobScoreMap[data['job-type']] || 0) +
                        (savingHabitMap[data['saving-habit']] || 0) +
                        (emergencyFundMap[data['emergency-fund']] || 0);
    let marketScore = 0;
    if (data['buying-experience'] === 'yes') {
        marketScore += {'profit': 40, 'even': 25, 'loss': 10}[data['experience-outcome']] || 0;
    } else {
        marketScore += (data['prep-reading'] ? 15 : 0) + (data['prep-viewing'] ? 15 : 0) + (data['prep-research'] ? 10 : 0);
    }
    marketScore += {'yes': 40, 'maybe': 20, 'no': 5}[data['object-cons']] || 0;
    const decisionMap = { 'expert': 100, 'self': 70, 'friends': 50 };
    const familyMap = { 'none': 50, 'business': 100, 'property': 100, 'professional': 90 };
    const supportScore = ((decisionMap[data['decision-support']] || 0) * 0.5) + ((familyMap[data['family-support']] || 0) * 0.5);
    return {
        downpayment: Math.round(downpaymentScore),
        financial: Math.round(adjustedFinancialScore),
        cashflow: Math.round(cashflowScore),
        credit: Math.round(Math.min(100, creditScore * 1.25)),
        market: Math.round(Math.min(100, marketScore * 1.25)),
        support: Math.round(supportScore)
    };
}

function determinePersona(financials, scores, data) {
    const { totalAssets, dti, totalIncome, propertyAssets, stockAssets } = financials;
    const propertyRatio = totalAssets > 0 ? propertyAssets / totalAssets : 0;
    const stockRatio = totalAssets > 0 ? stockAssets / totalAssets : 0;
    if (totalAssets > 30000000 && dti < 30 && scores.cashflow > 80) return 'FORTRESS';
    if (totalAssets > 20000000 && dti > 60) return 'LEVERAGED_MAGNATE';
    if (totalAssets > 10000000 && propertyRatio > 0.7 && scores.cashflow < 50) return 'ASSET_FROZEN';
    if (data['saving-habit'] === 'moonlight' && totalIncome > 100000) return 'HIGH_INCOME_SPENDER';
    if (dti < 20 && scores.downpayment < 40 && totalAssets < 5000000) return 'PRUDENT_ACCUMULATOR';
    if (data['job-type'] === 'stable' && stockRatio < 0.1) return 'CONSERVATIVE_IRON_BOWL';
    if (scores.market > 80 && (scores.downpayment < 50 || scores.financial < 50)) return 'STRATEGIST';
    if (scores.support > 80 && scores.downpayment > 70) return 'FAMILY_FUNDED';
    if (data['saving-habit'] === 'newbie') return 'CREDIT_NEWBIE';
    if (data['job-type'] === 'cash-based' && totalIncome > 80000) return 'GIG_ECONOMY_DREAMER';
    if (totalAssets < 1000000 && totalIncome < 50000) return 'PRECARIOUS_BEGINNER';
    return 'DEFAULT';
}