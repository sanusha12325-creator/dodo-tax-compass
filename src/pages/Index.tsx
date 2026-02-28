import { useNavigate } from "react-router-dom";
import { Coins, ArrowRightLeft, Calculator } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  const buttons = [
    {
      title: "Получить дивиденды 2026",
      description: "Узнайте, получите ли вы дивиденды, сколько и нужно ли что-то делать",
      icon: Coins,
      path: "/dividends",
      gradient: "from-emerald-500 to-teal-600",
      hoverGradient: "hover:from-emerald-600 hover:to-teal-700",
    },
    {
      title: "Перевести опционы в акции",
      description: "Пошаговая инструкция и расчёт налога при конвертации",
      icon: ArrowRightLeft,
      path: "/convert",
      gradient: "from-blue-500 to-indigo-600",
      hoverGradient: "hover:from-blue-600 hover:to-indigo-700",
    },
    {
      title: "Рассчитать налог по операции",
      description: "Калькуляторы для всех типов операций с опционами и акциями",
      icon: Calculator,
      path: "/tax",
      gradient: "from-violet-500 to-purple-600",
      hoverGradient: "hover:from-violet-600 hover:to-purple-700",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-soft mb-2">
            <Calculator className="w-10 h-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            DP Tax & Dividend Compass 2026
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-base leading-relaxed">
            Информация по дивидендам, переводу опционов в акции и налоговым последствиям
          </p>
        </header>

        <div className="space-y-4">
          {buttons.map((btn) => (
            <button
              key={btn.path}
              onClick={() => navigate(btn.path)}
              className={`w-full p-6 rounded-2xl bg-gradient-to-r ${btn.gradient} ${btn.hoverGradient} text-white shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] text-left group`}
            >
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-white/15 backdrop-blur-sm shrink-0">
                  <btn.icon className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-lg font-bold">{btn.title}</h2>
                  <p className="text-sm opacity-85 leading-relaxed">{btn.description}</p>
                </div>
              </div>
            </button>
          ))}
        </div>

        <footer className="text-center text-xs text-muted-foreground pt-4">
          <p>Калькулятор предоставляет справочную информацию.</p>
          <p>Для точного расчёта рекомендуем консультацию с налоговым специалистом.</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
