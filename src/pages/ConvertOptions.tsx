import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Info, ExternalLink, RefreshCw, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";

type Residency = "russia" | "kazakhstan" | "other";

const REGISTRATION_FEE = 100;

export default function ConvertOptions() {
  const navigate = useNavigate();
  const { t, lang } = useLanguage();
  const [screen, setScreen] = useState(0);
  const [residency, setResidency] = useState<Residency>("russia");

  const [strikePriceUsd, setStrikePriceUsd] = useState(0.01);
  const [fairValueUsd, setFairValueUsd] = useState(0);
  const [optionsCount, setOptionsCount] = useState(0);
  const [usdRubRate, setUsdRubRate] = useState(100);
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
    return { tax: baseTax + excessTax, rate: "13% + 15%", breakdown: `${formatCurrency(threshold)} × 13% + ${formatCurrency(income - threshold)} × 15% = ${formatCurrency(baseTax + excessTax)}` };
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

  const steps = [
    t("convert.step1"), t("convert.step2"), t("convert.step3"), t("convert.step4"),
    t("convert.step5"), t("convert.step6"), t("convert.step7"), t("convert.step8"), t("convert.step9"),
  ];

  const renderExplanation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 py-6">
        <div className="p-4 rounded-2xl bg-muted text-center">
          <p className="text-2xl">📋</p>
          <p className="text-xs font-medium mt-1">{t("convert.option")}</p>
        </div>
        <ArrowRight className="w-6 h-6 text-primary" />
        <div className="p-4 rounded-2xl bg-primary/10 text-center">
          <p className="text-2xl">🔄</p>
          <p className="text-xs font-medium mt-1">{t("convert.transfer")}</p>
        </div>
        <ArrowRight className="w-6 h-6 text-primary" />
        <div className="p-4 rounded-2xl bg-success/10 text-center">
          <p className="text-2xl">📈</p>
          <p className="text-xs font-medium mt-1">{t("convert.share")}</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/50 space-y-3">
        <p className="font-medium text-foreground">{t("convert.sharesGive")}</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>{t("convert.dividendRight")}</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>{t("convert.saleRight")}</span>
          </li>
        </ul>
      </div>

      <Button onClick={() => setScreen(1)} className="w-full">
        {t("convert.stepByStep")} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderSteps = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">{t("convert.fillFormIntro")}</p>
        <a href="https://pyrus.com/form/1437842" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          {t("convert.fillForm")} <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-foreground">{t("convert.stepByStepProcess")}</p>
        <ol className="space-y-2 text-sm text-muted-foreground list-none">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-2">
              <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary/10 text-primary text-xs font-bold shrink-0 mt-0.5">{i + 1}</span>
              <span>{s}</span>
            </li>
          ))}
        </ol>
      </div>

      <Button onClick={() => setScreen(2)} className="w-full">
        {t("convert.calculateTax")} <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderCalculator = () => {
    const K = strikePriceUsd * usdRubRate * optionsCount;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueUsd * usdRubRate * optionsCount * 0.8;
    const N = M - (K + L);
    const actualCostUsd = strikePriceUsd * optionsCount;
    const totalFormalizationUsd = actualCostUsd + REGISTRATION_FEE;
    const totalFormalizationRub = K + L;

    const renderResult = () => {
      if (residency === "russia") {
        const { tax, rate, breakdown } = calculateNdfl(N);
        const totalExpenses = tax + L + K;
        const netShareValue = M - totalExpenses;

        return (
          <div className="space-y-4 pt-4 border-t">
            <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">{t("convert.executionAndRegistration")}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
                <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t("convert.cost")} {formatCurrency(actualCostUsd, "USD")} + {t("tax.conversion.registration")} {formatCurrency(REGISTRATION_FEE, "USD")}</p>
            </div>

            <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
              <p className="text-sm opacity-90 mb-1">{t("tax.conversion.ndflToPay")} ({rate})</p>
              <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
              <p className="text-xs opacity-75 mt-2">{breakdown}</p>
            </div>

            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">{t("common.taxableIncome")} (N)</p>
              <p className="text-2xl font-bold">{formatCurrency(Math.max(0, N))}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">{t("common.totalExpenses")}</p>
                <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground">{t("tax.conversion.ndflPlusTaxRate")}</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">{t("common.netShareValue")}</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netShareValue))}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p className="text-muted-foreground">{t("common.formula")}</p>
              <p><span className="font-medium">K</span>: {formatCurrency(strikePriceUsd, "USD")} × {usdRubRate} × {optionsCount} = {formatCurrency(K)}</p>
              <p><span className="font-medium">L</span>: {formatCurrency(REGISTRATION_FEE, "USD")} × {usdRubRate} = {formatCurrency(L)}</p>
              <p><span className="font-medium">M</span>: {formatCurrency(fairValueUsd, "USD")} × {usdRubRate} × {optionsCount} × 0.8 = {formatCurrency(M)}</p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>{t("tax.conversion.ndflSelfPay")}</AlertDescription>
            </Alert>
          </div>
        );
      }

      if (residency === "kazakhstan") {
        const netShareValue = M - L;

        return (
          <div className="space-y-4 pt-4 border-t">
            <Alert className="border-success/30 bg-success/5">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <AlertTitle className="text-success font-semibold">{t("tax.conversion.noIpn")}</AlertTitle>
              <AlertDescription className="text-muted-foreground mt-2">
                {t("tax.conversion.noIpnDesc")}
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">{t("convert.executionAndRegistration")}</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
                <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">{t("common.expenses")}</p>
                <p className="text-lg font-semibold">{formatCurrency(totalFormalizationRub)}</p>
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
      return (
        <div className="space-y-4 pt-4 border-t">
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">{t("tax.conversion.analysisNeeded")}</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              {t("tax.conversion.analysisDesc")}
            </AlertDescription>
          </Alert>

          <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">{t("convert.executionAndRegistration")}</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
              <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
            <p><span className="font-medium">N</span> ({t("common.potentialTaxBase")}): {formatCurrency(Math.max(0, N))}</p>
            <p><span className="font-medium">M</span> ({t("common.marketValueMinus20")}): {formatCurrency(M)}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">{t("tax.conversion.shareValueNoLocalTax")}</p>
            <p className="text-lg font-semibold">{formatCurrency(Math.max(0, M - totalFormalizationRub))}</p>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">{t("convert.taxOnConversion")}</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>{t("common.taxResidency")}</Label>
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
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>{t("common.strikePrice")}</Label>
              <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>{t("common.optionsCount")}</Label>
              <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
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

        {optionsCount > 0 && fairValueUsd > 0 && renderResult()}
      </div>
    );
  };

  const screens = [renderExplanation, renderSteps, renderCalculator];

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => screen > 0 ? setScreen(screen - 1) : navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{t("convert.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("convert.subtitle")}</p>
          </div>
          <LanguageSwitcher />
        </div>

        <div className="flex gap-1">
          {[0, 1, 2].map(i => (
            <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= screen ? 'bg-primary' : 'bg-muted'}`} />
          ))}
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            {screens[screen]()}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
