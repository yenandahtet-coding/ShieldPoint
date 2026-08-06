export const chartTooltip = {
  cursor: { stroke: "var(--color-border)" },
  contentStyle: {
    background: "var(--color-popover)",
    border: "1px solid var(--color-border)",
    borderRadius: "0.75rem",
    fontSize: "12px",
    color: "var(--color-popover-foreground)",
    boxShadow: "0 18px 40px -24px rgba(0,0,0,0.8)",
  },
  labelStyle: { color: "var(--color-muted-foreground)", marginBottom: 4 },
  itemStyle: { color: "var(--color-popover-foreground)" },
} as const;

export const CHART_COLORS = [
  "var(--color-primary)",
  "var(--color-cyan)",
  "var(--color-violet)",
  "var(--color-success)",
  "var(--color-warning)",
  "var(--color-danger)",
];
