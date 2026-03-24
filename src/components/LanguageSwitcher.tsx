import { Globe } from "lucide-react";
import { useLanguage } from "@/lib/language";

export default function LanguageSwitcher() {
  const { lang, setLang } = useLanguage();

  return (
    <button
      onClick={() => setLang(lang === "ru" ? "en" : "ru")}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-muted hover:bg-muted/80 transition-colors text-xs font-medium text-foreground shrink-0"
    >
      <Globe className="w-3.5 h-3.5" />
      {lang === "ru" ? "EN" : "RU"}
    </button>
  );
}
