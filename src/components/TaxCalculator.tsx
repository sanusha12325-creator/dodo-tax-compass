import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Calculator, Gift, ArrowRightLeft, Banknote, Info, CheckCircle2, AlertTriangle, RefreshCw, FileText, ExternalLink, ChevronDown, TrendingUp, Coins } from "lucide-react";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

type Residency = "russia" | "kazakhstan" | "other";
type Operation = "options" | "conversion" | "sale" | "dividends";
type SaleType = "dp_global" | "russian_company" | "foreign_or_individual";

interface ConversionInputs {
  strikePriceUsd: number;
  fairValueRub: number;
  optionsCount: number;
  usdRubRate: number;
}

type BuyerType = "new_shareholder" | "current_shareholder";

interface SaleInputs {
  acquisitionCost: number;
  salePrice: number;
  saleType: SaleType;
  buyerType: BuyerType;
  usdRubRate: number;
  hasConvertedOptions: boolean;
  paidConversionTax: number;
}

interface DividendInputs {
  dividendPerShareRub: number;
  sharesCount: number;
  usdRubRate: number;
  // Помощник: стоит ли конвертировать
  checkConversion: boolean;
  strikePriceUsd: number;
  fairValueRub: number;
  isCurrentShareholder: boolean;
}

const formatCurrency = (value: number, currency: "RUB" | "USD" = "RUB"): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(value);
};

const calculateNdfl = (income: number): { tax: number; rate: string; breakdown: string } => {
  if (income <= 0) {
    return { tax: 0, rate: "0%", breakdown: "Нет налогооблагаемого дохода" };
  }
  
  const threshold = 2_400_000;
  
  if (income <= threshold) {
    const tax = income * 0.13;
    return { 
      tax, 
      rate: "13%", 
      breakdown: `${formatCurrency(income)} × 13% = ${formatCurrency(tax)}` 
    };
  } else {
    const baseTax = threshold * 0.13;
    const excessTax = (income - threshold) * 0.15;
    const totalTax = baseTax + excessTax;
    return { 
      tax: totalTax, 
      rate: "13% + 15%", 
      breakdown: `${formatCurrency(threshold)} × 13% + ${formatCurrency(income - threshold)} × 15% = ${formatCurrency(totalTax)}` 
    };
  }
};

const REGISTRATION_FEE = 100; // USD - обязательный платёж

