import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import TaxCalculator from "@/components/TaxCalculator";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";

export default function TaxCalculatorPage() {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="icon" onClick={() => navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">{t("tax.title")}</h1>
            <p className="text-sm text-muted-foreground">{t("tax.subtitle")}</p>
          </div>
        </div>
      </div>
      <TaxCalculator hideHeader />
    </div>
  );
}
