import { useNavigate } from "react-router-dom";
import { Coins, ArrowRightLeft, Calculator, ClipboardCheck, ChevronRight } from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";

const Index = () => {
  const navigate = useNavigate();
  const { t, lang, setLang } = useLanguage();

  const buttons = [
    {
      title: t("index.dividends.title"),
      description: t("index.dividends.desc"),
      icon: Coins,
      path: "/dividends",
    },
    {
      title: t("index.convert.title"),
      description: t("index.convert.desc"),
      icon: ArrowRightLeft,
      path: "/convert",
    },
    {
      title: t("index.tax.title"),
      description: t("index.tax.desc"),
      icon: Calculator,
      path: "/tax",
    },
  ];

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="max-w-2xl mx-auto space-y-10">
        {/* Language switcher */}
        <div className="flex justify-end">
          <LanguageSwitcher />
        </div>

        <header className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl gradient-primary shadow-soft mb-2">
            <Calculator className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-foreground tracking-tight whitespace-nowrap">
            {t("index.title")}
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            {t("index.subtitle")}
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
          <p>{t("index.footer1")}</p>
          <p>{t("index.footer2")}</p>
        </footer>
      </div>
    </div>
  );
};

export default Index;
