type StaffPageHeaderProps = {
  title: string;
  description: string;
  badge?: string;
  meta?: string;
};

export function StaffPageHeader({ title, description, badge, meta }: StaffPageHeaderProps) {
  return (
    <div className="mb-4 flex flex-wrap items-end justify-between gap-3 sm:mb-6 sm:gap-4">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground sm:text-2xl">
            {title}
          </h1>
          {badge && (
            <span
              className="font-display rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white"
              style={{ background: "var(--staff-accent)" }}
            >
              {badge}
            </span>
          )}
        </div>
        <p className="font-body mt-1 max-w-2xl text-sm text-muted">{description}</p>
      </div>
      {meta && <p className="font-body shrink-0 text-xs text-muted">{meta}</p>}
    </div>
  );
}
