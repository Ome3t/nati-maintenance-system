import { Card, CardContent } from "@/components/ui/card"
import { AnimatedCounter } from "@/components/shared/animated-counter"

interface StatCardProps {
  label: string
  value: number | string
  hint?: string
  trend?: "up" | "down" | "neutral"
  prefix?: string
  suffix?: string
}

export function StatCard({ label, value, hint, trend = "neutral", prefix = "", suffix = "" }: StatCardProps) {
  const isNumber = typeof value === "number"

  return (
    <Card className="bg-card border-border/50 shadow-sm hover:border-primary/50 transition-colors">
      <CardContent className="p-6">
        <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">
          {label}
        </div>
        <div className="text-3xl font-bold text-foreground tracking-tight">
          {isNumber ? (
            <AnimatedCounter value={value} prefix={prefix} suffix={suffix} />
          ) : (
            value
          )}
        </div>
        {hint && (
          <div className={`mt-2 text-xs font-medium ${
            trend === "up" ? "text-primary" : 
            trend === "down" ? "text-destructive" : "text-muted-foreground"
          }`}>
            {hint}
          </div>
        )}
      </CardContent>
    </Card>
  )
}