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
import { useLanguage } from "@/lib/language";

type Residency = "russia" | "kazakhstan" | "other";
type Operation = "options" | "conversion" | "sale" | "dividends";
type SaleType = "dp_global" | "russian_company" | "foreign_or_individual";

interface ConversionInputs {
  strikePriceUsd: number;
  fairValueUsd: number;
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
  checkConversion: boolean;
  strikePriceUsd: number;
  fairValueUsd: number;
}

const REGISTRATION_FEE = 100;

export default function TaxCalculator({ hideHeader = false }: { hideHeader?: boolean }) {
  const { t, lang } = useLanguage();

  const formatCurrency = (value: number, currency: "RUB" | "USD" = "RUB"): string => {
    return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", {
      style: "currency",
      currency: currency,
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }).format(value);
  };

  const calculateNdfl = (income: number): { tax: number; rate: string; breakdown: string } => {
    if (income <= 0) {
      return { tax: 0, rate: "0%", breakdown: t("common.noTaxableIncome") };
    }
    const threshold = 2_400_000;
    if (income <= threshold) {
      const tax = income * 0.13;
      return { tax, rate: "13%", breakdown: `${formatCurrency(income)} × 13% = ${formatCurrency(tax)}` };
    } else {
      const baseTax = threshold * 0.13;
      const excessTax = (income - threshold) * 0.15;
      const totalTax = baseTax + excessTax;
      return { tax: totalTax, rate: "13% + 15%", breakdown: `${formatCurrency(threshold)} × 13% + ${formatCurrency(income - threshold)} × 15% = ${formatCurrency(totalTax)}` };
    }
  };

  const [residency, setResidency] = useState<Residency>("russia");
  const [operation, setOperation] = useState<Operation>("options");
  const [isLoadingRate, setIsLoadingRate] = useState(false);
  
  const [conversionInputs, setConversionInputs] = useState<ConversionInputs>({
    strikePriceUsd: 0.01,
    fairValueUsd: 0,
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
    fairValueUsd: 0,
  });

  useEffect(() => {
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => {
        const rate = data.Valute?.USD?.Value;
        if (rate) {
          const rounded = Math.round(rate * 100) / 100;
          setConversionInputs(prev => ({ ...prev, usdRubRate: rounded }));
          setSaleInputs(prev => ({ ...prev, usdRubRate: rounded }));
          setDividendInputs(prev => ({ ...prev, usdRubRate: rounded }));
        }
      })
      .catch(() => {});
  }, []);

  const fetchExchangeRate = () => {
    setIsLoadingRate(true);
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => {
        const rate = data.Valute?.USD?.Value;
        if (rate) {
          const rounded = Math.round(rate * 100) / 100;
          setConversionInputs(prev => ({ ...prev, usdRubRate: rounded }));
          setSaleInputs(prev => ({ ...prev, usdRubRate: rounded }));
          setDividendInputs(prev => ({ ...prev, usdRubRate: rounded }));
        }
      })
      .finally(() => setIsLoadingRate(false));
  };

  // Conversion calculations
  const calculateConversion = () => {
    const { strikePriceUsd, fairValueUsd, optionsCount, usdRubRate } = conversionInputs;
    const K = strikePriceUsd * usdRubRate * optionsCount;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueUsd * usdRubRate * optionsCount * 0.8;
    const N = M - (K + L);
    return { K, L, M, N };
  };

  const renderOptionsResult = () => (
    <Alert className="border-success/30 bg-success/5">
      <CheckCircle2 className="h-5 w-5 text-success" />
      <AlertTitle className="text-success font-semibold">{t("tax.options.noTax")}</AlertTitle>
      <AlertDescription className="text-muted-foreground mt-2">
        {t("tax.options.noTaxDesc")}
      </AlertDescription>
    </Alert>
  );

  const renderConversionResult = () => {
    const { K, L, M, N } = calculateConversion();
    const actualCostUsd = conversionInputs.strikePriceUsd * conversionInputs.optionsCount;
    const totalFormalizationUsd = actualCostUsd + REGISTRATION_FEE;
    const totalFormalizationRub = K + L;
    
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(N);
      const totalExpenses = tax + L + K;
      const netShareValue = M - totalExpenses;
      
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">{t("tax.conversion.executionAndRegistration")}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold text-foreground">{formatCurrency(totalFormalizationUsd, "USD")}</p>
              <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {t("tax.conversion.costPlusReg")} {formatCurrency(actualCostUsd, "USD")} + {t("tax.conversion.registration")} {formatCurrency(REGISTRATION_FEE, "USD")}
            </p>
          </div>
          
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">{t("tax.conversion.ndflToPay")} ({rate})</p>
            <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
            <p className="text-xs opacity-75 mt-2">{breakdown}</p>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">{t("common.taxableIncome")} (N)</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, N))}</p>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">{t("common.totalExpenses")}</p>
              <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
              <p className="text-xs text-muted-foreground">{t("tax.conversion.ndflPlusTaxRate")}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.netShareValue")}</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netShareValue))}</p>
              <p className="text-xs text-muted-foreground">{t("common.MminusExpenses")}</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm text-muted-foreground">{t("common.formula")}</p>
            <div className="text-sm space-y-1 mt-3">
              <p><span className="font-medium">K</span> ({t("common.actualCost")}): {formatCurrency(conversionInputs.strikePriceUsd, "USD")} × {conversionInputs.usdRubRate} × {conversionInputs.optionsCount} = <span className="font-semibold">{formatCurrency(K)}</span></p>
              <p><span className="font-medium">L</span> ({t("common.registrationExpenses")}): {formatCurrency(REGISTRATION_FEE, "USD")} × {conversionInputs.usdRubRate} = <span className="font-semibold">{formatCurrency(L)}</span></p>
              <p><span className="font-medium">M</span> ({t("common.marketValueMinus20")}): {formatCurrency(conversionInputs.fairValueUsd, "USD")} × {conversionInputs.usdRubRate} × {conversionInputs.optionsCount} × 0.8 = <span className="font-semibold">{formatCurrency(M)}</span></p>
            </div>
          </div>
          
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              {t("tax.conversion.ndflSelfPay")}
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
            <AlertTitle className="text-success font-semibold">{t("tax.conversion.noIpn")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("tax.conversion.noIpnDesc")}
            </AlertDescription>
          </Alert>
          
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <div className="text-sm space-y-1">
              <p><span className="font-medium">L</span> ({t("common.registrationExpenses")}): {formatCurrency(REGISTRATION_FEE, "USD")} × {conversionInputs.usdRubRate} = <span className="font-semibold">{formatCurrency(L)}</span></p>
              <p><span className="font-medium">M</span> ({t("common.marketValueMinus20")}): {formatCurrency(M)}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">{t("common.expenses")}</p>
              <p className="text-lg font-semibold">{formatCurrency(L)}</p>
              <p className="text-xs text-muted-foreground">{t("common.onlyRegistration")}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.netShareValue")}</p>
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
          <AlertTitle className="text-warning font-semibold">{t("tax.conversion.analysisNeeded")}</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            {t("tax.conversion.analysisDesc")}
          </AlertDescription>
        </Alert>
        
        <div className="p-4 rounded-lg bg-muted/50 space-y-2">
          <div className="text-sm space-y-1">
            <p><span className="font-medium">L</span> ({t("common.registrationExpenses")}): {formatCurrency(L)}</p>
            <p><span className="font-medium">M</span> ({t("common.marketValueMinus20")}): {formatCurrency(M)}</p>
            <p><span className="font-medium">N</span> ({t("common.potentialTaxBase")}): {formatCurrency(Math.max(0, N))}</p>
          </div>
        </div>
        
        <div className="p-4 rounded-lg bg-muted/30 border">
          <p className="text-sm text-muted-foreground mb-1">{t("tax.conversion.shareValueNoLocalTax")}</p>
          <p className="text-lg font-semibold">{formatCurrency(Math.max(0, netShareValue))}</p>
        </div>
      </div>
    );
  };

  // Sale registration fees
  const SALE_REGISTRATION_FEES = {
    new_shareholder: 300,
    current_shareholder: 150,
  };

  const calculateSale = () => {
    const { acquisitionCost, salePrice, buyerType, usdRubRate } = saleInputs;
    const registrationFeeRub = SALE_REGISTRATION_FEES[buyerType] * usdRubRate;
    const income = salePrice - acquisitionCost;
    return { acquisitionCost, salePrice, income, registrationFeeRub, registrationFeeUsd: SALE_REGISTRATION_FEES[buyerType] };
  };

  const renderSaleResult = () => {
    const { acquisitionCost, salePrice, income, registrationFeeRub, registrationFeeUsd } = calculateSale();
    
    if (residency === "russia") {
      const { tax: rawTax, rate, breakdown } = calculateNdfl(income);
      const conversionCredit = saleInputs.hasConvertedOptions ? saleInputs.paidConversionTax : 0;
      const tax = Math.max(0, rawTax - conversionCredit);
      
      let paymentMethod = "";
      let selfPay = true;
      
      switch (saleInputs.saleType) {
        case "dp_global":
          paymentMethod = t("tax.sale.selfPayNdfl");
          break;
        case "russian_company":
          paymentMethod = t("tax.sale.companyPaysNdfl");
          selfPay = false;
          break;
        case "foreign_or_individual":
          paymentMethod = t("tax.sale.selfPayNdfl");
          break;
      }
      
      const totalExpenses = (selfPay ? tax : 0) + registrationFeeRub;
      const netProfit = salePrice - acquisitionCost - totalExpenses;
      
      return (
        <div className="space-y-4">
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">{t("tax.conversion.ndflToPay")} ({rate})</p>
            <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
            {conversionCredit > 0 && (
              <p className="text-xs opacity-75 mt-1">{t("tax.sale.withConversionCredit")}</p>
            )}
            <p className="text-xs opacity-75 mt-2">{breakdown}</p>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">{t("common.taxableIncome")}</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, income))}</p>
            {conversionCredit > 0 && (
              <div className="mt-3 pt-3 border-t border-primary/10">
                <p className="text-xs text-muted-foreground mb-1">{t("tax.sale.conversionCreditLabel")}</p>
                <p className="text-sm text-foreground">
                  <span className="text-muted-foreground">{t("tax.sale.taxOnIncome")}</span> {formatCurrency(rawTax)} − <span className="text-muted-foreground">{t("tax.sale.paidOnConversion")}</span> {formatCurrency(conversionCredit)} = <span className="font-semibold">{formatCurrency(tax)}</span>
                </p>
              </div>
            )}
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">{t("common.registrationCost")}</p>
              <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.netProfit")}</p>
              <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netProfit))}</p>
              <p className="text-xs text-muted-foreground">{t("tax.sale.afterTaxAndReg")}</p>
            </div>
          </div>
          
          <Alert className={selfPay ? "border-warning/30 bg-warning/5" : "border-success/30 bg-success/5"}>
            {selfPay ? <AlertTriangle className="h-4 w-4 text-warning" /> : <CheckCircle2 className="h-4 w-4 text-success" />}
            <AlertDescription>{paymentMethod}</AlertDescription>
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
            <AlertTitle className="text-success font-semibold">{t("tax.sale.noIpnUntil2066")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("tax.sale.noIpnUntil2066Desc")}
            </AlertDescription>
          </Alert>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-muted/30 border">
              <p className="text-sm text-muted-foreground mb-1">{t("common.registrationCost")}</p>
              <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
            </div>
            <div className="p-4 rounded-lg bg-success/10 border border-success/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.netProfit")}</p>
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
          <AlertTitle className="text-warning font-semibold">{t("tax.sale.analysisNeeded")}</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            {t("tax.sale.analysisDesc")}
          </AlertDescription>
        </Alert>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">{t("common.registrationCost")}</p>
            <p className="text-lg font-semibold">{formatCurrency(registrationFeeRub)}</p>
            <p className="text-xs text-muted-foreground">{formatCurrency(registrationFeeUsd, "USD")} × {saleInputs.usdRubRate}</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">{t("tax.sale.profitNoLocalTax")}</p>
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
    const { strikePriceUsd, fairValueUsd, sharesCount, usdRubRate } = dividendInputs;
    const registrationFee = 100;
    const K = strikePriceUsd * usdRubRate * sharesCount;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueUsd * usdRubRate * sharesCount * 0.8;
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

    const getDividendTaxRate = (): number => {
      if (residency === "russia") return 0.13;
      if (residency === "kazakhstan") return 0.10;
      return 0.15;
    };

    const taxRate = getDividendTaxRate();
    const tax = totalDividendsRub * taxRate;
    const netDividends = totalDividendsRub - tax;
    const rateLabel = `${Math.round(taxRate * 100)}%`;
    const breakdown = `${formatCurrency(totalDividendsRub)} × ${rateLabel} = ${formatCurrency(tax)}`;

    return (
      <div className="space-y-4">
        <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
          <p className="text-sm opacity-90 mb-1">{t("tax.dividends.ndflOnDividends")} ({rateLabel})</p>
          <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
          <p className="text-xs opacity-75 mt-2">{breakdown}</p>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">{t("common.dividendsBeforeTax")}</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalDividendsRub)}</p>
          </div>
          <div className="p-4 rounded-lg bg-success/10 border border-success/20">
            <p className="text-sm text-muted-foreground mb-1">{t("common.netDividends")}</p>
            <p className="text-xl font-bold text-success">{formatCurrency(netDividends)}</p>
          </div>
        </div>
        
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("tax.dividends.ndflWithheldByCompany")}
          </AlertDescription>
        </Alert>
      </div>
    );
  };

  const renderConversionHelper = () => {
    const { totalDividendsRub } = calculateDividends();
    const { totalConversionCost, conversionTax, registrationCostRub, registrationFee, K } = calculateConversionCosts();
    
    if (totalDividendsRub <= 0 || dividendInputs.fairValueUsd <= 0) return null;
    
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
                ? t("tax.dividends.paysOffFirst")
                : `${t("tax.dividends.paysOffIn")} ${paybackPayouts === Infinity ? '∞' : paybackPayouts} ${t("tax.dividends.payouts")}`
              }
            </p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">{t("tax.dividends.conversionCosts")}</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(totalConversionCost)}</p>
            <div className="text-xs text-muted-foreground mt-2 space-y-0.5">
              <p>{t("tax.dividends.shareCost")}: {formatCurrency(K)}</p>
              <p>{t("tax.dividends.regCost")}: {formatCurrency(registrationCostRub)} ({formatCurrency(registrationFee, "USD")})</p>
              {residency === "russia" && conversionTax > 0 && <p>{t("tax.dividends.ndflOnConversion")}: {formatCurrency(conversionTax)}</p>}
            </div>
          </div>
          <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
            <p className="text-sm text-muted-foreground mb-1">{t("tax.dividends.netDividendsPerPayout")}</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(netDividendsPerPayout)}</p>
            <p className="text-xs text-muted-foreground mt-2">{t("tax.dividends.afterTax")}</p>
          </div>
        </div>
        
        {residency === "russia" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t("tax.dividends.simplifiedCalc")}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const steps = [
    t("tax.step1"), t("tax.step2"), t("tax.step3"), t("tax.step4"),
    t("tax.step5"), t("tax.step6"), t("tax.step7"), t("tax.step8"), t("tax.step9"),
  ];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        {!hideHeader && (
          <header className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-4">
              <Calculator className="w-8 h-8 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-bold text-foreground">{t("tax.calcTitle")}</h1>
            <p className="text-muted-foreground max-w-md mx-auto">
              {t("tax.calcSubtitle")}
            </p>
          </header>
        )}

        {!hideHeader && (
        <Collapsible>
          <CollapsibleTrigger className="w-full flex items-center justify-between p-4 rounded-lg border bg-card text-card-foreground shadow-sm hover:bg-muted/50 transition-colors group">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-primary" />
              <span className="font-medium text-sm">{t("tax.howToBecomeShareholderTitle")}</span>
            </div>
            <ChevronDown className="w-4 h-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="mt-2 p-4 rounded-lg border bg-card space-y-4">
              <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                <p className="text-sm text-foreground">
                  {t("tax.howToBecomeShareholderIntro")}
                </p>
                <a 
                  href="https://pyrus.com/form/1437842" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors"
                >
                  {t("tax.fillForm")} <ExternalLink className="w-4 h-4" />
                </a>
              </div>

              <div className="space-y-3 text-sm">
                <p className="font-medium text-foreground">{t("tax.stepByStep")}</p>
                <ol className="space-y-2 text-muted-foreground list-none">
                  {steps.map((s, i) => (
                    <li key={i} className="flex gap-2">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>
        )}

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("common.taxResidency")}</CardTitle>
            <CardDescription>{t("common.selectResidency")}</CardDescription>
          </CardHeader>
          <CardContent>
            <Select value={residency} onValueChange={(v) => setResidency(v as Residency)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="russia">{t("common.russia")}</SelectItem>
                <SelectItem value="kazakhstan">{t("common.kazakhstan")}</SelectItem>
                <SelectItem value="other">{t("common.other")}</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">{t("tax.operationType")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={operation} onValueChange={(v) => setOperation(v as Operation)}>
              <TabsList className="grid grid-cols-4 w-full">
                <TabsTrigger value="options" className="flex items-center gap-1 text-xs px-1.5">
                  <Gift className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{t("tax.tabOptions")}</span>
                </TabsTrigger>
                <TabsTrigger value="conversion" className="flex items-center gap-1 text-xs px-1.5">
                  <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{t("tax.tabConversion")}</span>
                </TabsTrigger>
                <TabsTrigger value="dividends" className="flex items-center gap-1 text-xs px-1.5">
                  <Coins className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{t("tax.tabDividends")}</span>
                </TabsTrigger>
                <TabsTrigger value="sale" className="flex items-center gap-1 text-xs px-1.5">
                  <Banknote className="w-3.5 h-3.5 shrink-0" />
                  <span className="hidden sm:inline">{t("tax.tabSale")}</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="options" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">{t("tax.options.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("tax.options.desc")}
                    </p>
                  </div>
                  {renderOptionsResult()}
                </div>
              </TabsContent>

              <TabsContent value="conversion" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">{t("tax.conversion.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("tax.conversion.desc")}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="strikePriceUsd">{t("common.strikePrice")}</Label>
                        <Input
                          id="strikePriceUsd"
                          type="number"
                          step="0.01"
                          placeholder="0.01"
                          value={conversionInputs.strikePriceUsd || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, strikePriceUsd: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">{t("common.strikePriceHint")}</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="optionsCount">{t("common.optionsCount")}</Label>
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
                      <Label htmlFor="fairValueUsd">{t("common.fairValueUsd")}</Label>
                      <Input
                        id="fairValueUsd"
                        type="number"
                        step="0.01"
                        placeholder="0"
                        value={conversionInputs.fairValueUsd || ""}
                        onChange={(e) => setConversionInputs(prev => ({ ...prev, fairValueUsd: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">{t("common.fairValueHint")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="usdRubRate">{t("common.usdRubRate")}</Label>
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
                          {t("common.cbrRate")}
                        </button>
                      </div>
                      <p className="text-xs text-muted-foreground">{t("common.rateAutoLoaded")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>{t("common.mandatoryRegistrationFee")}</Label>
                      <div className="p-3 rounded-lg bg-muted/50 border">
                        <p className="text-lg font-semibold">$100</p>
                        <p className="text-xs text-muted-foreground">{t("common.registrationFeeFixed")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">{t("common.calcResult")}</h4>
                    {renderConversionResult()}
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="dividends" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">{t("tax.dividends.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("tax.dividends.desc")}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="dividendPerShare">{t("common.dividendPerShare")}</Label>
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
                        <Label htmlFor="divSharesCount">{t("common.sharesCount")}</Label>
                        <Input
                          id="divSharesCount"
                          type="number"
                          placeholder="0"
                          value={dividendInputs.sharesCount || ""}
                          onChange={(e) => setDividendInputs(prev => ({ ...prev, sharesCount: Number(e.target.value) }))}
                        />
                      </div>
                    </div>
                  </div>
                  
                  {(dividendInputs.dividendPerShareRub > 0 && dividendInputs.sharesCount > 0) && (
                    <div className="pt-4 border-t">
                      <h4 className="font-medium mb-3">{t("tax.dividends.taxTitle")}</h4>
                      {renderDividendResult()}
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <div className="flex items-center space-x-2 mb-4">
                      <Checkbox
                        id="checkConversion"
                        checked={dividendInputs.checkConversion}
                        onCheckedChange={(checked) => setDividendInputs(prev => ({ ...prev, checkConversion: checked === true }))}
                      />
                      <Label htmlFor="checkConversion" className="font-normal cursor-pointer">
                        {t("tax.dividends.checkConversion")}
                      </Label>
                    </div>
                    
                    {dividendInputs.checkConversion && (
                      <div className="space-y-4 pl-0">
                        <div className="space-y-2">
                          <Label htmlFor="divUsdRate">{t("common.usdRubRate")}</Label>
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
                              {t("common.cbrRate")}
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="divStrikePrice">{t("common.strikePrice")}</Label>
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
                            <Label htmlFor="divFairValue">{t("common.fairValueUsd")}</Label>
                            <Input
                              id="divFairValue"
                              type="number"
                              step="0.01"
                              placeholder="0"
                              value={dividendInputs.fairValueUsd || ""}
                              onChange={(e) => setDividendInputs(prev => ({ ...prev, fairValueUsd: Number(e.target.value) }))}
                            />
                            <p className="text-xs text-muted-foreground">{t("common.fairValueHint")}</p>
                          </div>
                        </div>
                        
                        {(dividendInputs.dividendPerShareRub > 0 && dividendInputs.sharesCount > 0 && dividendInputs.fairValueUsd > 0) && (
                          <div className="pt-2">
                            <h4 className="font-medium mb-3 flex items-center gap-2">
                              <TrendingUp className="w-4 h-4 text-primary" />
                              {t("tax.dividends.conversionAnalysis")}
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
                    <h3 className="font-medium mb-2">{t("tax.sale.title")}</h3>
                    <p className="text-sm text-muted-foreground">
                      {t("tax.sale.desc")}
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="acquisitionCost">{t("tax.sale.acquisitionCost")}</Label>
                      <Input
                        id="acquisitionCost"
                        type="number"
                        placeholder="0"
                        value={saleInputs.acquisitionCost || ""}
                        onChange={(e) => setSaleInputs(prev => ({ ...prev, acquisitionCost: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">{t("tax.sale.acquisitionCostHint")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="salePrice">{t("tax.sale.salePrice")}</Label>
                      <Input
                        id="salePrice"
                        type="number"
                        placeholder="0"
                        value={saleInputs.salePrice || ""}
                        onChange={(e) => setSaleInputs(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                      />
                      <p className="text-xs text-muted-foreground">{t("tax.sale.salePriceHint")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="buyerType">{t("tax.sale.buyerType")}</Label>
                      <Select value={saleInputs.buyerType} onValueChange={(v) => setSaleInputs(prev => ({ ...prev, buyerType: v as BuyerType }))}>
                        <SelectTrigger id="buyerType">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new_shareholder">{t("tax.sale.newShareholder")}</SelectItem>
                          <SelectItem value="current_shareholder">{t("tax.sale.currentShareholder")}</SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">{t("tax.sale.regCostHint")}</p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="saleUsdRate">{t("common.usdRubRate")}</Label>
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
                          title={t("common.updateRate")}
                        >
                          <RefreshCw className={`w-4 h-4 text-muted-foreground ${isLoadingRate ? "animate-spin" : ""}`} />
                        </button>
                      </div>
                    </div>

                    {residency === "russia" && (
                      <div className="space-y-2">
                        <Label htmlFor="saleType">{t("tax.sale.sellingTo")}</Label>
                        <Select value={saleInputs.saleType} onValueChange={(v) => setSaleInputs(prev => ({ ...prev, saleType: v as SaleType }))}>
                          <SelectTrigger id="saleType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dp_global">{t("tax.sale.dpGlobal")}</SelectItem>
                            <SelectItem value="russian_company">{t("tax.sale.russianCompany")}</SelectItem>
                            <SelectItem value="foreign_or_individual">{t("tax.sale.foreignOrIndividual")}</SelectItem>
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
                            {t("tax.sale.convertedOptions")}
                          </Label>
                        </div>
                        
                        {saleInputs.hasConvertedOptions && (
                          <div className="space-y-2 pl-6">
                            <Label htmlFor="paidConversionTax">{t("tax.sale.paidConversionTax")}</Label>
                            <Input
                              id="paidConversionTax"
                              type="number"
                              placeholder="0"
                              value={saleInputs.paidConversionTax || ""}
                              onChange={(e) => setSaleInputs(prev => ({ ...prev, paidConversionTax: Number(e.target.value) }))}
                            />
                            <p className="text-xs text-muted-foreground">{t("tax.sale.paidConversionTaxHint")}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">{t("common.calcResult")}</h4>
                    {renderSaleResult()}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        <footer className="text-center text-xs text-muted-foreground pt-4">
          <p>{t("index.footer1")}</p>
          <p>{t("index.footer2")}</p>
        </footer>
      </div>
    </div>
  );
}
