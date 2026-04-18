import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "success" | "warning" | "primary";
}

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => {
  const variantClasses = {
    default: "bg-card",
    success: "bg-gradient-success text-success-foreground",
    warning: "bg-warning text-warning-foreground",
    primary: "bg-gradient-primary text-primary-foreground",
  };

  return (
    <Card className={`${variantClasses[variant]} shadow-card hover:shadow-elegant transition-shadow`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className={`text-sm font-medium ${variant === "default" ? "text-muted-foreground" : "opacity-90"}`}>
              {title}
            </p>
            <p className="text-3xl font-bold">{value}</p>
            {trend && (
              <p className={`text-xs ${variant === "default" ? "text-muted-foreground" : "opacity-75"}`}>
                {trend}
              </p>
            )}
          </div>
          <div className={`rounded-full p-3 ${variant === "default" ? "bg-primary/10" : "bg-white/20"}`}>
            <Icon className={`h-6 w-6 ${variant === "default" ? "text-primary" : ""}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default StatCard;
