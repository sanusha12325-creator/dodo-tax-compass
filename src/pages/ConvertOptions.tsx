import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, CheckCircle2, AlertTriangle, Info, ExternalLink, RefreshCw, ChevronRight } from "lucide-react";

type Residency = "russia" | "kazakhstan" | "other";

const formatCurrency = (value: number, currency: "RUB" | "USD" = "RUB"): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency", currency,
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
  return { tax: baseTax + excessTax, rate: "13% + 15%", breakdown: `${formatCurrency(threshold)} × 13% + ${formatCurrency(income - threshold)} × 15% = ${formatCurrency(baseTax + excessTax)}` };
};

const REGISTRATION_FEE = 100;

export default function ConvertOptions() {
  const navigate = useNavigate();
  const [screen, setScreen] = useState(0);
  const [residency, setResidency] = useState<Residency>("russia");

  const [strikePriceUsd, setStrikePriceUsd] = useState(0.01);
  const [fairValueRub, setFairValueRub] = useState(0);
  const [optionsCount, setOptionsCount] = useState(0);
  const [usdRubRate, setUsdRubRate] = useState(100);
  const [isLoadingRate, setIsLoadingRate] = useState(false);

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

  const renderExplanation = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-center gap-4 py-6">
        <div className="p-4 rounded-2xl bg-muted text-center">
          <p className="text-2xl">📋</p>
          <p className="text-xs font-medium mt-1">Опцион</p>
        </div>
        <ArrowRight className="w-6 h-6 text-primary" />
        <div className="p-4 rounded-2xl bg-primary/10 text-center">
          <p className="text-2xl">🔄</p>
          <p className="text-xs font-medium mt-1">Перевод</p>
        </div>
        <ArrowRight className="w-6 h-6 text-primary" />
        <div className="p-4 rounded-2xl bg-success/10 text-center">
          <p className="text-2xl">📈</p>
          <p className="text-xs font-medium mt-1">Акция</p>
        </div>
      </div>

      <div className="p-4 rounded-xl bg-muted/50 space-y-3">
        <p className="font-medium text-foreground">Акции дают:</p>
        <ul className="space-y-2 text-sm text-muted-foreground">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Право на получение дивидендов</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" />
            <span>Возможность продажи акций</span>
          </li>
        </ul>
      </div>

      <Button onClick={() => setScreen(1)} className="w-full">
        Пошаговая инструкция <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const steps = [
    "Ты заявляешь о намерении выкупить (оформить) опционы, заполняешь форму.",
    "Происходит подсчёт завестившихся опционов. Мы сообщим о количестве (1–3 дня).",
    "Юристы составляют решение о выпуске акций и договор, направляют на подпись через DocuSign (5–7 дней).",
    "После подписания ты направляешь сканы паспортов (общегражданский + загран) и резюме. Для новых акционеров, для действующих не применимо.",
    "Юристы направляют документы для KYC регистратору (1–3 дня).",
    "Выставляется счёт за регистрацию и KYC: $100 для новых и действующих акционеров.",
    "Счёт на оплату номинальной стоимости акций: $0,01/акция. После выставления нужно оплатить.",
    "Юристы направляют акционерное соглашение с передачей прав голоса Федору (3–5 дней с момента оплаты).",
    "Регистратор оформляет акции и вносит изменения в корпоративный реестр.",
  ];

  const renderSteps = () => (
    <div className="space-y-6">
      <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
        <p className="text-sm text-foreground">Если ты хочешь реализовать право на акции, заполни форму:</p>
        <a href="https://pyrus.com/form/1437842" target="_blank" rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          Заполнить форму <ExternalLink className="w-4 h-4" />
        </a>
      </div>

      <div className="space-y-3">
        <p className="font-medium text-foreground">Пошаговый процесс:</p>
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
        Рассчитать налог при переводе <ChevronRight className="w-4 h-4 ml-1" />
      </Button>
    </div>
  );

  const renderCalculator = () => {
    const K = strikePriceUsd * usdRubRate * optionsCount;
    const L = REGISTRATION_FEE * usdRubRate;
    const M = fairValueRub * optionsCount * 0.8;
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
              <p className="text-sm text-muted-foreground mb-1">Расходы на исполнение и регистрацию</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
                <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Стоимость {formatCurrency(actualCostUsd, "USD")} + регистрация {formatCurrency(REGISTRATION_FEE, "USD")}</p>
            </div>

            <div className="p-6 rounded-xl gradient-primary text-primary-foreground shadow-lg">
              <p className="text-sm opacity-90 mb-1">НДФЛ к уплате ({rate})</p>
              <p className="text-4xl font-bold">{formatCurrency(tax)}</p>
              <p className="text-xs opacity-75 mt-2">{breakdown}</p>
            </div>

            <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
              <p className="text-sm text-muted-foreground mb-1">Налогооблагаемый доход (N)</p>
              <p className="text-2xl font-bold">{formatCurrency(Math.max(0, N))}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">Общие расходы</p>
                <p className="text-lg font-semibold">{formatCurrency(totalExpenses)}</p>
                <p className="text-xs text-muted-foreground">НДФЛ + регистрация + стоимость</p>
              </div>
              <div className="p-4 rounded-lg bg-success/10 border border-success/20">
                <p className="text-sm text-muted-foreground mb-1">Чистая стоимость акций</p>
                <p className="text-lg font-semibold text-success">{formatCurrency(Math.max(0, netShareValue))}</p>
              </div>
            </div>

            <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
              <p className="text-muted-foreground">Формула: N = M − (K + L)</p>
              <p><span className="font-medium">K</span>: {formatCurrency(strikePriceUsd, "USD")} × {usdRubRate} × {optionsCount} = {formatCurrency(K)}</p>
              <p><span className="font-medium">L</span>: {formatCurrency(REGISTRATION_FEE, "USD")} × {usdRubRate} = {formatCurrency(L)}</p>
              <p><span className="font-medium">M</span>: {formatCurrency(fairValueRub)} × {optionsCount} × 0.8 = {formatCurrency(M)}</p>
            </div>

            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>НДФЛ уплачивается самостоятельно. Компания не является налоговым агентом при конвертации.</AlertDescription>
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
              <AlertTitle className="text-success font-semibold">ИПН не взимается</AlertTitle>
              <AlertDescription className="text-muted-foreground mt-2">
                Для резидентов Казахстана при конвертации опционов в акции ИПН не взимается благодаря льготе МФЦА (до 2066 года).
              </AlertDescription>
            </Alert>

            <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
              <p className="text-sm text-muted-foreground mb-1">Расходы на исполнение и регистрацию</p>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
                <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-lg bg-muted/30 border">
                <p className="text-sm text-muted-foreground mb-1">Расходы</p>
                <p className="text-lg font-semibold">{formatCurrency(totalFormalizationRub)}</p>
                <p className="text-xs text-muted-foreground">Только регистрация и стоимость</p>
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
      return (
        <div className="space-y-4 pt-4 border-t">
          <Alert className="border-warning/30 bg-warning/5">
            <AlertTriangle className="h-5 w-5 text-warning" />
            <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
            <AlertDescription className="text-muted-foreground mt-2">
              В Казахстане (МФЦА) ИПН не взимается. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход в виде экономии при покупке акций.
            </AlertDescription>
          </Alert>

          <div className="p-4 rounded-lg border-2 border-muted bg-muted/20">
            <p className="text-sm text-muted-foreground mb-1">Расходы на исполнение и регистрацию</p>
            <div className="flex items-baseline gap-2">
              <p className="text-2xl font-bold">{formatCurrency(totalFormalizationUsd, "USD")}</p>
              <p className="text-lg text-muted-foreground">= {formatCurrency(totalFormalizationRub)}</p>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-muted/50 space-y-2 text-sm">
            <p><span className="font-medium">N</span> (Потенциальная налоговая база): {formatCurrency(Math.max(0, N))}</p>
            <p><span className="font-medium">M</span> (Рыночная стоимость −20%): {formatCurrency(M)}</p>
          </div>

          <div className="p-4 rounded-lg bg-muted/30 border">
            <p className="text-sm text-muted-foreground mb-1">Стоимость акций (без учёта местного налога)</p>
            <p className="text-lg font-semibold">{formatCurrency(Math.max(0, M - totalFormalizationRub))}</p>
          </div>
        </div>
      );
    };

    return (
      <div className="space-y-4">
        <h3 className="font-semibold">Налог при переводе опционов в акции</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Цена исполнения ($)</Label>
              <Input type="number" step="0.01" placeholder="0.01" value={strikePriceUsd || ""} onChange={e => setStrikePriceUsd(Number(e.target.value))} />
            </div>
            <div className="space-y-2">
              <Label>Количество опционов</Label>
              <Input type="number" placeholder="0" value={optionsCount || ""} onChange={e => setOptionsCount(Number(e.target.value))} />
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
        </div>

        {optionsCount > 0 && fairValueRub > 0 && renderResult()}
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
          <div>
            <h1 className="text-xl font-bold text-foreground">Перевести опционы в акции</h1>
            <p className="text-sm text-muted-foreground">Инструкция и расчёт налога</p>
          </div>
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-4 pb-4">
            <div className="flex items-center gap-3">
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
          </CardContent>
        </Card>

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
