import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { storage } from "@/lib/storage";
import { useEffect, useState } from "react";

interface SCurveProps {
  projectId: string;
}

const SCurveChart = ({ projectId }: SCurveProps) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    if (projectId) {
      const curveData = storage.getSCurveData(projectId);
      if (curveData.length > 0) {
        setData(curveData);
      }
    }
  }, [projectId]);

  if (data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader><CardTitle>Kurva S</CardTitle></CardHeader>
        <CardContent className="h-[350px] flex items-center justify-center text-muted-foreground">
          Belum ada data progres
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle>Kurva S - Progress vs Rencana</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" />
            <YAxis label={{ value: 'Progress (%)', angle: -90, position: 'insideLeft' }} domain={[0, 100]} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="planned"
              stroke="hsl(var(--primary))"
              strokeWidth={2}
              name="Rencana"
              dot={false}
            />
            <Line
              type="monotone"
              dataKey="actual"
              stroke="hsl(var(--destructive))"
              strokeWidth={2}
              name="Realisasi"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};

export default SCurveChart;