export default function TaxCalculator({ hideHeader = false }: { hideHeader?: boolean }) {
  const [residency, setResidency] = useState<Residency>("russia");
  const [operation, setOperation] = useState<Operation>("options");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  const [conversionInputs, setConversionInputs] = useState<ConversionInputs>({
    strikePriceUsd: 0.01,
    fairValueRub: 0,
    optionsCount: 0,
    usdRubRate: 100,
  });
  
  const [saleInputs, setSaleInputs] = useState<SaleInputs>({
    acquisitionCost: 0,
    salePrice: 0,
    saleType: "dp_global",
    buyerType: "new_shareholder",
    usdRubRate: 100,
    hasConvertedOptions: false,
    paidConversionTax: 0,
  });

  const [dividendInputs, setDividendInputs] = useState<DividendInputs>({
    dividendPerShareRub: 0,
    sharesCount: 0,
    usdRubRate: 100,
    checkConversion: false,
    strikePriceUsd: 0.01,
    fairValueRub: 0,
    isCurrentShareholder: false,
  });

  // Fetch USD/RUB exchange rate
  const fetchExchangeRate = async () => {
    setIsLoadingRate(true);
    try {
      const response = await fetch("https://www.cbr-xml-daily.ru/daily_json.js");
      const data = await response.json();
      const rate = data.Valute?.USD?.Value;
      if (rate) {
        const roundedRate = Math.round(rate * 100) / 100;
        setConversionInputs(prev => ({ ...prev, usdRubRate: roundedRate }));
        setSaleInputs(prev => ({ ...prev, usdRubRate: roundedRate }));
        setDividendInputs(prev => ({ ...prev, usdRubRate: roundedRate }));
      }
    } catch (error) {
      console.error("Failed to fetch exchange rate:", error);
    } finally {
      setIsLoadingRate(false);
    }
  };

  useEffect(() => {
    fetchExchangeRate();
  }, []);

  // Conversion calculations
  const calculateConversion = () => {
    const { strikePriceUsd, fairValueRub, optionsCount, usdRubRate } = conversionInputs;
    
    // K = Strike price × USD/RUB × Quantity
    const K = strikePriceUsd * usdRubRate * optionsCount;
    
    // L = Registration fee in USD × USD/RUB
    const L = REGISTRATION_FEE * usdRubRate;
    
    // M = Fair Value × Quantity × 0.8 (20% discount)
    const M = fairValueRub * optionsCount * 0.8;
    
    // N = M - (K + L)
    const N = M - (K + L);
    
    return { K, L, M, N };
  };

  const renderOptionsResult = () => (
    <Alert className="border-success/30 bg-success/5">
      <CheckCircle2 className="h-5 w-5 text-success" />
      <AlertTitle className="text-success font-semibold">Налог не взимается</AlertTitle>
      <AlertDescription className="text-muted-foreground mt-2">
        При получении опционов вы получаете лишь право купить акции в будущем, но не получаете доход в момент выдачи опциона. Налогооблагаемая база отсутствует.
      </AlertDescription>
    </Alert>
  );

  const renderConversionResult = () => {
    const { K, L, M, N } = calculateConversion();
    
    // Расходы на оформление в USD и RUB
    const actualCostUsd = conversionInputs.strikePriceUsd * conversionInputs.optionsCount;
    const totalFormalizationUsd = actualCostUsd + REGISTRATION_FEE;
    const totalFormalizationRub = K + L;
    
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(N);
      const totalExpenses = tax + L + K; // НДФЛ + регистрация + фактическая стоимость
      const netShareValue = M - totalExpenses;
      
      return (
        <div className="space-y-4">
          {/* Расходы на оформление + регистрация */}
          <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">Расходы на исполнение опциона и регистрацию прав на акции</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalFormalizationUsd, "USD")}</p>
              <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Фактическая стоимость {formatCurrency(actualCostUsd, "USD")} + регистрация {formatCurrency(REGISTRATION_FEE, "USD")}
            </p>
          </div>
          
          {/* НДФЛ - яркий блок */}
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">НДФЛ к уплате ({rate})</p>
            <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
            <p className="text-xs opacity-75 mt-2">{breakdown}</p>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">Налогооблагаемый доход (N)</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, N))}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">Общие расходы</p>
              <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">НДФЛ + регистрация + стоимость акций</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">Чистая стоимость акций</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netShareValue))}</p>
              <p className="text-xs text-muted-foreground">M − расходы</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm text-muted-foreground">Формула расчёта: N = M − (K + L)</p>
            <div className="text-sm space-y-1 mt-3">
              <p><span className="font-medium">K</span> (Фактическая стоимость): {formatCurrency(conversionInputs.strikePriceUsd, "USD")} × {conversionInputs.usdRubRate} × {conversionInputs.optionsCount} = <span className="font-semibold">{formatCurrency(K)}</span></p>
              <p><span className="font-medium">L</span> (Расходы на регистрацию): {formatCurrency(REGISTRATION_FEE, "USD")} × {conversionInputs.usdRubRate} = <span className="font-semibold">{formatCurrency(L)}</span></p>
              <p><span className="font-medium">M</span> (Рыночная стоимость −20%): {formatCurrency(conversionInputs.fairValueRub)} × {conversionInputs.optionsCount} × 0.8 = <span className="font-semibold">{formatCurrency(M)}</span></p>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              НДФЛ уплачивается самостоятельно. Компания не является налоговым агентом при конвертации опционов.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (residency === "kazakhstan") {
      const netShareValue = M - L;
      
      return (
        <div className="space-y-4">
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertTitle className="text-success font-semibold">ИПН не взимается</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Для резидентов Казахстана такой доход не облагается индивидуальным подоходным налогом.
            </AlertDescription>
          </Alert>
          
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="text-sm space-y-1">
              <p><span className="font-medium">L</span> (Расходы на регистрацию): {formatCurrency(REGISTRATION_FEE, "USD")} × {conversionInputs.usdRubRate} = <span className="font-semibold">{formatCurrency(L)}</span></p>
              <p><span className="font-medium">M</span> (Рыночная стоимость −20%): {formatCurrency(M)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">Расходы</p>
              <p className="text-lg font-semibold">{formatCurrency(L)}</p>
              <p className="text-xs text-muted-foreground">Только регистрация</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">Чистая стоимость акций</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netShareValue))}</p>
            </div>
          </div>
        </div>
      );
    }
    
    // Other country
    const netShareValue = M - L;
    
    return (
      <div className="space-y-4">
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            В Казахстане ИПН не взимается. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход в виде экономии при покупке акций по номинальной цене вместо рыночной.
          </AlertDescription>
        </Alert>
        
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="text-sm space-y-1">
            <p><span className="font-medium">L</span> (Расходы на регистрацию): {formatCurrency(L)}</p>
            <p><span className="font-medium">M</span> (Рыночная стоимость −20%): {formatCurrency(M)}</p>
            <p><span className="font-medium">N</span> (Потенциальная налоговая база): {formatCurrency(Math.max(0, N))}</p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground mb-1">Стоимость акций (без учёта местного налога)</p>
          <p className="text-lg font-semibold">{formatCurrency(Math.max(0, netShareValue))}</p>
        </div>
      </div>
    );
  };

  // Sale registration fees
  const SALE_REGISTRATION_FEES = {
    new_shareholder: 300, // USD
    current_shareholder: 150, // USD
  };

  // Sale calculations
  const calculateSale = () => {
    const { acquisitionCost, salePrice, buyerType, usdRubRate } = saleInputs;
    
    // Стоимость регистрации в рублях
    const registrationFeeRub = SALE_REGISTRATION_FEES[buyerType] * usdRubRate;
    
    // Доход = Стоимость продажи - Стоимость приобретения
    const income = salePrice - acquisitionCost;
    
    return { acquisitionCost, salePrice, income, registrationFeeRub, registrationFeeUsd: SALE_REGISTRATION_FEES[buyerType] };
  };

  const renderSaleResult = () => {
    const { acquisitionCost, salePrice, income, registrationFeeRub, registrationFeeUsd } = calculateSale();
    
    if (residency === "russia") {
      // Уменьшаем налоговую базу на оплаченный налог при конвертации
      const adjustedIncome = saleInputs.hasConvertedOptions 
        ? Math.max(0, income - saleInputs.paidConversionTax) 
        : income;
      const { tax, rate, breakdown } = calculateNdfl(adjustedIncome);
      
      let paymentMethod = "";
      let selfPay = true;
      
      switch (saleInputs.saleType) {
        case "dp_global":
          paymentMethod = "Вы должны самостоятельно уплатить НДФЛ.";
          break;
        case "russian_company":
          paymentMethod = "Российская компания-покупатель перечислит НДФЛ за вас.";
          selfPay = false;
          break;
        case "foreign_or_individual":
          paymentMethod = "Вы должны самостоятельно уплатить НДФЛ.";
          break;
      }
      
      const totalExpenses = (selfPay ? tax : 0) + registrationFeeRub;
      const netProfit = salePrice - acquisitionCost - totalExpenses;
      
      return (
        <div className="space-y-4">
          {/* НДФЛ - первый и самый яркий блок */}
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">НДФЛ к уплате ({rate})</p>
            <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
            <p className="text-xs opacity-75 mt-2">{breakdown}</p>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">Налогооблагаемый доход</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, adjustedIncome))}</p>
            {saleInputs.hasConvertedOptions && saleInputs.paidConversionTax > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">Расчёт с учётом оплаченного налога:</p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">Доход от продажи</span> {formatCurrency(income)} − <span className="text-muted-foreground">Оплаченный НДФЛ</span> {formatCurrency(saleInputs.paidConversionTax)} = {formatCurrency(Math.max(0, adjustedIncome))}
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">Стоимость регистрации</p>
              <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">Чистая прибыль</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netProfit))}</p>
              <p className="text-xs text-muted-foreground">После НДФЛ и регистрации</p>
            </div>
          </div>
          
          <Alert className={selfPay ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}>
            {selfPay ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
            <AlertDescription>{paymentMethod}</AlertDescription>
          </Alert>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              В Казахстане ИПН не взимается благодаря льготе МФЦА. Это не зависит от срока владения акциями.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (residency === "kazakhstan") {
      const netProfit = income - registrationFeeRub;
      
      return (
        <div className="space-y-4">
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertTitle className="text-success font-semibold">ИПН не взимается до 2066 года</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Для резидентов Казахстана действует льгота МФЦА. ИПН не взимается независимо от срока владения акциями.
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">Стоимость регистрации</p>
              <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">Чистая прибыль</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netProfit))}</p>
            </div>
          </div>
        </div>
      );
    }
    
    const netProfit = income - registrationFeeRub;
    
    return (
      <div className="space-y-4">
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            В Казахстане ИПН не взимается до 2066 года благодаря льготе МФЦА. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход от продажи акций.
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">Стоимость регистрации</p>
            <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">Прибыль (без учёта местного налога)</p>
            <p className="text-lg font-semibold">{formatCurrency(Math.max(0, netProfit))}</p>
          </div>
        </div>
      </div>
    );
  };

  // Dividend calculations
  const calculateDividends = () => {
    const { dividendPerShareRub, sharesCount } = dividendInputs;
    const totalDividendsRub = dividendPerShareRub * sharesCount;
    return { totalDividendsRub };
  };

  const calculateConversionCosts = () => {
    const { strikePriceUsd, fairValueRub, sharesCount, usdRubRate, isCurrentShareholder } = dividendInputs;
    const registrationFee = 100; // USD — одинаковая стоимость для всех при выпуске акций
    const K = strikePriceUsd * usdRubRate * sharesCount;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueRub * sharesCount * 0.8;
    const N = M - (K + L);
    
    let conversionTax = 0;
    if (residency === "russia" && N > 0) {
      conversionTax = calculateNdfl(N).tax;
    }
    
    const registrationCostRub = registrationFee * usdRubRate;
    const totalConversionCost = K + registrationCostRub + conversionTax;
    
    return { K, L, M, N, conversionTax, registrationCostRub, registrationFee, totalConversionCost };
  };

  const renderDividendResult = () => {
    const { totalDividendsRub } = calculateDividends();
    
    if (totalDividendsRub <= 0) return null;

    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(totalDividendsRub);
      const netDividends = totalDividendsRub - tax;
      
      return (
        <div className="space-y-4">
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">НДФЛ с дивидендов ({rate})</p>
            <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
            <p className="text-xs opacity-75 mt-2">{breakdown}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Дивиденды до налога</p>
              <p className="text-xl font-bold text-foreground">{formatCurrency(totalDividendsRub)}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">Чистые дивиденды</p>
              <p className="text-xl font-bold text-success">{formatCurrency(netDividends)}</p>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              Компания-эмитент не удерживает налог с дивидендов. Вы обязаны самостоятельно уплатить НДФЛ и подать декларацию 3-НДФЛ.
            </AlertDescription>
          </Alert>
        </div>
      );
    }
    
    if (residency === "kazakhstan") {
      return (
        <div className="space-y-4">
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertTitle className="text-success font-semibold">ИПН не взимается</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Для резидентов Казахстана дивиденды от компании МФЦА не облагаются ИПН.
            </AlertDescription>
          </Alert>
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm text-muted-foreground mb-1">Чистые дивиденды</p>
            <p className="text-xl font-bold text-success">{formatCurrency(totalDividendsRub)}</p>
          </div>
        </div>
      );
    }
    
    return (
      <div className="space-y-4">
        <Alert className="border-warning/30 bg-warning/5">
          <AlertTriangle className="h-5 w-5 text-warning" />
          <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            Проанализируйте законодательство страны вашего резидентства для определения ставки налога на дивиденды от иностранной компании.
          </AlertDescription>
        </Alert>
        <div className="p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground mb-1">Сумма дивидендов</p>
          <p className="text-xl font-bold">{formatCurrency(totalDividendsRub)}</p>
        </div>
      </div>
    );
  };

  const renderConversionHelper = () => {
    const { totalDividendsRub } = calculateDividends();
    const { totalConversionCost, conversionTax, registrationCostRub, registrationFee, K } = calculateConversionCosts();
    
    if (totalDividendsRub <= 0 || dividendInputs.fairValueRub <= 0) return null;
    
    // Чистые дивиденды за выплату (после налога)
    let netDividendsPerPayout = totalDividendsRub;
    if (residency === "russia") {
      netDividendsPerPayout = totalDividendsRub - calculateNdfl(totalDividendsRub).tax;
    }
    
    const isProfitable = netDividendsPerPayout > totalConversionCost;
    const paybackPayouts = netDividendsPerPayout > 0 ? Math.ceil(totalConversionCost / netDividendsPerPayout) : Infinity;
    
    return (
      <div className="space-y-4">
        <div className={`p-6 rounded-xl shadow-lg ${isProfitable ? 'bg-success/10 border-2 border-success/30' : 'bg-warning/10 border-2 border-warning/30'}`}>
          <div className="flex items-center gap-2 mb-2">
            {isProfitable ? <CheckCircle2 className="w-5 h-5 text-success" /> : <AlertTriangle className="w-5 h-5 text-warning" />}
            <p className="font-semibold text-foreground">
              {isProfitable 
                ? 'Конвертация окупится с первой выплаты дивидендов!' 
                : `Конвертация окупится за ${paybackPayouts === Infinity ? '∞' : paybackPayouts} выплат${paybackPayouts > 1 && paybackPayouts < 5 ? 'ы' : ''} дивидендов`
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">Расходы на конвертацию</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalConversionCost)}</p>
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <p>Стоимость акций: {formatCurrency(K)}</p>
              <p>Регистрация: {formatCurrency(registrationCostRub)} ({formatCurrency(registrationFee, "USD")})</p>
              {residency === "russia" && conversionTax > 0 && <p>НДФЛ при конвертации: {formatCurrency(conversionTax)}</p>}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">Чистые дивиденды за выплату</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(netDividendsPerPayout)}</p>
            <p className="text-xs text-muted-foreground mt-2">После вычета налога</p>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {!hideHeader && (
          <header className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-4">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">Калькулятор НДФЛ</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              Расчёт налогов при операциях с опционами и акциями DP Global Group Ltd. после редомициляции в МФЦА Казахстана
            </p>
          </header>
        )}

        {/* Как стать акционером — компактная ссылка */}
        {!hideHeader && (
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">Как стать акционером?</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 rounded-lg border bg-card space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  Если ты хочешь реализовать право на акции, заполни форму:
                </p>
                <a 
                  href="https://pyrus.com/form/1437842" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  Заполнить форму <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3 text-sm">
                <p className="font-medium text-foreground">Пошаговый процесс:</p>
                <ol className="space-y-2 text-muted-foreground list-none">
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">1</span><span>Ты заявляешь о намерении выкупить (оформить) опционы, заполняешь форму.</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">2</span><span>Происходит подсчёт завестившихся опционов. Мы сообщим о количестве (1–3 дня).</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">3</span><span>Юристы составляют решение о выпуске акций и договор, направляют на подпись через DocuSign (5–7 дней).</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">4</span><span>После подписания ты направляешь сканы паспортов (общегражданский + загран) и резюме. <em>Для новых акционеров, для действующих не применимо.</em></span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">5</span><span>Юристы направляют документы для KYC регистратору (1–3 дня).</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">6</span><span>Выставляется счёт за регистрацию и KYC: <strong>$100</strong> для новых и действующих акционеров.</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">7</span><span>Счёт на оплату номинальной стоимости акций: <strong>$0,01/акция</strong>. После выставления нужно оплатить.</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">8</span><span>Юристы направляют акционерное соглашение с передачей прав голоса Федору (3–5 дней с момента оплаты).</span></li>
                  <li className="flex gap-2"><span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">9</span><span>Регистратор оформляет акции и вносит изменения в корпоративный реестр.</span></li>
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Налоговое резидентство</CardTitle>
            <CardDescription>Выберите страну вашего налогового резидентства</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={residency} onValueChange={(v) => setResidency(v as Residency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="russia">🇷🇺 Россия</SelectItem>
                <SelectItem value="kazakhstan">🇰🇿 Казахстан</SelectItem>
                <SelectItem value="other">🌍 Другая страна</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Тип операции</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={(v) => setOperation(v as Operation)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="options" className="flex items-center gap-1 text-xs px-1.5">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Получение</span>
                </TabsTrigger>
                <TabsTrigger value="conversion" className="flex items-center gap-1 text-xs px-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Конвертация</span>
                </TabsTrigger>
                <TabsTrigger value="dividends" className="flex items-center gap-1 text-xs px-1.5">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Дивиденды</span>
                </TabsTrigger>
                <TabsTrigger value="sale" className="flex items-center gap-1 text-xs px-1.5">
                  <Banknote className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">Продажа</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="options" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">Получение опциона</h3>
                    <p className="text-sm text-muted-foreground">
                      При получении опционов налог не возникает для резидентов любой страны.
                    </p>
                  </div>
                  {renderOptionsResult()}
                </div>
              </TabsContent>

              <TabsContent value="conversion" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">Перевод опциона в акцию</h3>
                    <p className="text-sm text-muted-foreground">
                      Вы получаете доход в виде экономии при покупке акций по номинальной цене вместо рыночной.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strikePriceUsd">Цена исполнения ($)</Label>
                        <Input
                          id="strikePriceUsd"
                          type="number"
                          step="0.01"
                          placeholder="0.01"
                          value={conversionInputs.strikePriceUsd || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, strikePriceUsd: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">Цена, которая прописана в твоём опционном контракте, по которой ты имеешь право купить акцию</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="optionsCount">Количество опционов</Label>
                        <Input
                          id="optionsCount"
                          type="number"
                          placeholder="0"
                          value={conversionInputs.optionsCount || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, optionsCount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="fairValueRub">Текущая стоимость акции (₽)</Label>
                      <Input
                        id="fairValueRub"
                        type="number"
                        placeholder="0"
                        value={conversionInputs.fairValueRub || ""}
                        onChange={(e) => setConversionInputs(prev => ({ ...prev, fairValueRub: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Текущую цену акции ты можешь узнать у команды финансов или юристов. 3800 рублей — стоимость акции при оценке компании в $228 млн на 01.01.2025</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="usdRubRate">Курс USD/RUB</Label>
                      <div className="flex gap-2">
                        <Input
                          id="usdRubRate"
                          type="number"
                          step="0.01"
                          placeholder="100"
                          value={conversionInputs.usdRubRate || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, usdRubRate: Number(e.target.value) }))}
                        />
                        <button
                          onClick={fetchExchangeRate}
                          disabled={isLoadingRate}
                          className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm"
                        >
                          <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} />
                          ЦБ РФ
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">Курс загружается автоматически с ЦБ РФ</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Обязательный платёж при регистрации</Label>
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-lg font-semibold">$100</p>
                        <p className="text-xs text-muted-foreground">Фиксированный платёж за регистрацию акций</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Результат расчёта</h4>
                    {renderConversionResult()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dividends" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">Получение дивидендов</h3>
                    <p className="text-sm text-muted-foreground">
                      Расчёт налога на дивиденды и оценка выгодности конвертации опционов.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dividendPerShare">Дивиденд на акцию (₽)</Label>
                        <Input
                          id="dividendPerShare"
                          type="number"
                          step="0.01"
                          placeholder="0"
                          value={dividendInputs.dividendPerShareRub || ""}
                          onChange={(e) => setDividendInputs(prev => ({ ...prev, dividendPerShareRub: Number(e.target.value) }))}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="divSharesCount">Количество акций</Label>
                        <Input
                          id="divSharesCount"
                          type="number"
                          placeholder="0"
                          value={dividendInputs.sharesCount || ""}
                          onChange={(e) => setDividendInputs(prev => ({ ...prev, sharesCount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                    </div>
                  </div>
                  
                  {(dividendInputs.dividendPerShareRub > 0 && dividendInputs.sharesCount > 0) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">Налог на дивиденды</h4>
                      {renderDividendResult()}
                    </div>
                  )}
                  
                  {/* Помощник: стоит ли конвертировать */}
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="checkConversion"
                        checked={dividendInputs.checkConversion}
                        onCheckedChange={(checked) => setDividendInputs(prev => ({ ...prev, checkConversion: checked === true }))}
                      />
                      <Label htmlFor="checkConversion" className="font-normal cursor-pointer">
                        У меня опционы — хочу понять, выгодно ли конвертировать ради дивидендов
                      </Label>
                    </div>
                    
                    {dividendInputs.checkConversion && (
                      <div className="space-y-4 pl-0">
                        <div className="space-y-2">
                          <Label htmlFor="divUsdRate">Курс USD/RUB</Label>
                          <div className="flex gap-2">
                            <Input
                              id="divUsdRate"
                              type="number"
                              step="0.01"
                              value={dividendInputs.usdRubRate || ""}
                              onChange={(e) => setDividendInputs(prev => ({ ...prev, usdRubRate: Number(e.target.value) }))}
                            />
                            <button
                              onClick={() => {
                                setIsLoadingRate(true);
                                fetch("https://www.cbr-xml-daily.ru/daily_json.js")
                                  .then(r => r.json())
                                  .then(data => {
                                    const rate = data.Valute?.USD?.Value;
                                    if (rate) setDividendInputs(prev => ({ ...prev, usdRubRate: Math.round(rate * 100) / 100 }));
                                  })
                                  .finally(() => setIsLoadingRate(false));
                              }}
                              disabled={isLoadingRate}
                              className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm"
                            >
                              <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} />
                              ЦБ РФ
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="divStrikePrice">Цена исполнения ($)</Label>
                            <Input
                              id="divStrikePrice"
                              type="number"
                              step="0.01"
                              placeholder="0.01"
                              value={dividendInputs.strikePriceUsd || ""}
                              onChange={(e) => setDividendInputs(prev => ({ ...prev, strikePriceUsd: Number(e.target.value) }))}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="divFairValue">Стоимость акции (₽)</Label>
                            <Input
                              id="divFairValue"
                              type="number"
                              placeholder="0"
                              value={dividendInputs.fairValueRub || ""}
                              onChange={(e) => setDividendInputs(prev => ({ ...prev, fairValueRub: Number(e.target.value) }))}
                            />
                            <p className="text-xs text-muted-foreground">3800 ₽ при оценке $228 млн</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="isCurrentShareholder"
                            checked={dividendInputs.isCurrentShareholder}
                            onCheckedChange={(checked) => setDividendInputs(prev => ({ ...prev, isCurrentShareholder: checked === true }))}
                          />
                          <Label htmlFor="isCurrentShareholder" className="font-normal cursor-pointer text-sm">
                            Я уже являюсь акционером
                          </Label>
                        </div>
                        
                        {(dividendInputs.dividendPerShareRub > 0 && dividendInputs.sharesCount > 0 && dividendInputs.fairValueRub > 0) && (
                          <div className="pt-2">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              Анализ окупаемости конвертации
                            </h4>
                            {renderConversionHelper()}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="sale" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">Продажа акций</h3>
                    <p className="text-sm text-muted-foreground">
                      Налог рассчитывается от разницы между стоимостью продажи и приобретения.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="acquisitionCost">Стоимость приобретения акций (₽)</Label>
                      <Input
                        id="acquisitionCost"
                        type="number"
                        placeholder="0"
                        value={saleInputs.acquisitionCost || ""}
                        onChange={(e) => setSaleInputs(prev => ({ ...prev, acquisitionCost: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Общая сумма, за которую вы купили акции</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">Стоимость продажи акций (₽)</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        placeholder="0"
                        value={saleInputs.salePrice || ""}
                        onChange={(e) => setSaleInputs(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">Общая сумма, за которую вы продаёте акции</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buyerType">Тип покупателя</Label>
                      <Select value={saleInputs.buyerType} onValueChange={(v) => setSaleInputs(prev => ({ ...prev, buyerType: v as BuyerType }))}>
                        <SelectTrigger id="buyerType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_shareholder">Новый акционер ($300)</SelectItem>
                          <SelectItem value="current_shareholder">Текущий акционер ($150)</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">Стоимость регистрации сделки</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="saleUsdRate">Курс USD/RUB</Label>
                      <div className="relative">
                        <Input
                          id="saleUsdRate"
                          type="number"
                          step="0.01"
                          value={saleInputs.usdRubRate}
                          onChange={(e) => setSaleInputs(prev => ({ ...prev, usdRubRate: Number(e.target.value) }))}
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setIsLoadingRate(true);
                            fetch("https://www.cbr-xml-daily.ru/daily_json.js")
                              .then(r => r.json())
                              .then(data => {
                                const rate = data.Valute?.USD?.Value;
                                if (rate) setSaleInputs(prev => ({ ...prev, usdRubRate: Math.round(rate * 100) / 100 }));
                              })
                              .finally(() => setIsLoadingRate(false));
                          }}
                          className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-md transition-colors"
                          title="Обновить курс ЦБ"
                        >
                          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingRate ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {residency === "russia" && (
                      <div className="space-y-2">
                        <Label htmlFor="saleType">Кому продаёте акции?</Label>
                        <Select value={saleInputs.saleType} onValueChange={(v) => setSaleInputs(prev => ({ ...prev, saleType: v as SaleType }))}>
                          <SelectTrigger id="saleType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dp_global">DP Global Group Ltd.</SelectItem>
                            <SelectItem value="dp_global">DP Global Group Ltd.</SelectItem>
                            <SelectItem value="russian_company">Другой российской компании</SelectItem>
                            <SelectItem value="foreign_or_individual">Иностранной компании или физ. лицу</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {residency === "russia" && (
                      <div className="space-y-3">
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="hasConvertedOptions"
                            checked={saleInputs.hasConvertedOptions}
                            onCheckedChange={(checked) => setSaleInputs(prev => ({ 
                              ...prev, 
                              hasConvertedOptions: checked === true,
                              paidConversionTax: checked === true ? prev.paidConversionTax : 0
                            }))}
                          />
                          <Label htmlFor="hasConvertedOptions" className="font-normal cursor-pointer">
                            Я конвертировал опционы в акции
                          </Label>
                        </div>
                        
                        {saleInputs.hasConvertedOptions && (
                          <div className="space-y-2 pl-6">
                            <Label htmlFor="paidConversionTax">Оплаченный налог при конвертации (₽)</Label>
                            <Input
                              id="paidConversionTax"
                              type="number"
                              placeholder="0"
                              value={saleInputs.paidConversionTax || ""}
                              onChange={(e) => setSaleInputs(prev => ({ ...prev, paidConversionTax: Number(e.target.value) }))}
                            />
                            <p className="text-xs text-muted-foreground">Эта сумма уменьшит налоговую базу при расчёте НДФЛ</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Результат расчёта</h4>
                    {renderSaleResult()}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground pt-4">
          <p>Калькулятор предоставляет справочную информацию.</p>
          <p>Для точного расчёта рекомендуем консультацию с налоговым специалистом.</p>
        </footer>
      </div>
    </div>
  );
}
