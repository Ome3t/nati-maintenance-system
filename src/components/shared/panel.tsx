import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface PanelProps {
  title: string
  children: React.ReactNode
  action?: React.ReactNode
}

export function Panel({ title, children, action }: PanelProps) {
  return (
    <Card className="bg-card border-border/50 shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4 border-b border-border/50">
        <CardTitle className="text-sm font-medium text-foreground">{title}</CardTitle>
        {action && <div>{action}</div>}
      </CardHeader>
      <CardContent className="p-6">
        {children}
      </CardContent>
    </Card>
  )
}