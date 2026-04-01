import { useState } from "react";
import { ChevronDown, FileText } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function FormExample() {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-foreground bg-muted/50 hover:bg-muted transition-colors"
      >
        <FileText className="w-3.5 h-3.5 shrink-0" />
        <span className="flex-1 text-left">{t("checklist.examplePdf")}</span>
        <ChevronDown className={`w-3.5 h-3.5 shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="px-4 py-4 space-y-5 text-sm border-t border-border bg-card">
          {/* Section 1: ФИО */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.fullName")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">
              Иванов Иван Иванович
            </div>
            <p className="text-xs text-muted-foreground">{t("example.fullNameHint")}</p>
          </div>

          {/* Section 2: Страна гражданства */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.citizenship")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">
              Российская Федерация
            </div>
          </div>

          {/* Section 3: Вид документа */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.docType")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">
              {t("example.docTypeValue")}
            </div>
            <p className="text-xs text-muted-foreground">{t("example.docTypeHint")}</p>
          </div>

          {/* Section 4: Скан документа */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.scanDoc")}</p>
            <p className="text-xs text-muted-foreground">{t("example.scanDocHint")}</p>
          </div>

          {/* Section 5: Паспортные данные */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{t("example.passportData")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.series")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">2672</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.number")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">467764</div>
              </div>
              <div className="space-y-0.5 col-span-2">
                <p className="text-xs text-muted-foreground">{t("example.issuedBy")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">ГУ МВД России по г. Москве</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.issueDate")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">16.03.2020</div>
              </div>
            </div>
          </div>

          {/* Section 6: Второе гражданство */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.dualCitizenship")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">{t("example.no")}</div>
          </div>

          {/* Section 7: ВНЖ в России */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.residencePermit")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">{t("example.notApplicableCitizen")}</div>
          </div>

          {/* Section 8: Дата рождения */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.birthDate")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">13.01.2000</div>
          </div>

          {/* Section 9: Налоговое резидентство */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.taxResidency")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">Российская Федерация</div>
            <p className="text-xs text-muted-foreground">{t("example.taxResidencyHint")}</p>
          </div>

          {/* Section 10: ИНН */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.taxNumber")}</p>
            <div className="px-3 py-2 rounded-md bg-muted/50 border border-border text-muted-foreground">505086489037</div>
            <p className="text-xs text-muted-foreground">{t("example.taxNumberHint")}</p>
          </div>

          {/* Section 11: Сертификат налогового резидента */}
          <div className="space-y-1">
            <p className="font-semibold text-foreground">{t("example.taxCert")}</p>
            <p className="text-xs text-muted-foreground">{t("example.taxCertHint")}</p>
          </div>

          {/* Section 12: Банковские реквизиты */}
          <div className="space-y-2">
            <p className="font-semibold text-foreground">{t("example.bankDetails")}</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-0.5 col-span-2">
                <p className="text-xs text-muted-foreground">{t("example.bankAccount")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">40702810728000098105</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.bik")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">048702640</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.bankName")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">АО Райффайзенбанк</div>
              </div>
              <div className="space-y-0.5">
                <p className="text-xs text-muted-foreground">{t("example.currency")}</p>
                <div className="px-3 py-1.5 rounded-md bg-muted/50 border border-border text-muted-foreground">{t("example.rubles")}</div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
