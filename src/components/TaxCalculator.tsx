import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Calculator, Gift, ArrowRightLeft, Banknote, Info, CheckCircle2, AlertTriangle } from "lucide-react";

type Residency = "russia" | "kazakhstan" | "other";
type Operation = "options" | "conversion" | "sale";
type SaleType = "dodo_brands" | "dp_global" | "russian_company" | "foreign_or_individual";

interface ConversionInputs {
  marketValue: number;
  actualPrice: number;
  registrationFee: number;
}

interface SaleInputs {
  acquisitionCost: number;
  salePrice: number;
  saleType: SaleType;
}

const formatCurrency = (value: number): string => {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
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

export default function TaxCalculator() {
  const [residency, setResidency] = useState<Residency>("russia");
  const [operation, setOperation] = useState<Operation>("options");
  
  const [conversionInputs, setConversionInputs] = useState<ConversionInputs>({
    marketValue: 0,
    actualPrice: 0,
    registrationFee: 0,
  });
  
  const [saleInputs, setSaleInputs] = useState<SaleInputs>({
    acquisitionCost: 0,
    salePrice: 0,
    saleType: "foreign_or_individual",
  });

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
    const adjustedMarketValue = conversionInputs.marketValue * 0.8;
    const taxableIncome = adjustedMarketValue - conversionInputs.actualPrice - conversionInputs.registrationFee;
    
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(taxableIncome);
      
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm text-muted-foreground">Формула расчёта:</p>
            <p className="font-mono text-sm">N = M − (K + L)</p>
            <div className="text-sm space-y-1 mt-3">
              <p>M (рыночная стоимость − 20%): {formatCurrency(adjustedMarketValue)}</p>
              <p>K (фактическая стоимость): {formatCurrency(conversionInputs.actualPrice)}</p>
              <p>L (расходы на регистрацию): {formatCurrency(conversionInputs.registrationFee)}</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">Налогооблагаемый доход (N)</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, taxableIncome))}</p>
          </div>
          
          {taxableIncome > 0 && (
            <div className="p-4 rounded-lg gradient-primary text-primary-foreground">
              <p className="text-sm opacity-90 mb-1">НДФЛ к уплате ({rate})</p>
              <p className="text-3xl font-bold">{formatCurrency(tax)}</p>
              <p className="text-xs opacity-75 mt-2">{breakdown}</p>
            </div>
          )}
          
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
      return (
        <Alert className="border-success/30 bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertTitle className="text-success font-semibold">ИПН не взимается</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            Для резидентов Казахстана такой доход не облагается индивидуальным подоходным налогом.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="border-warning/30 bg-warning/5">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-2">
          В Казахстане ИПН не взимается. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход в виде экономии при покупке акций по номинальной цене вместо рыночной.
        </AlertDescription>
      </Alert>
    );
  };

  const renderSaleResult = () => {
    const income = saleInputs.salePrice - saleInputs.acquisitionCost;
    
    if (residency === "russia") {
      const { tax, rate, breakdown } = calculateNdfl(income);
      
      let paymentMethod = "";
      let selfPay = true;
      
      switch (saleInputs.saleType) {
        case "dodo_brands":
          paymentMethod = "Компания группы Dodo Brands перечислит НДФЛ за вас.";
          selfPay = false;
          break;
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
      
      return (
        <div className="space-y-4">
          <div className="p-4 rounded-lg bg-muted/50 space-y-2">
            <p className="text-sm text-muted-foreground">Расчёт дохода:</p>
            <div className="text-sm space-y-1">
              <p>Стоимость продажи: {formatCurrency(saleInputs.salePrice)}</p>
              <p>Стоимость приобретения: {formatCurrency(saleInputs.acquisitionCost)}</p>
            </div>
          </div>
          
          <div className="p-4 rounded-lg border-2 border-primary/20 bg-primary/5">
            <p className="text-sm text-muted-foreground mb-1">Налогооблагаемый доход</p>
            <p className="text-2xl font-bold text-foreground">{formatCurrency(Math.max(0, income))}</p>
          </div>
          
          {income > 0 && (
            <div className="p-4 rounded-lg gradient-primary text-primary-foreground">
              <p className="text-sm opacity-90 mb-1">НДФЛ к уплате ({rate})</p>
              <p className="text-3xl font-bold">{formatCurrency(tax)}</p>
              <p className="text-xs opacity-75 mt-2">{breakdown}</p>
            </div>
          )}
          
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
      return (
        <Alert className="border-success/30 bg-success/5">
          <CheckCircle2 className="h-5 w-5 text-success" />
          <AlertTitle className="text-success font-semibold">ИПН не взимается до 2066 года</AlertTitle>
          <AlertDescription className="text-muted-foreground mt-2">
            Для резидентов Казахстана действует льгота МФЦА. ИПН не взимается независимо от срока владения акциями.
          </AlertDescription>
        </Alert>
      );
    }
    
    return (
      <Alert className="border-warning/30 bg-warning/5">
        <AlertTriangle className="h-5 w-5 text-warning" />
        <AlertTitle className="text-warning font-semibold">Требуется анализ</AlertTitle>
        <AlertDescription className="text-muted-foreground mt-2">
          В Казахстане ИПН не взимается до 2066 года благодаря льготе МФЦА. Вам необходимо проанализировать законодательство страны вашего резидентства, чтобы понять, облагается ли местным налогом доход от продажи акций.
        </AlertDescription>
      </Alert>
    );
  };

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <header className="text-center space-y-2 mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-4">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Калькулятор НДФЛ</h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Расчёт налогов при операциях с опционами и акциями DP Global Group Ltd. после редомициляции в МФЦА Казахстана
          </p>
        </header>

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
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="options" className="flex items-center gap-2">
                  <Gift className="w-4 h-4" />
                  <span className="hidden sm:inline">Получение</span>
                </TabsTrigger>
                <TabsTrigger value="conversion" className="flex items-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  <span className="hidden sm:inline">Конвертация</span>
                </TabsTrigger>
                <TabsTrigger value="sale" className="flex items-center gap-2">
                  <Banknote className="w-4 h-4" />
                  <span className="hidden sm:inline">Продажа</span>
                </TabsTrigger>
              </TabsList>

              <TabsContent value="options" className="mt-6">
                <div className="space-y-4">
                  <div className="p-4 rounded-lg bg-muted/50">
                    <h3 className="font-medium mb-2">Получение опционов</h3>
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
                    <h3 className="font-medium mb-2">Конвертация опционов в акции</h3>
                    <p className="text-sm text-muted-foreground">
                      Вы получаете доход в виде экономии при покупке акций по номинальной цене вместо рыночной.
                    </p>
                  </div>
                  
                  {residency === "russia" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="marketValue">Рыночная стоимость акций (до вычета 20%)</Label>
                        <Input
                          id="marketValue"
                          type="number"
                          placeholder="0"
                          value={conversionInputs.marketValue || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, marketValue: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">Согласно отчёту оценщика (20% будет вычтено автоматически)</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="actualPrice">Фактическая стоимость акций (K)</Label>
                        <Input
                          id="actualPrice"
                          type="number"
                          placeholder="0"
                          value={conversionInputs.actualPrice || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, actualPrice: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">Сумма, которую вы платите за акции</p>
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="registrationFee">Расходы на регистрацию (L)</Label>
                        <Input
                          id="registrationFee"
                          type="number"
                          placeholder="0"
                          value={conversionInputs.registrationFee || ""}
                          onChange={(e) => setConversionInputs(prev => ({ ...prev, registrationFee: Number(e.target.value) }))}
                        />
                        <p className="text-xs text-muted-foreground">Registration fee и другие расходы</p>
                      </div>
                    </div>
                  )}
                  
                  <div className="pt-4 border-t">
                    <h4 className="font-medium mb-3">Результат расчёта</h4>
                    {renderConversionResult()}
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
                  
                  {residency === "russia" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="acquisitionCost">Стоимость приобретения акций</Label>
                        <Input
                          id="acquisitionCost"
                          type="number"
                          placeholder="0"
                          value={saleInputs.acquisitionCost || ""}
                          onChange={(e) => setSaleInputs(prev => ({ ...prev, acquisitionCost: Number(e.target.value) }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="salePrice">Стоимость продажи акций</Label>
                        <Input
                          id="salePrice"
                          type="number"
                          placeholder="0"
                          value={saleInputs.salePrice || ""}
                          onChange={(e) => setSaleInputs(prev => ({ ...prev, salePrice: Number(e.target.value) }))}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <Label htmlFor="saleType">Кому продаёте акции?</Label>
                        <Select value={saleInputs.saleType} onValueChange={(v) => setSaleInputs(prev => ({ ...prev, saleType: v as SaleType }))}>
                          <SelectTrigger id="saleType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="dodo_brands">Компании группы Dodo Brands (buy-back)</SelectItem>
                            <SelectItem value="dp_global">DP Global Group Ltd.</SelectItem>
                            <SelectItem value="russian_company">Другой российской компании</SelectItem>
                            <SelectItem value="foreign_or_individual">Иностранной компании или физ. лицу</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  )}
                  
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
