import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  variant?: "default" | "success" | "warning" | "danger" | "info";
}

const variantStyles = {
  default: "text-muted-foreground",
  success: "text-success",
  warning: "text-warning",
  danger: "text-destructive",
  info: "text-info"
};

export function MetricCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  trend, 
  variant = "default" 
}: MetricCardProps) {
  return (
    <Card className="shadow-sm hover:shadow-lg transition-shadow duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-1">
              {title}
            </p>
            <p className="text-3xl font-bold text-foreground">
              {value}
            </p>
            {subtitle && (
              <p className="text-sm text-muted-foreground mt-1">
                {subtitle}
              </p>
            )}
            {trend && (
              <div className="flex items-center mt-2">
                <span className={cn(
                  "text-sm font-medium",
                  trend.isPositive ? "text-success" : "text-destructive"
                )}>
                  {trend.isPositive ? "+" : ""}{trend.value}%
                </span>
                <span className="text-sm text-muted-foreground ml-1">
                  esta semana
                </span>
              </div>
            )}
          </div>
          <div className={cn(
            "w-12 h-12 rounded-lg flex items-center justify-center",
            variant === "success" && "bg-success/10",
            variant === "warning" && "bg-warning/10",
            variant === "danger" && "bg-destructive/10",
            variant === "info" && "bg-info/10",
            variant === "default" && "bg-primary/10"
          )}>
            <Icon className={cn(
              "w-6 h-6",
              variantStyles[variant]
            )} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}