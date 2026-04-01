import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, AlertTriangle, Info, Coins, RefreshCw, TrendingUp, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type OwnershipType = null | "only_shares" | "only_options" | "both";
type Residency = "russia" | "kazakhstan" | "other";

const REGISTRATION_FEE = 100;

export default function DividendsFlow() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [step, setStep] = useState(0);
  const [residency, setResidency] = useState<Residency>("russia");
  const [hasCertificate, setHasCertificate] = useState(false);
  const [ownership, setOwnership] = useState<OwnershipType>(null);
  const [sharesCount, setSharesCount] = useState(0);
  const [optionsCount, setOptionsCount] = useState(0);
  const [dividendPerShare, setDividendPerShare] = useState(0);
  const [usdRubRate, setUsdRubRate] = useState(100);
  const [planToConvert, setPlanToConvert] = useState<boolean | null>(null);
  const [strikePriceUsd, setStrikePriceUsd] = useState(0.01);
  const [fairValueUsd, setFairValueUsd] = useState(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  const formatCurrency = (value: number, currency: "RUB" | "USD" = "RUB"): string => {
    return new Intl.NumberFormat(lang === "ru" ? "ru-RU" : "en-US", {
      style: "currency", currency,
      minimumFractionDigits: currency === "USD" ? 2 : 0,
      maximumFractionDigits: currency === "USD" ? 2 : 0,
    }).format(value);
  };

  const calculateNdfl = (income: number) => {
    if (income <= 0) return { tax: 0, rate: "0%", breakdown: t("common.noTaxableIncome") };
    const threshold = 2_400_000;
    if (income <= threshold) {
      const tax = income * 0.13;
      return { tax, rate: "13%", breakdown: `${formatCurrency(income)} × 13% = ${formatCurrency(tax)}` };
    }
    const baseTax = threshold * 0.13;
    const excessTax = (income - threshold) * 0.15;
    const totalTax = baseTax + excessTax;
    return { tax: totalTax, rate: "13% + 15%", breakdown: `${formatCurrency(threshold)} × 13% + ${formatCurrency(income - threshold)} × 15% = ${formatCurrency(totalTax)}` };
  };

  useEffect(() => {
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => { const rate = data.Valute?.USD?.Value; if (rate) setUsdRubRate(Math.round(rate * 100) / 100); })
      .catch(() => {});
  }, []);

  const fetchRate = () => {
    setIsLoadingRate(true);
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => { const rate = data.Valute?.USD?.Value; if (rate) setUsdRubRate(Math.round(rate * 100) / 100); })
      .finally(() => setIsLoadingRate(false));
  };

  const calcDividends = (shares: number) => {
    const totalRub = dividendPerShare * shares;
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(totalRub);
      return { totalRub, tax, rate, breakdown, net: totalRub - tax };
    }
    if (residency === "kazakhstan") {
      const kazRate = hasCertificate ? 0.10 : 0.15;
      const kazRateLabel = hasCertificate ? "10%" : "15%";
      const tax = totalRub * kazRate;
      const breakdown = `${formatCurrency(totalRub)} × ${kazRateLabel} = ${formatCurrency(tax)}`;
      return { totalRub, tax, rate: kazRateLabel, breakdown, net: totalRub - tax };
    }
    return { totalRub, tax: 0, rate: "0%", breakdown: lang === "ru" ? "Налог не взимается" : "No tax", net: totalRub };
  };

  const calcConversionCosts = (count: number) => {
    const K = strikePriceUsd * usdRubRate * count;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueUsd * usdRubRate * count * 0.8;
    const N = M - (K + L);
    const conversionTax = residency === "russia" && N > 0 ? calculateNdfl(N).tax : 0; // Conversion tax only for Russia (Kazakhstan AIFC exemption on conversion)
    const regFee = 100;
    const regCostRub = regFee * usdRubRate;
    const totalCost = K + regCostRub + conversionTax;
    return { K, L, M, N, conversionTax, regCostRub, regFee, totalCost };
  };

  const reset = () => {
    setStep(0);
    setOwnership(null);
    setSharesCount(0);
    setOptionsCount(0);
    setPlanToConvert(null);
  };

  const taxLabel = residency === "russia" ? (lang === "ru" ? "НДФЛ" : "Income tax") : residency === "kazakhstan" ? (lang === "ru" ? "ИПН" : "IIT") : (lang === "ru" ? "Удерживаемый налог" : "Withholding tax");
  const taxTypeLabel = residency === "russia" ? t("tax.divTaxLabel.russia") : residency === "kazakhstan" ? (hasCertificate ? t("tax.divTaxLabel.kazakhstan10") : t("tax.divTaxLabel.kazakhstan15")) : t("tax.divTaxLabel.other");

  const renderOwnershipScreen = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">{t("div.whatDoYouHave")}</h3>
      <div className="space-y-3">
        {([
          { value: "only_shares" as const, label: t("div.onlyShares"), desc: t("div.onlySharesDesc") },
          { value: "only_options" as const, label: t("div.onlyOptions"), desc: t("div.onlyOptionsDesc") },
          { value: "both" as const, label: t("div.both"), desc: t("div.bothDesc") },
        ]).map(opt => (
          <button
            key={opt.value}
            onClick={() => { setOwnership(opt.value); setStep(1); }}
            className="w-full p-4 rounded-xl border-2 text-left transition-all hover:border-primary/50 hover:bg-primary/5 active:scale-[0.98]"
          >
            <p className="font-medium text-foreground">{opt.label}</p>
            <p className="text-sm text-muted-foreground">{opt.desc}</p>
          </button>
        ))}
      </div>
    </div>
  );

  const renderSharesInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("div.shareData")}</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>{t("common.sharesCount")}</Label>
          <Input type="number" placeholder="0" value={sharesCount || ""} onChange={e => setSharesCount(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>{t("common.dividendPerShare")}</Label>
          <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!sharesCount || !dividendPerShare} className="w-full">
        {t("common.calculate")} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderResidencySelector = () => (
    <div className="space-y-3 mb-4">
      <div className="flex items-center gap-3">
        <Label className="text-sm whitespace-nowrap">{t("common.residency")}</Label>
        <Select value={residency} onValueChange={(v) => setResidency(v as Residency)}>
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="russia">{t("common.russia")}</SelectItem>
            <SelectItem value="kazakhstan">{t("common.kazakhstan")}</SelectItem>
            <SelectItem value="other">{t("common.other")}</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {residency === "kazakhstan" && (
        <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
          <input
            type="checkbox"
            id="certificate"
            checked={hasCertificate}
            onChange={(e) => setHasCertificate(e.target.checked)}
            className="w-4 h-4 rounded border-muted-foreground"
          />
          <label htmlFor="certificate" className="text-sm text-foreground cursor-pointer">
            {t("div.hasCertificate")}
          </label>
        </div>
      )}
    </div>
  );

  const renderSharesResult = () => {
    const { totalRub, tax, rate, breakdown, net } = calcDividends(sharesCount);

    if (residency === "kazakhstan") {
      return (
        <div className="space-y-4">
          {renderResidencySelector()}
          <h3 className="text-lg font-semibold">{t("common.result")}</h3>
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-5 w-5 text-primary" />
            <AlertTitle className="text-foreground font-semibold">{t("div.kazDivTaxTitle")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("div.kazDivTaxDesc")}
            </AlertDescription>
          </Alert>
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">{t("common.amountToReceive")}</p>
            <p className="text-4xl font-bold">{formatCurrency(net)}</p>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground">{lang === "ru" ? "Применяемый налог" : "Applied tax"}: <span className="font-semibold text-foreground">{taxTypeLabel}</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.dividendsBeforeTax")}</p>
              <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
            </div>
            <div className="p-4 rounded-lg border bg-destructive/5">
              <p className="text-sm text-muted-foreground mb-1">{t("common.expenses")}</p>
              <p className="text-lg font-bold">{formatCurrency(tax)}</p>
              <p className="text-xs text-muted-foreground mt-1">{taxLabel} ({rate})</p>
            </div>
            <div className="p-4 rounded-lg border bg-success/10">
              <p className="text-sm text-muted-foreground mb-1">{t("div.total")}</p>
              <p className="text-lg font-bold text-success">{formatCurrency(net)}</p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">{breakdown}</p>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t("tax.dividends.taxWithheldByCompanyGeneric")}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (residency === "other") {
      const otherTax = totalRub * 0.15;
      const otherNet = totalRub - otherTax;
      return (
        <div className="space-y-4">
          {renderResidencySelector()}
          <h3 className="text-lg font-semibold">{t("common.result")}</h3>
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">{t("tax.dividends.otherCountryInfo")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("tax.dividends.otherCountryDesc")}
            </AlertDescription>
          </Alert>
          <div className="p-3 rounded-lg bg-muted/50 border">
            <p className="text-xs text-muted-foreground">{lang === "ru" ? "Применяемый налог" : "Applied tax"}: <span className="font-semibold text-foreground">{taxTypeLabel}</span></p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-4 rounded-lg border bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">{t("common.dividendsBeforeTax")}</p>
              <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
            </div>
            <div className="p-4 rounded-lg border bg-destructive/5">
              <p className="text-sm text-muted-foreground mb-1">{t("common.expenses")}</p>
              <p className="text-lg font-bold">{formatCurrency(otherTax)}</p>
              <p className="text-xs text-muted-foreground mt-1">{taxLabel} (15%)</p>
            </div>
            <div className="p-4 rounded-lg border bg-success/10">
              <p className="text-sm text-muted-foreground mb-1">{t("div.total")}</p>
              <p className="text-lg font-bold text-success">{formatCurrency(otherNet)}</p>
            </div>
          </div>
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>{t("tax.dividends.taxWithheldByCompanyGeneric")}</AlertDescription>
          </Alert>
        </div>
      );
    }

    // Russia
    return (
      <div className="space-y-4">
        {renderResidencySelector()}
        <h3 className="text-lg font-semibold">{t("common.result")}</h3>
        <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
          <p className="text-sm opacity-90 mb-1">{t("common.amountToReceive")}</p>
          <p className="text-4xl font-bold">{formatCurrency(net)}</p>
        </div>
        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">{lang === "ru" ? "Применяемый налог" : "Applied tax"}: <span className="font-semibold text-foreground">{taxTypeLabel}</span></p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="p-4 rounded-lg border bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">{t("common.dividendsBeforeTax")}</p>
            <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
          </div>
          <div className="p-4 rounded-lg border bg-destructive/5">
            <p className="text-sm text-muted-foreground mb-1">{t("common.expenses")}</p>
            <p className="text-lg font-bold">{formatCurrency(tax)}</p>
            <p className="text-xs text-muted-foreground mt-1">{taxLabel} ({rate})</p>
          </div>
          <div className="p-4 rounded-lg border bg-success/10">
            <p className="text-sm text-muted-foreground mb-1">{t("div.total")}</p>
            <p className="text-lg font-bold text-success">{formatCurrency(net)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{breakdown}</p>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            {t("tax.dividends.taxWithheldByCompanyGeneric")}
          </AlertDescription>
        </Alert>

        <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="font-medium text-foreground">{t("div.alreadyShareholder")}</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm text-muted-foreground">{t("div.noActionNeeded")}</p>
          </div>
        </div>
      </div>
    );
  };

  const renderOptionsInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("div.optionData")}</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>{t("div.vestedOptions")}</Label>
          <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!optionsCount} className="w-full">
        {t("common.next")} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderOptionsPlanScreen = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("div.planToConvert")}</h3>
      <div className="space-y-3">
        <button
          onClick={() => { setPlanToConvert(true); setStep(3); }}
          className="w-full p-4 rounded-xl border-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <p className="font-medium">{t("div.yesPlanConvert")}</p>
        </button>
        <button
          onClick={() => { setPlanToConvert(false); setStep(3); }}
          className="w-full p-4 rounded-xl border-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <p className="font-medium">{t("div.noPlanConvert")}</p>
        </button>
      </div>
    </div>
  );

  const renderOptionsCalculation = () => {
    if (planToConvert === false) {
      return (
        <div className="space-y-4">
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">{t("div.dividendsUnavailable")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("div.dividendsUnavailableDesc")}
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => navigate("/convert")} className="w-full">
            {t("div.learnConvert")} <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {renderResidencySelector()}
        <h3 className="text-lg font-semibold">{t("div.calcOnConversion")}</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("common.dividendPerShare")}</Label>
              <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.strikePrice")}</Label>
              <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("common.fairValueUsd")}</Label>
            <Input type="number" step="0.01" placeholder="0" value={fairValueUsd || ""} onChange={e => setFairValueUsd(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">{t("common.fairValueHint")}</p>
          </div>
          <div className="space-y-2">
            <Label>{t("common.usdRubRate")}</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.01" value={usdRubRate || ""} onChange={e => setUsdRubRate(Number(e.target.value))} />
              <button onClick={fetchRate} disabled={isLoadingRate} className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm shrink-0">
                <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} /> {t("common.cbrRate")}
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>{t("div.vestedOptionsLabel")}</Label>
            <Input type="number" placeholder={String(optionsCount || 0)} value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} disabled />
            <p className="text-xs text-muted-foreground">{t("div.fromPreviousStep")}</p>
          </div>
        </div>

        {dividendPerShare > 0 && fairValueUsd > 0 && (() => {
          const divs = calcDividends(optionsCount);
          const conv = calcConversionCosts(optionsCount);
          const totalExpenses = conv.totalCost + divs.tax;
          const netAfterAll = divs.net - conv.totalCost;

          return (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-3 rounded-lg bg-muted/50 border">
                <p className="text-xs text-muted-foreground">{lang === "ru" ? "Налог на дивиденды" : "Dividend tax"}: <span className="font-semibold text-foreground">{taxTypeLabel}</span></p>
                <p className="text-xs text-muted-foreground mt-0.5">{lang === "ru" ? "Налог на конвертацию" : "Conversion tax"}: <span className="font-semibold text-foreground">{residency === "russia" ? t("tax.convTaxLabel.russia") : residency === "kazakhstan" ? t("tax.convTaxLabel.kazakhstan") : t("tax.convTaxLabel.other")}</span></p>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-semibold mb-2">{t("div.whatYouPayNow")}</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("div.strikeLabel")}</span><span className="font-medium">{formatCurrency(conv.K)}</span></div>
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("div.registrationLabel")}</span><span className="font-medium">{formatCurrency(conv.regCostRub)}</span></div>
                  {conv.conversionTax > 0 && (
                    <div className="flex justify-between"><span className="text-muted-foreground">{t("div.conversionTaxLabel")}</span><span className="font-medium">{formatCurrency(conv.conversionTax)}</span></div>
                  )}
                  <div className="flex justify-between pt-1 border-t font-semibold"><span>{t("div.total")}</span><span>{formatCurrency(conv.totalCost)}</span></div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm font-semibold mb-2">{t("div.whatYouReceive")}</p>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{t("common.dividendsBeforeTax")}</span>
                  <span className="font-bold text-lg">{formatCurrency(divs.totalRub)}</span>
                </div>
              </div>

              {residency === "kazakhstan" && (
                <Alert className="border-primary/30 bg-primary/5">
                  <Info className="h-4 w-4 text-primary" />
                  <AlertDescription className="text-sm">{t("div.kazDivTaxWithheld")}</AlertDescription>
                </Alert>
              )}
              {residency === "other" && (
                <Alert className="border-warning/30 bg-warning/5">
                  <AlertTriangle className="h-4 w-4 text-warning" />
                  <AlertDescription className="text-sm">{t("div.checkLocalTax")}</AlertDescription>
                </Alert>
              )}

              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  {t("div.mustBeShareholderBy")} <strong>20 {lang === "ru" ? "апреля" : "April"} 2026</strong>.
                </AlertDescription>
              </Alert>
            </div>
          );
        })()}
      </div>
    );
  };

  const renderBothInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">{t("div.bothData")}</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("common.sharesCount")}</Label>
            <Input type="number" placeholder="0" value={sharesCount || ""} onChange={e => setSharesCount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>{t("div.vestedOptionsLabel")}</Label>
            <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>{t("common.dividendPerShare")}</Label>
            <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>{t("common.strikePrice")}</Label>
            <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>{t("common.fairValueUsd")}</Label>
          <Input type="number" step="0.01" placeholder="0" value={fairValueUsd || ""} onChange={e => setFairValueUsd(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">{t("common.fairValueHint")}</p>
        </div>
        <div className="space-y-2">
          <Label>{t("common.usdRubRate")}</Label>
          <div className="flex gap-2">
            <Input type="number" step="0.01" value={usdRubRate || ""} onChange={e => setUsdRubRate(Number(e.target.value))} />
            <button onClick={fetchRate} disabled={isLoadingRate} className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm shrink-0">
              <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} /> {t("common.cbrRate")}
            </button>
          </div>
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!sharesCount || !optionsCount || !dividendPerShare || !fairValueUsd} className="w-full">
        {t("div.compareScenarios")} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderBothResult = () => {
    const scenario1 = calcDividends(sharesCount);
    const totalShares = sharesCount + optionsCount;
    const scenario2Divs = calcDividends(totalShares);
    const conv = calcConversionCosts(optionsCount);
    const scenario2Net = scenario2Divs.net - conv.totalCost;
    const diff = scenario2Net - scenario1.net;

    return (
      <div className="space-y-6">
        {renderResidencySelector()}
        <h3 className="text-lg font-semibold">{t("div.comparativeCalc")}</h3>

        <div className="p-3 rounded-lg bg-muted/50 border">
          <p className="text-xs text-muted-foreground">{lang === "ru" ? "Налог на дивиденды" : "Dividend tax"}: <span className="font-semibold text-foreground">{taxTypeLabel}</span></p>
          <p className="text-xs text-muted-foreground mt-0.5">{lang === "ru" ? "Налог на конвертацию" : "Conversion tax"}: <span className="font-semibold text-foreground">{residency === "russia" ? t("tax.convTaxLabel.russia") : residency === "kazakhstan" ? t("tax.convTaxLabel.kazakhstan") : t("tax.convTaxLabel.other")}</span></p>
        </div>

        {residency === "kazakhstan" && (
          <Alert className="border-primary/30 bg-primary/5">
            <Info className="h-4 w-4 text-primary" />
            <AlertDescription className="text-sm">
              {t("div.kazDivTaxWithheld")}
            </AlertDescription>
          </Alert>
        )}

        {residency === "other" && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              {t("div.otherNoTaxAifc")}
            </AlertDescription>
          </Alert>
        )}

        {/* Scenario 1 */}
        <div className="p-4 rounded-xl border-2 border-muted space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">1</span>
            {t("div.noConversion")}
          </h4>
          <p className="text-sm text-muted-foreground">{t("div.dividendsOnCurrentShares")} {sharesCount} {t("div.sharesWord")}</p>
          <div className={`grid gap-2 ${residency === "russia" || residency === "kazakhstan" ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">{t("div.beforeTax")}</p>
              <p className="font-bold">{formatCurrency(scenario1.totalRub)}</p>
            </div>
            {(residency === "russia" || residency === "kazakhstan") && (
              <div className="p-3 rounded-lg bg-destructive/5">
                <p className="text-xs text-muted-foreground">{t("common.expenses")}</p>
                <p className="font-bold">{formatCurrency(scenario1.tax)}</p>
                <p className="text-[10px] text-muted-foreground">{taxLabel} ({scenario1.rate})</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-muted-foreground">{t("div.total")}</p>
              <p className="font-bold text-success">{formatCurrency(scenario1.net)}</p>
            </div>
          </div>
        </div>

        {/* Scenario 2 */}
        <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            {t("div.withConversion")}
          </h4>
          <p className="text-sm text-muted-foreground">{t("div.dividendsOnAllShares")} {totalShares} {t("div.sharesCurrentPlusConverted")}</p>
          <div className="space-y-2">
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold mb-1">{t("div.whatYouPayNow")}</p>
              <div className="space-y-0.5 text-xs">
                <div className="flex justify-between"><span className="text-muted-foreground">{t("div.strikeLabel")}</span><span className="font-medium">{formatCurrency(conv.K)}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">{t("div.registrationLabel")}</span><span className="font-medium">{formatCurrency(conv.regCostRub)}</span></div>
                {conv.conversionTax > 0 && (
                  <div className="flex justify-between"><span className="text-muted-foreground">{t("div.conversionTaxLabel")}</span><span className="font-medium">{formatCurrency(conv.conversionTax)}</span></div>
                )}
                <div className="flex justify-between pt-1 border-t font-semibold text-sm"><span>{t("div.total")}</span><span>{formatCurrency(conv.totalCost)}</span></div>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-muted/50 border">
              <p className="text-xs font-semibold mb-1">{t("div.whatYouReceive")}</p>
              <div className="flex justify-between text-xs">
                <span className="text-muted-foreground">{t("common.dividendsBeforeTax")}</span>
                <span className="font-bold text-sm">{formatCurrency(scenario2Divs.totalRub)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Decision summary */}
        <div className={`p-5 rounded-xl border-2 ${diff > 0 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
          <div className="flex items-start gap-3">
            {diff > 0 ? <TrendingUp className="w-5 h-5 text-success shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />}
            <div className="space-y-2 text-sm">
              <p><strong>{t("div.ifConvert")}</strong> — {t("div.total").toLowerCase()} {formatCurrency(Math.max(0, scenario2Net))}</p>
              <p><strong>{t("div.ifNotConvert")}</strong> — {t("div.total").toLowerCase()} {formatCurrency(scenario1.net)}</p>
              <p className="pt-1 font-medium">
                {diff > 0
                  ? `${t("div.conversionIncreases")} ${formatCurrency(diff)}.`
                  : `${t("div.conversionDecreases")} ${formatCurrency(Math.abs(diff))}.`
                }
              </p>
              <p className="text-xs text-muted-foreground italic pt-1">{t("div.noPressure")}</p>
            </div>
          </div>
        </div>

        {residency === "russia" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              {t("div.simplifiedCalcDisclaimer")}
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  const renderCurrentStep = () => {
    if (step === 0) return renderOwnershipScreen();
    if (ownership === "only_shares") {
      if (step === 1) return renderSharesInput();
      if (step === 2) return renderSharesResult();
    }
    if (ownership === "only_options") {
      if (step === 1) return renderOptionsInput();
      if (step === 2) return renderOptionsPlanScreen();
      if (step === 3) return renderOptionsCalculation();
    }
    if (ownership === "both") {
      if (step === 1) return renderBothInput();
      if (step === 2) return renderBothResult();
    }
    return null;
  };

  const canGoBack = step > 0;

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => canGoBack ? (step === 1 ? reset() : setStep(step - 1)) : navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{t("div.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("div.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        {ownership && (
          <div className="flex gap-1">
            {Array.from({ length: ownership === "both" ? 3 : ownership === "only_options" ? 4 : 3 }).map((_, i) => (
              <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= step ? 'bg-primary' : 'bg-muted'}`} />
            ))}
          </div>
        )}

        <Card className="shadow-card">
          <CardContent className="pt-6">
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {step > 0 && (
          <div className="flex justify-center">
            <Button variant="ghost" size="sm" onClick={reset} className="text-muted-foreground">
              {t("common.startOver")}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
