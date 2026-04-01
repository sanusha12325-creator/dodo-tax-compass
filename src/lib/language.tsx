import { createContext, useContext, useState, ReactNode } from "react";

export type Language = "ru" | "en";

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
};

const translations: Record<string, Record<Language, string>> = {
  // === INDEX PAGE ===
  "index.title": {
    ru: "Навигатор держателя опционов и акций",
    en: "Option & Share Holder Guide",
  },
  "index.subtitle": {
    ru: "Информация по дивидендам, переводу опционов в акции и налоговым последствиям",
    en: "Dividends, option-to-share conversion, and tax implications",
  },
  "index.dividends.title": {
    ru: "Получить дивиденды 2026",
    en: "Get 2026 Dividends",
  },
  "index.dividends.desc": {
    ru: "Узнайте, получите ли вы дивиденды, сколько и нужно ли что-то делать",
    en: "Find out if you'll receive dividends, how much, and what to do",
  },
  "index.convert.title": {
    ru: "Перевести опционы в акции",
    en: "Convert Options to Shares",
  },
  "index.convert.desc": {
    ru: "Пошаговая инструкция и расчёт налога при конвертации",
    en: "Step-by-step guide and tax calculation for conversion",
  },
  "index.tax.title": {
    ru: "Рассчитать налог по операции",
    en: "Calculate Tax",
  },
  "index.tax.desc": {
    ru: "Калькуляторы для всех типов операций с опционами и акциями",
    en: "Calculators for all types of option and share transactions",
  },
  "index.footer1": {
    ru: "Калькулятор предоставляет справочную информацию.",
    en: "This calculator provides reference information only.",
  },
  "index.footer2": {
    ru: "Для точного расчёта рекомендуем консультацию с налоговым специалистом.",
    en: "For accurate calculations, we recommend consulting a tax professional.",
  },

  // === COMMON ===
  "common.russia": { ru: "🇷🇺 Россия", en: "🇷🇺 Russia" },
  "common.kazakhstan": { ru: "🇰🇿 Казахстан", en: "🇰🇿 Kazakhstan" },
  "common.other": { ru: "🌍 Другая страна", en: "🌍 Other country" },
  "common.residency": { ru: "Резидентство", en: "Residency" },
  "common.taxResidency": { ru: "Налоговое резидентство", en: "Tax residency" },
  "common.selectResidency": { ru: "Выберите страну вашего налогового резидентства", en: "Select your country of tax residency" },
  "common.usdRubRate": { ru: "Курс USD/RUB", en: "USD/RUB rate" },
  "common.cbrRate": { ru: "ЦБ РФ", en: "CBR" },
  "common.rateAutoLoaded": { ru: "Курс загружается автоматически с ЦБ РФ", en: "Rate is loaded automatically from the Central Bank of Russia" },
  "common.updateRate": { ru: "Обновить курс ЦБ", en: "Update CBR rate" },
  "common.calculate": { ru: "Рассчитать", en: "Calculate" },
  "common.result": { ru: "Результат", en: "Result" },
  "common.calcResult": { ru: "Результат расчёта", en: "Calculation result" },
  "common.next": { ru: "Далее", en: "Next" },
  "common.startOver": { ru: "Начать заново", en: "Start over" },
  "common.strikePrice": { ru: "Цена исполнения ($)", en: "Strike price ($)" },
  "common.strikePriceHint": { ru: "Цена, которая прописана в твоём опционном контракте, по которой ты имеешь право купить акцию", en: "The price stated in your option agreement at which you can buy a share" },
  "common.optionsCount": { ru: "Количество опционов", en: "Number of options" },
  "common.sharesCount": { ru: "Количество акций", en: "Number of shares" },
  "common.fairValueUsd": { ru: "Расчетная стоимость акции ($)", en: "Estimated share price ($)" },
  "common.fairValueHint": { ru: "Определенная по методу чистых активов, 11,1889 USD на акцию по состоянию на 31.12.2025", en: "Determined by net asset value method, 11.1889 USD per share as of 31.12.2025" },
  "common.dividendPerShare": { ru: "Дивиденд на акцию (₽)", en: "Dividend per share (₽)" },
  "common.formula": { ru: "Формула расчёта: N = M − (K + L)", en: "Calculation formula: N = M − (K + L)" },
  "common.actualCost": { ru: "Фактическая стоимость", en: "Actual cost" },
  "common.registrationExpenses": { ru: "Расходы на регистрацию", en: "Registration expenses" },
  "common.marketValueMinus20": { ru: "Рыночная стоимость −20%", en: "Market value −20%" },
  "common.taxableIncome": { ru: "Налогооблагаемый доход", en: "Taxable income" },
  "common.potentialTaxBase": { ru: "Потенциальная налоговая база", en: "Potential tax base" },
  "common.totalExpenses": { ru: "Общие расходы", en: "Total expenses" },
  "common.netShareValue": { ru: "Чистая стоимость акций", en: "Net share value" },
  "common.expenses": { ru: "Расходы", en: "Expenses" },
  "common.onlyRegistration": { ru: "Только регистрация", en: "Registration only" },
  "common.registrationCost": { ru: "Стоимость регистрации", en: "Registration cost" },
  "common.netProfit": { ru: "Чистая прибыль", en: "Net profit" },
  "common.netDividends": { ru: "Чистые дивиденды", en: "Net dividends" },
  "common.dividendsBeforeTax": { ru: "Дивиденды до налога", en: "Dividends before tax" },
  "common.dividendAmount": { ru: "Сумма дивидендов", en: "Dividend amount" },
  "common.amountToReceive": { ru: "Сумма к получению", en: "Amount to receive" },
  "common.dividends": { ru: "Дивиденды", en: "Dividends" },
  "common.noTaxableIncome": { ru: "Нет налогооблагаемого дохода", en: "No taxable income" },
  "common.registrationFeeFixed": { ru: "Фиксированный платёж за регистрацию акций", en: "Fixed fee for share registration" },
  "common.mandatoryRegistrationFee": { ru: "Обязательный платёж при регистрации", en: "Mandatory registration fee" },
  "common.MminusExpenses": { ru: "M − расходы", en: "M − expenses" },

  // === TAX CALCULATOR ===
  "tax.title": { ru: "Рассчитать налог по операции", en: "Calculate Transaction Tax" },
  "tax.subtitle": { ru: "Калькуляторы для всех типов операций", en: "Calculators for all transaction types" },
  "tax.calcTitle": { ru: "Калькулятор НДФЛ", en: "Income Tax Calculator" },
  "tax.calcSubtitle": { ru: "Расчёт налогов при операциях с опционами и акциями DP Global Group Ltd. после редомициляции в МФЦА Казахстана", en: "Tax calculations for option and share transactions with DP Global Group Ltd. after redomiciliation to AIFC Kazakhstan" },
  "tax.operationType": { ru: "Тип операции", en: "Transaction type" },
  "tax.tabOptions": { ru: "Получение", en: "Grant" },
  "tax.tabConversion": { ru: "Конвертация", en: "Conversion" },
  "tax.tabDividends": { ru: "Дивиденды", en: "Dividends" },
  "tax.tabSale": { ru: "Продажа", en: "Sale" },

  // Options tab
  "tax.options.title": { ru: "Получение опциона", en: "Receiving an option" },
  "tax.options.desc": { ru: "При получении опционов налог не возникает для резидентов любой страны.", en: "No tax is due when receiving options, regardless of residency." },
  "tax.options.noTax": { ru: "Налог не взимается", en: "No tax" },
  "tax.options.noTaxDesc": { ru: "При получении опционов вы получаете лишь право купить акции в будущем, но не получаете доход в момент выдачи опциона. Налогооблагаемая база отсутствует.", en: "When you receive options, you only get the right to buy shares in the future. There is no income at the time of grant, so there is no taxable base." },

  // Conversion tab
  "tax.conversion.title": { ru: "Перевод опциона в акцию", en: "Converting option to share" },
  "tax.conversion.desc": { ru: "Вы получаете доход в виде экономии при покупке акций по номинальной цене вместо рыночной.", en: "You receive income in the form of savings when buying shares at par value instead of market price." },
  "tax.conversion.executionAndRegistration": { ru: "Расходы на исполнение опциона и регистрацию прав на акции", en: "Option exercise and share registration costs" },
  "tax.conversion.costPlusReg": { ru: "Фактическая стоимость", en: "Actual cost" },
  "tax.conversion.registration": { ru: "регистрация", en: "registration" },
  "tax.conversion.ndflToPay": { ru: "НДФЛ к уплате", en: "Income tax due" },
  "tax.conversion.ndflPlusTaxRate": { ru: "НДФЛ + регистрация + стоимость акций", en: "Tax + registration + share cost" },
  "tax.conversion.ndflSelfPay": { ru: "НДФЛ уплачивается самостоятельно. Компания не является налоговым агентом при конвертации опционов.", en: "Income tax must be paid independently. The Company is not a tax agent for option conversion." },
  "tax.conversion.noIpn": { ru: "ИПН не взимается", en: "No individual income tax" },
  "tax.conversion.noIpnDesc": { ru: "Для резидентов Казахстана такой доход не облагается индивидуальным подоходным налогом.", en: "For Kazakhstan residents, this income is not subject to individual income tax." },
  "tax.conversion.analysisNeeded": { ru: "Требуется анализ", en: "Analysis required" },
  "tax.conversion.analysisDesc": { ru: "В Казахстане ИПН не взимается. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход в виде экономии при покупке акций по номинальной цене вместо рыночной.", en: "In Kazakhstan, no income tax is charged. You need to check the tax laws of your country of residence to understand if local taxes apply to the income from buying shares at par value instead of market price." },
  "tax.conversion.shareValueNoLocalTax": { ru: "Стоимость акций (без учёта местного налога)", en: "Share value (excluding local tax)" },

  // Sale tab
  "tax.sale.title": { ru: "Продажа акций", en: "Selling shares" },
  "tax.sale.desc": { ru: "Налог рассчитывается от разницы между стоимостью продажи и приобретения.", en: "Tax is calculated on the difference between sale and purchase price." },
  "tax.sale.acquisitionCost": { ru: "Стоимость приобретения акций (₽)", en: "Share acquisition cost (₽)" },
  "tax.sale.acquisitionCostHint": { ru: "Общая сумма, за которую вы купили акции", en: "Total amount you paid for the shares" },
  "tax.sale.salePrice": { ru: "Стоимость продажи акций (₽)", en: "Share sale price (₽)" },
  "tax.sale.salePriceHint": { ru: "Общая сумма, за которую вы продаёте акции", en: "Total amount you're selling the shares for" },
  "tax.sale.buyerType": { ru: "Тип покупателя", en: "Buyer type" },
  "tax.sale.newShareholder": { ru: "Новый акционер ($300)", en: "New shareholder ($300)" },
  "tax.sale.currentShareholder": { ru: "Текущий акционер ($150)", en: "Current shareholder ($150)" },
  "tax.sale.regCostHint": { ru: "Стоимость регистрации сделки", en: "Transaction registration cost" },
  "tax.sale.sellingTo": { ru: "Кому продаёте акции?", en: "Who are you selling to?" },
  "tax.sale.dpGlobal": { ru: "DP Global Group Ltd.", en: "DP Global Group Ltd." },
  "tax.sale.russianCompany": { ru: "Другой российской компании", en: "Another Russian company" },
  "tax.sale.foreignOrIndividual": { ru: "Иностранной компании или физ. лицу", en: "A foreign company or individual" },
  "tax.sale.convertedOptions": { ru: "Я конвертировал опционы в акции", en: "I converted options to shares" },
  "tax.sale.paidConversionTax": { ru: "Оплаченный налог при конвертации (₽)", en: "Tax paid on conversion (₽)" },
  "tax.sale.paidConversionTaxHint": { ru: "Эта сумма уменьшит налог к уплате", en: "This amount will reduce your tax liability" },
  "tax.sale.selfPayNdfl": { ru: "Вы должны самостоятельно уплатить НДФЛ.", en: "You must pay the income tax yourself." },
  "tax.sale.companyPaysNdfl": { ru: "Российская компания-покупатель перечислит НДФЛ за вас.", en: "The Russian buyer company will pay the income tax for you." },
  "tax.sale.withConversionCredit": { ru: "С учётом зачёта ранее уплаченного НДФЛ", en: "Accounting for previously paid income tax" },
  "tax.sale.conversionCreditLabel": { ru: "Зачёт ранее уплаченного НДФЛ:", en: "Credit for previously paid tax:" },
  "tax.sale.taxOnIncome": { ru: "НДФЛ с дохода", en: "Tax on income" },
  "tax.sale.paidOnConversion": { ru: "Уплаченный НДФЛ при конвертации", en: "Tax paid on conversion" },
  "tax.sale.afterTaxAndReg": { ru: "После НДФЛ и регистрации", en: "After tax and registration" },
  "tax.sale.noIpnUntil2066": { ru: "ИПН не взимается до 2066 года", en: "No income tax until 2066" },
  "tax.sale.noIpnUntil2066Desc": { ru: "Для резидентов Казахстана действует льгота МФЦА. ИПН не взимается независимо от срока владения акциями.", en: "Kazakhstan residents enjoy an AIFC exemption. No income tax regardless of how long you've held the shares." },
  "tax.sale.analysisNeeded": { ru: "Требуется анализ", en: "Analysis required" },
  "tax.sale.analysisDesc": { ru: "В Казахстане ИПН не взимается до 2066 года благодаря льготе МФЦА. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход от продажи акций.", en: "In Kazakhstan, no income tax until 2066 thanks to the AIFC exemption. You need to check your country's tax laws to see if share sale income is taxable locally." },
  "tax.sale.profitNoLocalTax": { ru: "Прибыль (без учёта местного налога)", en: "Profit (excluding local tax)" },

  // Dividends tab
  "tax.dividends.title": { ru: "Получение дивидендов", en: "Receiving dividends" },
  "tax.dividends.desc": { ru: "Расчёт налога на дивиденды и оценка выгодности конвертации опционов.", en: "Dividend tax calculation and conversion profitability assessment." },
  "tax.dividends.taxTitle": { ru: "Налог на дивиденды", en: "Dividend tax" },
  "tax.dividends.ndflOnDividends": { ru: "НДФЛ с дивидендов", en: "Income tax on dividends" },
  "tax.dividends.ndflWithheldByCompany": { ru: "НДФЛ с дивидендов удерживается и уплачивается Компанией", en: "Dividend income tax is withheld and paid by the Company" },
  "tax.dividends.noIpn": { ru: "ИПН не взимается", en: "No income tax" },
  "tax.dividends.noIpnDesc": { ru: "Для резидентов Казахстана дивиденды от компании МФЦА не облагаются ИПН.", en: "For Kazakhstan residents, dividends from an AIFC company are not subject to income tax." },
  "div.kazDivTaxTitle": { ru: "ИПН с дивидендов — 15% (10% с сертификатом)", en: "Dividend tax — 15% (10% with certificate)" },
  "div.kazDivTaxDesc": { ru: "Для резидентов Казахстана применяется 15% ИПН с дивидендов, либо 10% при наличии сертификата налогового резидентства. Налог удерживается компанией.", en: "For Kazakhstan residents, 15% income tax applies to dividends, or 10% with a tax residency certificate. Tax is withheld by the company." },
  "div.kazTaxWithheldByCompany": { ru: "ИПН с дивидендов удерживается и уплачивается Компанией", en: "Dividend income tax is withheld and paid by the Company" },
  "div.kazDivTaxWithheld": { ru: "ИПН с дивидендов (15% или 10% с сертификатом) удерживается компанией", en: "Dividend tax (15% or 10% with certificate) is withheld by the company" },
  "div.hasCertificate": { ru: "Есть сертификат налогового резидентства (ставка 10% вместо 15%)", en: "I have a tax residency certificate (10% rate instead of 15%)" },
  "tax.dividends.otherCountryInfo": { ru: "Информация", en: "Information" },
  "tax.dividends.otherCountryDesc": { ru: "Если вы налоговый резидент другой страны, с дивидендов в РФ удерживается налог 15%, а окончательная сумма налога зависит от страны вашего налогового резидентства.", en: "If you are a tax resident of another country, a 15% tax is withheld on dividends in Russia, and the final tax amount depends on your country of tax residency." },
  "tax.dividends.checkConversion": { ru: "У меня опционы — хочу понять, выгодно ли конвертировать ради дивидендов", en: "I have options — I want to see if converting for dividends is worth it" },
  "tax.dividends.conversionAnalysis": { ru: "Анализ окупаемости конвертации", en: "Conversion payback analysis" },
  "tax.dividends.conversionCosts": { ru: "Расходы на конвертацию", en: "Conversion costs" },
  "tax.dividends.shareCost": { ru: "Стоимость акций", en: "Share cost" },
  "tax.dividends.regCost": { ru: "Регистрация", en: "Registration" },
  "tax.dividends.ndflOnConversion": { ru: "НДФЛ при конвертации", en: "Tax on conversion" },
  "tax.dividends.netDividendsPerPayout": { ru: "Чистые дивиденды за выплату", en: "Net dividends per payout" },
  "tax.dividends.afterTax": { ru: "После вычета налога", en: "After tax deduction" },
  "tax.dividends.paysOffFirst": { ru: "Конвертация окупится с первой выплаты дивидендов!", en: "Conversion will pay for itself with the first dividend!" },
  "tax.dividends.paysOffIn": { ru: "Конвертация окупится за", en: "Conversion will pay for itself in" },
  "tax.dividends.payouts": { ru: "выплат дивидендов", en: "dividend payouts" },
  "tax.dividends.simplifiedCalc": { ru: "Расчёт упрощённый: налог на дивиденды и налог при конвертации рассчитаны раздельно. При совмещении доходов в одном году реальная ставка может быть выше из-за прогрессивной шкалы НДФЛ.", en: "This is a simplified calculation: dividend tax and conversion tax are calculated separately. If both incomes occur in the same year, the actual rate may be higher due to the progressive tax scale." },
  "tax.dividends.taxWithheldByCompanyGeneric": { ru: "Налог с дивидендов удерживается и уплачивается Компанией", en: "Dividend tax is withheld and paid by the Company" },
  "tax.divTaxLabel.russia": { ru: "НДФЛ — 13%", en: "Income tax (NDFL) — 13%" },
  "tax.divTaxLabel.kazakhstan15": { ru: "ИПН — 15%", en: "Income tax (IIT) — 15%" },
  "tax.divTaxLabel.kazakhstan10": { ru: "ИПН — 10% (с сертификатом)", en: "Income tax (IIT) — 10% (with certificate)" },
  "tax.divTaxLabel.other": { ru: "Удерживаемый налог — 15%", en: "Withholding tax — 15%" },
  "tax.divTaxName.russia": { ru: "НДФЛ", en: "Income tax (NDFL)" },
  "tax.divTaxName.kazakhstan": { ru: "ИПН", en: "Income tax (IIT)" },
  "tax.divTaxName.other": { ru: "Удерживаемый налог", en: "Withholding tax" },
  "tax.convTaxLabel.russia": { ru: "НДФЛ — 13%/15% (прогрессивная шкала)", en: "Income tax (NDFL) — 13%/15% (progressive)" },
  "tax.convTaxLabel.kazakhstan": { ru: "ИПН — 0% (льгота МФЦА до 2066)", en: "Income tax (IIT) — 0% (AIFC exemption until 2066)" },
  "tax.convTaxLabel.other": { ru: "Налог зависит от страны резидентства", en: "Tax depends on your country of residence" },
  "tax.saleTaxLabel.russia": { ru: "НДФЛ — 13%/15% (прогрессивная шкала)", en: "Income tax (NDFL) — 13%/15% (progressive)" },
  "tax.saleTaxLabel.kazakhstan": { ru: "ИПН — 0% (льгота МФЦА до 2066)", en: "Income tax (IIT) — 0% (AIFC exemption until 2066)" },
  "tax.saleTaxLabel.other": { ru: "Налог зависит от страны резидентства", en: "Tax depends on your country of residence" },

  // How to become shareholder
  "tax.howToBecomeShareholderTitle": { ru: "Как стать акционером?", en: "How to become a shareholder?" },
  "tax.howToBecomeShareholderIntro": { ru: "Если ты хочешь реализовать право на акции, заполни форму:", en: "If you want to exercise your right to shares, fill out the form:" },
  "tax.fillForm": { ru: "Заполнить форму", en: "Fill out the form" },
  "tax.stepByStep": { ru: "Пошаговый процесс:", en: "Step-by-step process:" },
  "tax.step1": { ru: "Ты заявляешь о намерении выкупить (оформить) опционы, заполняешь форму.", en: "You declare your intention to exercise your options and fill out the form." },
  "tax.step2": { ru: "Происходит подсчёт завестившихся опционов. Мы сообщим о количестве (1–3 дня).", en: "Vested options are counted. We'll let you know the number (1–3 days)." },
  "tax.step3": { ru: "Юристы составляют решение о выпуске акций и договор, направляют на подпись через DocuSign (5–7 дней).", en: "Lawyers prepare the share issuance resolution and agreement, sent for signing via DocuSign (5–7 days)." },
  "tax.step4": { ru: "После подписания ты направляешь сканы паспортов (общегражданский + загран) и резюме. Для новых акционеров, для действующих не применимо.", en: "After signing, you send passport scans (domestic + international) and CV. For new shareholders only, not applicable for existing ones." },
  "tax.step5": { ru: "Юристы направляют документы для KYC регистратору (1–3 дня).", en: "Lawyers send KYC documents to the registrar (1–3 days)." },
  "tax.step6": { ru: "Выставляется счёт за регистрацию и KYC: $100 для новых и действующих акционеров.", en: "Invoice for registration and KYC: $100 for both new and existing shareholders." },
  "tax.step7": { ru: "Счёт на оплату номинальной стоимости акций: $0,01/акция. После выставления нужно оплатить.", en: "Invoice for par value of shares: $0.01/share. Must be paid after invoicing." },
  "tax.step8": { ru: "Юристы направляют акционерное соглашение (3–5 дней с момента оплаты).", en: "Lawyers send the shareholder agreement (3–5 days after payment)." },
  "tax.step9": { ru: "Регистратор оформляет акции и вносит изменения в корпоративный реестр.", en: "Registrar issues shares and updates the corporate registry." },

  // === CONVERT OPTIONS PAGE ===
  "convert.title": { ru: "Перевести опционы в акции", en: "Convert Options to Shares" },
  "convert.subtitle": { ru: "Инструкция и расчёт налога", en: "Guide and tax calculation" },
  "convert.option": { ru: "Опцион", en: "Option" },
  "convert.transfer": { ru: "Перевод", en: "Transfer" },
  "convert.share": { ru: "Акция", en: "Share" },
  "convert.sharesGive": { ru: "Акции дают:", en: "Shares give you:" },
  "convert.dividendRight": { ru: "Право на получение дивидендов", en: "Right to receive dividends" },
  "convert.saleRight": { ru: "Возможность продажи акций", en: "Ability to sell shares" },
  "convert.stepByStep": { ru: "Пошаговая инструкция", en: "Step-by-step guide" },
  "convert.fillFormIntro": { ru: "Если ты хочешь реализовать право на акции, заполни форму:", en: "If you want to exercise your right to shares, fill out the form:" },
  "convert.fillForm": { ru: "Заполнить форму", en: "Fill out the form" },
  "convert.stepByStepProcess": { ru: "Пошаговый процесс:", en: "Step-by-step process:" },
  "convert.calculateTax": { ru: "Рассчитать налог при переводе", en: "Calculate conversion tax" },
  "convert.taxOnConversion": { ru: "Налог при переводе опционов в акции", en: "Tax on option-to-share conversion" },
  "convert.executionAndRegistration": { ru: "Расходы на исполнение и регистрацию", en: "Exercise and registration costs" },
  "convert.cost": { ru: "Стоимость", en: "Cost" },

  // === DIVIDENDS FLOW ===
  "div.title": { ru: "Получить дивиденды 2026", en: "Get 2026 Dividends" },
  "div.subtitle": { ru: "Узнайте, получите ли вы дивиденды и сколько", en: "Find out if you'll get dividends and how much" },
  "div.whatDoYouHave": { ru: "Что у вас сейчас есть?", en: "What do you currently have?" },
  "div.onlyShares": { ru: "Только акции", en: "Shares only" },
  "div.onlySharesDesc": { ru: "У меня уже есть акции компании", en: "I already have company shares" },
  "div.onlyOptions": { ru: "Только опционы", en: "Options only" },
  "div.onlyOptionsDesc": { ru: "У меня есть опционы, но акций нет", en: "I have options but no shares" },
  "div.both": { ru: "И акции, и опционы", en: "Both shares and options" },
  "div.bothDesc": { ru: "У меня есть и акции, и опционы", en: "I have both shares and options" },
  "div.shareData": { ru: "Данные по акциям", en: "Share data" },
  "div.optionData": { ru: "Данные по опционам", en: "Option data" },
  "div.bothData": { ru: "Данные по акциям и опционам", en: "Share and option data" },
  "div.vestedOptions": { ru: "Сколько опционов прошло вестинг?", en: "How many options have vested?" },
  "div.vestedOptionsLabel": { ru: "Опционы (прошли вестинг)", en: "Options (vested)" },
  "div.fromPreviousStep": { ru: "Значение с предыдущего шага", en: "Value from previous step" },
  "div.planToConvert": { ru: "Планируете перевести опционы в акции до 20 апреля 2026?", en: "Do you plan to convert options to shares before April 20, 2026?" },
  "div.yesPlanConvert": { ru: "Да, планирую конвертировать", en: "Yes, I plan to convert" },
  "div.noPlanConvert": { ru: "Нет, пока не планирую", en: "No, not planning to" },
  "div.dividendsUnavailable": { ru: "Дивиденды недоступны", en: "Dividends unavailable" },
  "div.dividendsUnavailableDesc": { ru: "Чтобы участвовать в выплате дивидендов, необходимо стать держателем акций до 20 апреля 2026 года. Опционы не дают права на получение дивидендов.", en: "To participate in dividends, you need to become a shareholder by April 20, 2026. Options don't grant dividend rights." },
  "div.learnConvert": { ru: "Узнать как перевести опционы в акции", en: "Learn how to convert options to shares" },
  "div.calcOnConversion": { ru: "Расчёт при конвертации", en: "Calculation for conversion" },
  "div.potentialDividends": { ru: "Потенциальные дивиденды после конвертации", en: "Potential dividends after conversion" },
  "div.taxOnConversion": { ru: "при конвертации", en: "on conversion" },
  "div.taxOnDividends": { ru: "на дивиденды", en: "on dividends" },
  "div.noIpnAifc": { ru: "ИПН не взимается (льгота МФЦА)", en: "No income tax (AIFC exemption)" },
  "div.checkLocalTax": { ru: "Проверьте налоговое законодательство вашей страны", en: "Check your country's tax laws" },
  "div.totalToReceive": { ru: "💵 Итог к получению (дивиденды − все расходы)", en: "💵 Total to receive (dividends − all expenses)" },
  "div.excludingLocalTax": { ru: "Без учёта возможного местного налога", en: "Excluding possible local tax" },
  "div.whatYouPayNow": { ru: "Что вы платите сейчас", en: "What you pay now" },
  "div.whatYouReceive": { ru: "Что вы получаете", en: "What you receive" },
  "div.strikeLabel": { ru: "Цена исполнения", en: "Exercise price" },
  "div.registrationLabel": { ru: "Регистрация", en: "Registration" },
  "div.conversionTaxLabel": { ru: "Налог при конвертации", en: "Conversion tax" },
  "div.mustBeShareholderBy": { ru: "Чтобы участвовать в выплате, необходимо стать держателем акций до", en: "To participate in the payout, you need to become a shareholder by" },
  "div.compareScenarios": { ru: "Сравнить сценарии", en: "Compare scenarios" },
  "div.comparativeCalc": { ru: "Сравнительный расчёт", en: "Comparative calculation" },
  "div.noConversion": { ru: "Без конвертации", en: "Without conversion" },
  "div.withConversion": { ru: "С конвертацией", en: "With conversion" },
  "div.dividendsOnCurrentShares": { ru: "Дивиденды только по текущим", en: "Dividends on current" },
  "div.sharesWord": { ru: "акциям", en: "shares only" },
  "div.dividendsOnAllShares": { ru: "Дивиденды по", en: "Dividends on" },
  "div.sharesCurrentPlusConverted": { ru: "акциям (текущие + конвертированные)", en: "shares (current + converted)" },
  "div.dividendsTaxLabel": { ru: "на дивиденды", en: "on dividends" },
  "div.conversionExpenses": { ru: "Расходы на конвертацию", en: "Conversion costs" },
  "div.total": { ru: "Итого", en: "Total" },
  "div.beforeTax": { ru: "До налога", en: "Before tax" },
  "div.ifConvert": { ru: "Если конвертировать", en: "If you convert" },
  "div.ifNotConvert": { ru: "Если не конвертировать", en: "If you don't convert" },
  "div.conversionIncreases": { ru: "Конвертация увеличит потенциальный доход на", en: "Conversion will increase potential income by" },
  "div.conversionDecreases": { ru: "Конвертация уменьшит доход на", en: "Conversion will decrease income by" },
  "div.noPressure": { ru: "Без давления. Только цифры.", en: "No pressure. Just numbers." },
  "div.simplifiedCalcDisclaimer": { ru: "Расчёт упрощённый: налог на дивиденды и налог при конвертации рассчитаны раздельно. При совмещении этих доходов в одном году реальная ставка может быть выше из-за прогрессивной шкалы НДФЛ (13% до 2,4 млн ₽, 15% сверх).", en: "Simplified calculation: dividend tax and conversion tax are calculated separately. If both incomes occur in the same year, the actual rate may be higher due to progressive income tax (13% up to 2.4M ₽, 15% above)." },
  "div.alreadyShareholder": { ru: "Вы уже являетесь держателем акций", en: "You are already a shareholder" },
  "div.noActionNeeded": { ru: "Дополнительных действий не требуется (при владении на дату закрытия реестра)", en: "No additional action needed (if held on record date)" },
  "div.kazNoIpnDivs": { ru: "Для резидентов Казахстана дивиденды от компании МФЦА не облагаются ИПН.", en: "For Kazakhstan residents, dividends from an AIFC company are not subject to income tax." },
  "div.kazNoIpnDivsConv": { ru: "Для резидентов Казахстана ИПН не взимается на дивиденды и конвертацию (льгота МФЦА).", en: "For Kazakhstan residents, no income tax on dividends and conversion (AIFC exemption)." },
  "div.otherNoTaxAifc": { ru: "В МФЦА налог не взимается. Проверьте налоговое законодательство вашей страны — возможно, потребуется уплатить местный налог.", en: "No tax is charged in AIFC. Check your country's tax laws — you may need to pay local tax." },
  "div.ndflWithheldByCompany": { ru: "НДФЛ с дивидендов удерживается и уплачивается Компанией", en: "Dividend income tax is withheld and paid by the Company" },

  // Convert options steps
  "convert.step1": { ru: "Ты заявляешь о намерении выкупить (оформить) опционы, заполняешь форму.", en: "You declare your intention to exercise your options and fill out the form." },
  "convert.step2": { ru: "Происходит подсчёт завестившихся опционов. Мы сообщим о количестве (1–3 дня).", en: "Vested options are counted. We'll let you know the number (1–3 days)." },
  "convert.step3": { ru: "Юристы составляют решение о выпуске акций и договор, направляют на подпись через DocuSign (5–7 дней).", en: "Lawyers prepare the share issuance resolution and agreement, sent for signing via DocuSign (5–7 days)." },
  "convert.step4": { ru: "После подписания ты направляешь сканы паспортов (общегражданский + загран) и резюме. Для новых акционеров, для действующих не применимо.", en: "After signing, you send passport scans (domestic + international) and CV. For new shareholders only." },
  "convert.step5": { ru: "Юристы направляют документы для KYC регистратору (1–3 дня).", en: "Lawyers send KYC documents to the registrar (1–3 days)." },
  "convert.step6": { ru: "Выставляется счёт за регистрацию и KYC: $100 для новых и действующих акционеров.", en: "Invoice for registration and KYC: $100 for both new and existing shareholders." },
  "convert.step7": { ru: "Счёт на оплату номинальной стоимости акций: $0,01/акция. После выставления нужно оплатить.", en: "Invoice for par value of shares: $0.01/share. Must be paid after invoicing." },
  "convert.step8": { ru: "Юристы направляют акционерное соглашение (3–5 дней с момента оплаты).", en: "Lawyers send the shareholder agreement (3–5 days after payment)." },
  "convert.step9": { ru: "Регистратор оформляет акции и вносит изменения в корпоративный реестр.", en: "Registrar issues shares and updates the corporate registry." },

  // === CHECKLIST ===
  "checklist.title": { ru: "Чек-лист", en: "Checklist" },
  "checklist.subtitle": { ru: "", en: "" },
  "checklist.scenario.shareholder": { ru: "Я акционер и хочу получить дивиденды", en: "I'm a shareholder and want to receive dividends" },
  "checklist.scenario.shareholderDesc": { ru: "Заполните форму для получения дивидендов", en: "Fill out the form to receive dividends" },
  "checklist.scenario.convert": { ru: "Перевод опционов в акции и получение дивидендов", en: "Convert options to shares and receive dividends" },
  "checklist.scenario.convertDesc": { ru: "Полный путь от опционов к дивидендам", en: "Full path from options to dividends" },
  "checklist.sh.fillForm": { ru: "Заполнить форму на получение дивидендов", en: "Fill out the dividend form" },
  "checklist.cv.calculated": { ru: "Принять решение о реализации опционов", en: "Decide on exercising options" },
  "checklist.cv.calculatedDesc": { ru: "Рассчитать приблизительную стоимость расходов и доходов можно в навигаторе", en: "You can estimate costs and income in the navigator" },
  "checklist.cv.fillPyrus": { ru: "Заполнить форму на конвертацию опционов", en: "Fill out the option conversion form" },
  "checklist.cv.signedDocs": { ru: "Подписать все документы", en: "Sign all documents" },
  "checklist.cv.signedDocsDesc": { ru: "Документы на подпись придут на указанную почту через DocuSign, туда же с вами свяжется команда юристов", en: "Documents for signing will be sent to your email via DocuSign, the legal team will also contact you there" },
  "checklist.cv.paidNominal": { ru: "Оплатить номинальную стоимость акций и регистрацию", en: "Pay the par value of shares and registration" },
  "checklist.cv.paidNominalDesc": { ru: "Номинальная стоимость — $0,01 × количество опционов, $100 — регистрация", en: "Par value — $0.01 × number of options, $100 — registration" },
  "checklist.cv.fillDividendForm": { ru: "Заполнить форму на получение дивидендов", en: "Fill out the dividend form" },
  "checklist.openForm": { ru: "Открыть форму", en: "Open form" },
  "checklist.openNavigator": { ru: "Открыть навигатор", en: "Open navigator" },
  "checklist.examplePdf": { ru: "Пример заполнения формы", en: "Form filling example" },
  "checklist.allDone": { ru: "Всё готово!", en: "All done!" },

  // === FORM EXAMPLE ===
  "example.fullName": { ru: "Ваши фамилия, имя и отчество", en: "Full name" },
  "example.fullNameHint": { ru: "Укажите данные именно в таком порядке: Фамилия Имя Отчество", en: "Enter in this order: Last name, First name, Patronymic" },
  "example.citizenship": { ru: "Страна гражданства", en: "Country of citizenship" },
  "example.docType": { ru: "Вид документа, удостоверяющего личность", en: "Identity document type" },
  "example.docTypeValue": { ru: "Внутренний паспорт", en: "Internal passport" },
  "example.docTypeHint": { ru: "Для юр. лиц — выписка из торгового реестра (не старше 3 мес.)", en: "For legal entities — trade registry extract (not older than 3 months)" },
  "example.scanDoc": { ru: "Скан документа, удостоверяющего личность", en: "Identity document scan" },
  "example.scanDocHint": { ru: "Для паспорта: разворот с фотографией. Для юр. лиц: выписка из торгового реестра", en: "For passport: photo page spread. For legal entities: trade registry extract" },
  "example.passportData": { ru: "Паспортные данные", en: "Passport details" },
  "example.series": { ru: "Серия", en: "Series" },
  "example.number": { ru: "Номер", en: "Number" },
  "example.issuedBy": { ru: "Кем выдан", en: "Issued by" },
  "example.issueDate": { ru: "Дата выдачи", en: "Issue date" },
  "example.dualCitizenship": { ru: "Есть ли у вас второе гражданство?", en: "Do you have dual citizenship?" },
  "example.no": { ru: "Нет", en: "No" },
  "example.residencePermit": { ru: "Есть ли у вас вид на жительство в России?", en: "Do you have a residence permit in Russia?" },
  "example.notApplicableCitizen": { ru: "Не применимо. Я гражданин РФ", en: "Not applicable. I'm a citizen of RF" },
  "example.birthDate": { ru: "Дата рождения", en: "Date of birth" },
  "example.taxResidency": { ru: "Налоговое резидентство", en: "Tax residency" },
  "example.taxResidencyHint": { ru: "Укажите ваш статус на текущий момент", en: "Indicate your current status" },
  "example.taxNumber": { ru: "Номер налогоплательщика (ИНН)", en: "Taxpayer number (TIN)" },
  "example.taxNumberHint": { ru: "Если в стране вашего резидентства такой номер отсутствует — поставьте прочерк (—)", en: "If no such number exists in your country — put a dash (—)" },
  "example.taxCert": { ru: "Документ, подтверждающий статус налогового резидента", en: "Tax residency certificate" },
  "example.taxCertHint": { ru: "Для резидентов РФ — справка о налоговом резидентстве через service.nalog.ru. Для нерезидентов — сертификат иностранного государства", en: "For RF residents — tax residency certificate via service.nalog.ru. For non-residents — foreign state certificate" },
  "example.bankDetails": { ru: "Банковские реквизиты", en: "Bank details" },
  "example.bankAccount": { ru: "Номер банковского счёта", en: "Bank account number" },
  "example.bik": { ru: "БИК банка", en: "Bank BIC" },
  "example.bankName": { ru: "Наименование банка", en: "Bank name" },
  "example.currency": { ru: "Валюта счёта", en: "Account currency" },
  "example.rubles": { ru: "Рубли", en: "Rubles" },

  "index.checklist.title": { ru: "Чек-лист", en: "Checklist" },
  "index.checklist.desc": { ru: "Пошаговый чек-лист для акционеров и опционеров", en: "Step-by-step checklist for shareholders and option holders" },
};

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>(() => {
    const saved = localStorage.getItem("app-language");
    return (saved === "en" || saved === "ru") ? saved : "ru";
  });

  const handleSetLang = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem("app-language", newLang);
  };

  const t = (key: string): string => {
    const entry = translations[key];
    if (!entry) return key;
    return entry[lang] || entry["ru"] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang: handleSetLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}
