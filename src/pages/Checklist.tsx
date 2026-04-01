import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { useLanguage } from "@/lib/language";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import FormExample from "@/components/FormExample";

type Scenario = null | "shareholder" | "convert";

export default function Checklist() {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [scenario, setScenario] = useState<Scenario>(null);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  const toggle = (id: string) => setChecked(prev => ({ ...prev, [id]: !prev[id] }));

  const shareholderSteps = [
    { id: "sh-1", label: t("checklist.sh.fillForm"), hasLink: true, link: "https://forms.yandex.ru/u/68a71d20d0468831b1ddca4a/", hasPdf: true },
  ];

  const convertSteps = [
    { id: "cv-1", label: t("checklist.cv.calculated"), subtitle: t("checklist.cv.calculatedDesc"), hasLink: true, link: "https://dodo-tax-compass.lovable.app/dividends", isNavigator: true, deadline: "20 апреля" },
    { id: "cv-2", label: t("checklist.cv.fillPyrus"), hasLink: true, link: "https://pyrus.com/form/1437842" },
    { id: "cv-3", label: t("checklist.cv.signedDocs"), subtitle: t("checklist.cv.signedDocsDesc") },
    { id: "cv-4", label: t("checklist.cv.paidNominal"), subtitle: t("checklist.cv.paidNominalDesc") },
    { id: "cv-5", label: t("checklist.cv.fillDividendForm"), hasLink: true, link: "https://forms.yandex.ru/u/68a71d20d0468831b1ddca4a/", hasPdf: true, deadline: "22 апреля" },
  ];

  const renderScenarioSelect = () => (
    <div className="space-y-3">
      <button
        onClick={() => setScenario("shareholder")}
        className="w-full p-5 rounded-xl bg-card border border-border hover:border-foreground/20 shadow-card hover:shadow-lg transition-all duration-200 text-left group"
      >
        <h3 className="text-base font-semibold text-foreground">{t("checklist.scenario.shareholder")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("checklist.scenario.shareholderDesc")}</p>
      </button>
      <button
        onClick={() => setScenario("convert")}
        className="w-full p-5 rounded-xl bg-card border border-border hover:border-foreground/20 shadow-card hover:shadow-lg transition-all duration-200 text-left group"
      >
        <h3 className="text-base font-semibold text-foreground">{t("checklist.scenario.convert")}</h3>
        <p className="text-sm text-muted-foreground mt-1">{t("checklist.scenario.convertDesc")}</p>
      </button>
    </div>
  );

  const renderSteps = (steps: Array<{ id: string; label: string; subtitle?: string; hasLink?: boolean; link?: string; hasPdf?: boolean; isNavigator?: boolean; deadline?: string }>) => (
    <div className="space-y-3">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-start gap-3 p-4 rounded-lg border bg-card">
          <div className="flex items-center justify-center w-7 h-7 rounded-full bg-muted text-muted-foreground text-sm font-medium shrink-0 mt-0.5">
            {i + 1}
          </div>
          <div className="flex-1 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className={`text-sm font-semibold ${checked[step.id] ? 'line-through text-muted-foreground' : 'text-foreground'}`}>
                  {step.label}
                </p>
                {step.subtitle && (
                  <p className="text-xs text-muted-foreground mt-0.5">{step.subtitle}</p>
                )}
              </div>
              <Checkbox
                id={step.id}
                checked={!!checked[step.id]}
                onCheckedChange={() => toggle(step.id)}
                className="mt-0.5"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {step.deadline && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                  до {step.deadline}
                </span>
              )}
              {step.hasLink && (
                <a href={step.link} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                  {t(step.isNavigator ? "checklist.openNavigator" : "checklist.openForm")} <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {step.hasPdf && (
                <FormExample />
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => scenario ? setScenario(null) : navigate("/")}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-xl font-bold text-foreground">{t("checklist.title")}</h1>
          </div>
          <LanguageSwitcher />
        </div>

        <Card className="shadow-card">
          <CardContent className="pt-6">
            {!scenario && renderScenarioSelect()}
            {scenario === "shareholder" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t("checklist.scenario.shareholder")}</h3>
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-sm text-foreground">{t("checklist.sh.fillForm")}</p>
                  <div className="flex flex-wrap gap-2">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-destructive/10 text-destructive text-xs font-medium">
                      до 22 апреля
                    </span>
                    <a href="https://forms.yandex.ru/u/68a71d20d0468831b1ddca4a/" target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
                      {t("checklist.openForm")} <ExternalLink className="w-3 h-3" />
                    </a>
                    <FormExample />
                  </div>
                </div>
              </div>
            )}
            {scenario === "convert" && (
              <div className="space-y-4">
                <h3 className="font-semibold text-foreground">{t("checklist.scenario.convert")}</h3>
                {renderSteps(convertSteps)}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
