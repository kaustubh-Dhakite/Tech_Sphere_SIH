import { useTranslation } from "react-i18next";
import { changeLanguage } from "../i18n/index";
import { cn } from "../lib/utils";

const LANGS = [
  { code: "en", label: "EN", full: "English" },
  { code: "hi", label: "हि", full: "हिंदी" },
  { code: "mr", label: "म", full: "मराठी" },
] as const;

type LangCode = "en" | "hi" | "mr";

export default function LanguageSelector({ compact = false }: { compact?: boolean }) {
  const { i18n } = useTranslation();
  const current = (i18n.language?.slice(0, 2) ?? "en") as LangCode;

  const handleChange = (code: LangCode) => {
    changeLanguage(code);
    // Update html lang attribute for screen readers
    document.documentElement.lang = code;
  };

  return (
    <div
      className={cn(
        "flex items-center gap-0.5 rounded-xl border border-slate-200 bg-white p-1 shadow-[0_1px_2px_rgb(24_49_83_/_0.06)]",
        compact && "w-full"
      )}
      role="group"
      aria-label="Select language"
      title="Switch display language"
    >
      {LANGS.map(({ code, label, full }) => (
        <button
          key={code}
          onClick={() => handleChange(code)}
          aria-pressed={current === code}
          title={full}
          className={cn(
            "relative flex h-8 min-w-[32px] cursor-pointer items-center justify-center rounded-lg px-2 text-[12px] font-bold transition-all duration-150",
            compact && "flex-1",
            current === code
              ? "bg-navy text-white shadow-sm"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          )}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
