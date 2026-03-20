import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, AlertTriangle, Info, Coins, RefreshCw, TrendingUp, ChevronRight } from "lucide-react";

type OwnershipType = null | "only_shares" | "only_options" | "both";
type Residency = "russia" | "kazakhstan" | "other";

const formatCurrency = (value: number, currency: "RUB" | "USD" = "RUB"): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency,
    minimumFractionDigits: currency === "USD" ? 2 : 0,
    maximumFractionDigits: currency === "USD" ? 2 : 0,
  }).format(value);
};

const calculateNdfl = (income: number) => {
  if (income <= 0) return { tax: 0, rate: "0%", breakdown: "Нет дохода" };
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

const REGISTRATION_FEE = 100;

export default function DividendsFlow() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [residency, setResidency] = useState<Residency>("russia");
  const [ownership, setOwnership] = useState<OwnershipType>(null);
  const [sharesCount, setSharesCount] = useState(0);
  const [optionsCount, setOptionsCount] = useState(0);
  const [dividendPerShare, setDividendPerShare] = useState(0);
  const [usdRubRate, setUsdRubRate] = useState(100);
  const [planToConvert, setPlanToConvert] = useState<boolean | null>(null);
  const [strikePriceUsd, setStrikePriceUsd] = useState(0.01);
  const [fairValueRub, setFairValueRub] = useState(0);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

  useEffect(() => {
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => {
        const rate = data.Valute?.USD?.Value;
        if (rate) setUsdRubRate(Math.round(rate * 100) / 100);
      })
      .catch(() => {});
  }, []);

  const fetchRate = () => {
    setIsLoadingRate(true);
    fetch("https://www.cbr-xml-daily.ru/daily_json.js")
      .then(r => r.json())
      .then(data => {
        const rate = data.Valute?.USD?.Value;
        if (rate) setUsdRubRate(Math.round(rate * 100) / 100);
      })
      .finally(() => setIsLoadingRate(false));
  };

  const calcDividends = (shares: number) => {
    const totalRub = dividendPerShare * shares;
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(totalRub);
      return { totalRub, tax, rate, breakdown, net: totalRub - tax };
    }
    // Kazakhstan & Other: no dividend tax from AIFC company
    return { totalRub, tax: 0, rate: "0%", breakdown: "Налог не взимается", net: totalRub };
  };

  const calcConversionCosts = (count: number) => {
    const K = strikePriceUsd * usdRubRate * count;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueRub * count * 0.8;
    const N = M - (K + L);
    const conversionTax = residency === "russia" && N > 0 ? calculateNdfl(N).tax : 0;
    // "both" = уже акционер (315), "only_options" = новый (515)
    const regFee = ownership === "both" ? 315 : 515;
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

  const taxLabel = residency === "russia" ? "НДФЛ" : residency === "kazakhstan" ? "ИПН" : "Налог";

  // --- SCREENS ---

  const renderOwnershipScreen = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-foreground">Что у вас сейчас есть?</h3>
      <div className="space-y-3">
        {([
          { value: "only_shares" as const, label: "Только акции", desc: "У меня уже есть акции компании" },
          { value: "only_options" as const, label: "Только опционы", desc: "У меня есть опционы, но акций нет" },
          { value: "both" as const, label: "И акции, и опционы", desc: "У меня есть и акции, и опционы" },
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

  // -- Only Shares Flow --
  const renderSharesInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Данные по акциям</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Количество акций</Label>
          <Input type="number" placeholder="0" value={sharesCount || ""} onChange={e => setSharesCount(Number(e.target.value))} />
        </div>
        <div className="space-y-2">
          <Label>Дивиденд на акцию (₽)</Label>
          <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!sharesCount || !dividendPerShare} className="w-full">
        Рассчитать <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderResidencySelector = () => (
    <div className="flex items-center gap-3 mb-4">
      <Label className="text-sm whitespace-nowrap">Резидентство</Label>
      <Select value={residency} onValueChange={(v) => setResidency(v as Residency)}>
        <SelectTrigger className="w-full">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="russia">🇷🇺 Россия</SelectItem>
          <SelectItem value="kazakhstan">🇰🇿 Казахстан</SelectItem>
          <SelectItem value="other">🌍 Другая страна</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );

  const renderSharesResult = () => {
    const { totalRub, tax, rate, breakdown, net } = calcDividends(sharesCount);

    if (residency === "kazakhstan") {
      return (
        <div className="space-y-4">
          {renderResidencySelector()}
          <h3 className="text-lg font-semibold">Результат</h3>
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-5 w-5 text-success" />
            <AlertTitle className="text-success font-semibold">ИПН не взимается</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Для резидентов Казахстана дивиденды от компании МФЦА не облагаются ИПН.
            </AlertDescription>
          </Alert>
          <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
            <p className="text-sm opacity-90 mb-1">Сумма к получению</p>
            <p className="text-4xl font-bold">{formatCurrency(net)}</p>
          </div>
          <div className="p-4 rounded-lg border bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">Дивиденды</p>
            <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
          </div>
        </div>
      );
    }

    if (residency === "other") {
      return (
        <div className="space-y-4">
          {renderResidencySelector()}
          <h3 className="text-lg font-semibold">Результат</h3>
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              В Казахстане (МФЦА) налог на дивиденды не взимается. Проанализируйте законодательство страны вашего резидентства для определения ставки налога.
            </AlertDescription>
          </Alert>
          <div className="p-4 rounded-lg border bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">Сумма дивидендов</p>
            <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
          </div>
        </div>
      );
    }

    // Russia
    return (
      <div className="space-y-4">
        {renderResidencySelector()}
        <h3 className="text-lg font-semibold">Результат</h3>
        <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
          <p className="text-sm opacity-90 mb-1">Сумма к получению</p>
          <p className="text-4xl font-bold">{formatCurrency(net)}</p>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-4 rounded-lg border bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">Дивиденды до налога</p>
            <p className="text-lg font-bold">{formatCurrency(totalRub)}</p>
          </div>
          <div className="p-4 rounded-lg border bg-destructive/5">
            <p className="text-sm text-muted-foreground mb-1">{taxLabel} ({rate})</p>
            <p className="text-lg font-bold">{formatCurrency(tax)}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{breakdown}</p>

        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Необходимо самостоятельно подать декларацию 3-НДФЛ и уплатить НДФЛ до 15 июля года, следующего за годом получения дивидендов.
          </AlertDescription>
        </Alert>

        <div className="p-4 rounded-xl bg-success/10 border border-success/20 space-y-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="font-medium text-foreground">Вы уже являетесь держателем акций</p>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-success shrink-0" />
            <p className="text-sm text-muted-foreground">Дополнительных действий не требуется (при владении на дату закрытия реестра)</p>
          </div>
        </div>
      </div>
    );
  };

  // -- Only Options Flow --
  const renderOptionsInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Данные по опционам</h3>
      <div className="space-y-3">
        <div className="space-y-2">
          <Label>Сколько опционов прошло вестинг?</Label>
          <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!optionsCount} className="w-full">
        Далее <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderOptionsPlanScreen = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Планируете перевести опционы в акции до 20 апреля 2026?</h3>
      <div className="space-y-3">
        <button
          onClick={() => { setPlanToConvert(true); setStep(3); }}
          className="w-full p-4 rounded-xl border-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <p className="font-medium">Да, планирую конвертировать</p>
        </button>
        <button
          onClick={() => { setPlanToConvert(false); setStep(3); }}
          className="w-full p-4 rounded-xl border-2 text-left hover:border-primary/50 hover:bg-primary/5 transition-all"
        >
          <p className="font-medium">Нет, пока не планирую</p>
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
            <AlertTitle className="text-warning font-semibold">Дивиденды недоступны</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              Чтобы участвовать в выплате дивидендов, необходимо стать держателем акций до 20 апреля 2026 года. Опционы не дают права на получение дивидендов.
            </AlertDescription>
          </Alert>
          <Button variant="outline" onClick={() => navigate("/convert")} className="w-full">
            Узнать как перевести опционы в акции <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      );
    }

    // planToConvert === true — show calculation
    return (
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Расчёт при конвертации</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Дивиденд на акцию (₽)</Label>
              <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Цена исполнения ($)</Label>
              <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Текущая стоимость акции (₽)</Label>
            <Input type="number" placeholder="3800" value={fairValueRub || ""} onChange={e => setFairValueRub(Number(e.target.value))} />
            <p className="text-xs text-muted-foreground">3800 ₽ при оценке $228 млн на 01.01.2025</p>
          </div>
          <div className="space-y-2">
            <Label>Курс USD/RUB</Label>
            <div className="flex gap-2">
              <Input type="number" step="0.01" value={usdRubRate || ""} onChange={e => setUsdRubRate(Number(e.target.value))} />
              <button onClick={fetchRate} disabled={isLoadingRate} className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm shrink-0">
                <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} /> ЦБ РФ
              </button>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Опционы (прошли вестинг)</Label>
            <Input type="number" placeholder={String(optionsCount || 0)} value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} disabled />
            <p className="text-xs text-muted-foreground">Значение с предыдущего шага</p>
          </div>
        </div>

        {dividendPerShare > 0 && fairValueRub > 0 && (() => {
          const divs = calcDividends(optionsCount);
          const conv = calcConversionCosts(optionsCount);
          const netAfterAll = divs.net - conv.totalCost;

          return (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                <div className="flex items-center gap-2 mb-1"><Coins className="w-4 h-4 text-primary" /><p className="text-sm text-muted-foreground">Потенциальные дивиденды после конвертации</p></div>
                <p className="text-2xl font-bold">{formatCurrency(divs.totalRub)}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {residency === "russia" && (
                  <>
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-1">🧾 {taxLabel} при конвертации</p>
                      <p className="text-lg font-bold">{formatCurrency(conv.conversionTax)}</p>
                    </div>
                    <div className="p-4 rounded-lg border bg-muted/20">
                      <p className="text-xs text-muted-foreground mb-1">🧾 {taxLabel} на дивиденды</p>
                      <p className="text-lg font-bold">{formatCurrency(divs.tax)}</p>
                    </div>
                  </>
                )}
                {residency === "kazakhstan" && (
                  <div className="p-4 rounded-lg border bg-success/10 col-span-2">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <p className="text-sm text-success font-medium">ИПН не взимается (льгота МФЦА)</p>
                    </div>
                  </div>
                )}
                {residency === "other" && (
                  <div className="p-4 rounded-lg border bg-warning/10 col-span-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-warning" />
                      <p className="text-sm text-warning font-medium">Проверьте налоговое законодательство вашей страны</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
                <p className="text-sm opacity-90 mb-1">💵 Итог к получению (дивиденды − все расходы)</p>
                <p className="text-4xl font-bold">{formatCurrency(Math.max(0, netAfterAll))}</p>
                {residency === "other" && (
                  <p className="text-xs opacity-75 mt-1">Без учёта возможного местного налога</p>
                )}
              </div>

              <Alert className="border-warning/30 bg-warning/5">
                <AlertTriangle className="h-4 w-4 text-warning" />
                <AlertDescription>
                  Чтобы участвовать в выплате, необходимо стать держателем акций до <strong>20 апреля 2026 года</strong>.
                </AlertDescription>
              </Alert>
            </div>
          );
        })()}
      </div>
    );
  };

  // -- Both Flow --
  const renderBothInput = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Данные по акциям и опционам</h3>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Количество акций</Label>
            <Input type="number" placeholder="0" value={sharesCount || ""} onChange={e => setSharesCount(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Опционы (прошли вестинг)</Label>
            <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Дивиденд на акцию (₽)</Label>
            <Input type="number" step="0.01" placeholder="0" value={dividendPerShare || ""} onChange={e => setDividendPerShare(Number(e.target.value))} />
          </div>
          <div className="space-y-2">
            <Label>Цена исполнения ($)</Label>
            <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Текущая стоимость акции (₽)</Label>
          <Input type="number" placeholder="3800" value={fairValueRub || ""} onChange={e => setFairValueRub(Number(e.target.value))} />
          <p className="text-xs text-muted-foreground">3800 ₽ при оценке $228 млн</p>
        </div>
        <div className="space-y-2">
          <Label>Курс USD/RUB</Label>
          <div className="flex gap-2">
            <Input type="number" step="0.01" value={usdRubRate || ""} onChange={e => setUsdRubRate(Number(e.target.value))} />
            <button onClick={fetchRate} disabled={isLoadingRate} className="px-3 py-2 rounded-md bg-muted hover:bg-muted/80 transition-colors flex items-center gap-2 text-sm shrink-0">
              <RefreshCw className={`w-4 h-4 ${isLoadingRate ? 'animate-spin' : ''}`} /> ЦБ РФ
            </button>
          </div>
        </div>
      </div>
      <Button onClick={() => setStep(2)} disabled={!sharesCount || !optionsCount || !dividendPerShare || !fairValueRub} className="w-full">
        Сравнить сценарии <ChevronRight className="w-4 h-4 ml-1" />
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
        <h3 className="text-lg font-semibold">Сравнительный расчёт</h3>

        {residency === "kazakhstan" && (
          <Alert className="border-success/30 bg-success/5">
            <CheckCircle2 className="h-4 w-4 text-success" />
            <AlertDescription className="text-sm">
              Для резидентов Казахстана ИПН не взимается на дивиденды и конвертацию (льгота МФЦА).
            </AlertDescription>
          </Alert>
        )}

        {residency === "other" && (
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-4 w-4 text-warning" />
            <AlertDescription className="text-sm">
              В МФЦА налог не взимается. Проверьте налоговое законодательство вашей страны — возможно, потребуется уплатить местный налог.
            </AlertDescription>
          </Alert>
        )}

        {/* Scenario 1 */}
        <div className="p-4 rounded-xl border-2 border-muted space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-muted text-xs font-bold">1</span>
            Без конвертации
          </h4>
          <p className="text-sm text-muted-foreground">Дивиденды только по текущим {sharesCount} акциям</p>
          <div className={`grid gap-2 ${residency === "russia" ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <div className="p-3 rounded-lg bg-muted/30">
              <p className="text-xs text-muted-foreground">До налога</p>
              <p className="font-bold">{formatCurrency(scenario1.totalRub)}</p>
            </div>
            {residency === "russia" && (
              <div className="p-3 rounded-lg bg-muted/30">
                <p className="text-xs text-muted-foreground">{taxLabel}</p>
                <p className="font-bold">{formatCurrency(scenario1.tax)}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-muted-foreground">Итого</p>
              <p className="font-bold text-success">{formatCurrency(scenario1.net)}</p>
            </div>
          </div>
        </div>

        {/* Scenario 2 */}
        <div className="p-4 rounded-xl border-2 border-primary/30 bg-primary/5 space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold">2</span>
            С конвертацией
          </h4>
          <p className="text-sm text-muted-foreground">Дивиденды по {totalShares} акциям (текущие + конвертированные)</p>
          <div className="grid grid-cols-2 gap-2">
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Дивиденды до налога</p>
              <p className="font-bold">{formatCurrency(scenario2Divs.totalRub)}</p>
            </div>
            {residency === "russia" && (
              <div className="p-3 rounded-lg bg-background/50">
                <p className="text-xs text-muted-foreground">{taxLabel} на дивиденды</p>
                <p className="font-bold">{formatCurrency(scenario2Divs.tax)}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-background/50">
              <p className="text-xs text-muted-foreground">Расходы на конвертацию</p>
              <p className="font-bold">{formatCurrency(conv.totalCost)}</p>
            </div>
            <div className="p-3 rounded-lg bg-success/10 border border-success/20">
              <p className="text-xs text-muted-foreground">Итого</p>
              <p className="font-bold text-success">{formatCurrency(Math.max(0, scenario2Net))}</p>
            </div>
          </div>
        </div>

        {/* Decision summary */}
        <div className={`p-5 rounded-xl border-2 ${diff > 0 ? 'border-success/30 bg-success/5' : 'border-warning/30 bg-warning/5'}`}>
          <div className="flex items-start gap-3">
            {diff > 0 ? <TrendingUp className="w-5 h-5 text-success shrink-0 mt-0.5" /> : <AlertTriangle className="w-5 h-5 text-warning shrink-0 mt-0.5" />}
            <div className="space-y-2 text-sm">
              <p><strong>Если конвертировать</strong> — итог {formatCurrency(Math.max(0, scenario2Net))}</p>
              <p><strong>Если не конвертировать</strong> — итог {formatCurrency(scenario1.net)}</p>
              <p className="pt-1 font-medium">
                {diff > 0
                  ? `Конвертация увеличит потенциальный доход на ${formatCurrency(diff)}.`
                  : `Конвертация уменьшит доход на ${formatCurrency(Math.abs(diff))}.`
                }
              </p>
              <p className="text-xs text-muted-foreground italic pt-1">Без давления. Только цифры.</p>
            </div>
          </div>
        </div>

        {residency === "russia" && (
          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription className="text-xs">
              Расчёт упрощённый: налог на дивиденды и налог при конвертации рассчитаны раздельно. При совмещении этих доходов в одном году реальная ставка может быть выше из-за прогрессивной шкалы НДФЛ (13% до 2,4 млн ₽, 15% сверх).
            </AlertDescription>
          </Alert>
        )}
      </div>
    );
  };

  // --- RENDER FLOW ---
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
          <div>
            <h1 className="text-xl font-bold text-foreground">Получить дивиденды 2026</h1>
            <p className="text-sm text-muted-foreground">Узнайте, получите ли вы дивиденды и сколько</p>
          </div>
        </div>


        {/* Progress */}
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
              Начать заново
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
