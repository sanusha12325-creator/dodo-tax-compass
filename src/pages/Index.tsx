import { useNavigate } from "react-router-dom";
import { Coins, ArrowRightLeft, Calculator, ChevronRight } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const buttons = [
    {
      title: "Получить дивиденды 2026",
      description: "Узнайте, получите ли вы дивиденды, сколько и нужно ли что-то делать",
      icon: Coins,
      path: "/dividends",
    },
    {
      title: "Перевести опционы в акции",
      description: "Пошаговая инструкция и расчёт налога при конвертации",
      icon: ArrowRightLeft,
      path: "/convert",
    },
    {
      title: "Рассчитать налог по операции",
      description: "Калькуляторы для всех типов операций с опционами и акциями",
      icon: Calculator,
      path: "/tax",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-2">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Навигатор держателя опционов и акций
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Информация по дивидендам, переводу опционов в акции и налоговым последствиям
          </p>
        </header>

        <div className="space-y-3">
          {buttons.map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className="w-full p-5 rounded-xl bg-card border border-border hover:border-foreground/20 shadow-card hover:shadow-lg transition-all duration-200 text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="p-2.5 rounded-lg bg-primary/8 shrink-0">
                  <btn.icon className="w-5 h-5 text-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="text-base font-semibold text-foreground">{btn.title}</h2>
                  <p className="text-sm text-muted-foreground mt-0.5">{btn.description}</p>
                </div>
                <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
              </div>
            </button>
          ))}
        </div>

        <footer className="text-center text-xs text-muted-foreground pt-4 space-y-0.5">
          <p>Калькулятор предоставляет справочную информацию.</p>
          <p>Для точного расчёта рекомендуем консультацию с налоговым специалистом.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
