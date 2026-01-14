import { ActivitySummaryDay } from "../../shared/types";

interface ActivityHeatmapProps {
  days: ActivitySummaryDay[];
  maxTotal: number;
  onSelectDay?: (day: ActivitySummaryDay) => void;
}

export const colorForValue = (value: number, max: number) => {
  if (max === 0 || value === 0) return "bg-surface-muted";
  const ratio = value / max;
  if (ratio >= 0.75) return "bg-primary";
  if (ratio >= 0.5) return "bg-primary/70";
  if (ratio >= 0.25) return "bg-primary/50";
  return "bg-primary/30";
};

const ActivityHeatmap = ({ days, maxTotal, onSelectDay }: ActivityHeatmapProps) => (
  <div className="grid grid-cols-7 gap-2" role="grid" aria-label="活跃度热力格">
    {days.map((day) => {
      const label = `${new Date(`${day.date}T00:00:00Z`).toLocaleDateString("zh-CN", { month: "numeric", day: "numeric" })} · 新增 ${day.added_count} · 复习 ${day.review_count} · 总计 ${day.total}`;
      const color = colorForValue(day.total, maxTotal);

      return (
        <button
          key={day.date}
          type="button"
          className={`aspect-square w-full rounded-lg border border-white/60 shadow-sm transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-primary ${color} ${onSelectDay ? "hover:-translate-y-0.5" : ""}`}
          title={label}
          aria-label={label}
          role="gridcell"
          onClick={() => onSelectDay?.(day)}
          data-date={day.date}
        />
      );
    })}
  </div>
);

export default ActivityHeatmap;
