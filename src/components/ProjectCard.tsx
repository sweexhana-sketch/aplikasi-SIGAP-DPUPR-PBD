import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Calendar, MapPin, TrendingUp, Edit } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ProjectCardProps {
  id: string;
  name: string;
  location: string;
  progress: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "delayed";
  budget: string;
  spent: string;
  onExport?: (e: React.MouseEvent) => void;
  onManage?: (e: React.MouseEvent) => void;
}

const ProjectCard = ({
  id,
  name,
  location,
  progress,
  startDate,
  endDate,
  status,
  budget,
  spent,
  onExport,
  onManage
}: ProjectCardProps) => {
  const navigate = useNavigate();
  const statusVariant: Record<typeof status, "default" | "success" | "destructive"> = {
    active: "default",
    completed: "success",
    delayed: "destructive",
  };

  const statusLabel = {
    active: "Aktif",
    completed: "Selesai",
    delayed: "Terlambat",
  };

  return (
    <div onClick={() => navigate(`/projects/${id}/manage`)} className="cursor-pointer h-full">
      <Card className="shadow-card hover:shadow-elegant transition-all duration-300 hover:-translate-y-1 h-full flex flex-col">
        <CardHeader>
          <div className="flex items-start justify-between">
            <CardTitle className="text-lg line-clamp-2">{name}</CardTitle>
            <Badge variant={statusVariant[status]}>{statusLabel[status]}</Badge>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <MapPin className="h-4 w-4 flex-shrink-0" />
            <span className="line-clamp-1">{location}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 flex-1 flex flex-col">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Progress Fisik</span>
              <span className="text-sm font-bold text-primary">{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Mulai</span>
              </div>
              <p className="font-medium">{startDate}</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1 text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>Selesai</span>
              </div>
              <p className="font-medium">{endDate}</p>
            </div>
          </div>

          <div className="pt-4 border-t mt-auto">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Anggaran</span>
              <span className="font-semibold">{budget}</span>
            </div>
            <div className="flex items-center justify-between text-sm mt-1">
              <span className="text-muted-foreground">Realisasi</span>
              <span className="font-semibold text-success">{spent}</span>
            </div>

            <div className="mt-4 pt-2 border-t flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
              {onExport && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onExport(e);
                  }}
                  className="text-xs flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium px-2 py-1 bg-blue-50 hover:bg-blue-100 rounded transition-colors"
                >
                  <TrendingUp className="w-3 h-3" /> Export DKH
                </button>
              )}

              {onManage && (
                <button
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onManage(e);
                  }}
                  className="text-xs flex items-center gap-1 text-orange-600 hover:text-orange-800 font-medium px-2 py-1 bg-orange-50 hover:bg-orange-100 rounded transition-colors"
                >
                  <Edit className="w-3 h-3" /> Kelola / Addendum
                </button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ProjectCard;
