import { Link } from "react-router-dom";
import { HOME_SECTIONS, NEW_PATH, type HomeSection } from "@/lib/routes";

interface HomeSidebarProps {
  section: HomeSection;
  onSection: (s: HomeSection) => void;
}

/** Home navigation: Create New, My Library, Mailing List, History, Analytics, Profile. */
export function HomeSidebar({ section, onSection }: HomeSidebarProps) {
  return (
    <aside aria-label="Home navigation" className="flex w-56 shrink-0 flex-col gap-1 overflow-y-auto p-3">
      <Link
        to={NEW_PATH}
        className="mb-2 rounded-md bg-primary px-3 py-2 text-center text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
      >
        Create New
      </Link>
      {HOME_SECTIONS.map((s) => (
        <button
          key={s.id}
          type="button"
          onClick={() => onSection(s.id)}
          aria-current={section === s.id ? "page" : undefined}
          className={`rounded-md px-3 py-2 text-left text-sm transition-colors ${
            section === s.id
              ? "bg-muted font-medium text-foreground"
              : "text-muted-foreground hover:bg-muted/60 hover:text-foreground"
          }`}
        >
          {s.label}
        </button>
      ))}
    </aside>
  );
}
