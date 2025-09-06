"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Athlete } from "@/lib/types";
import { calculatePoints, formatPoints } from "@/lib/calculatePoints";
import { formatGermanDate, substringDate } from "@/lib/formatDate";
import { useEffect, useState } from "react";

type Props = {
  athletes: Athlete[];
};

export default function PointsChart({ athletes }: Props) {
  const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (athletes.length > 0) {
      setVisibleLines(Object.fromEntries(athletes.map((a) => [a.name, true])));
    }
  }, [athletes]);

  const allDatesMap = new Map<string, Date>();

  // Hilfsfunktion zum Hinzufügen, nur wenn das formatierte Datum noch nicht drin ist
  const addDateIfNew = (date: Date) => {
    const key = formatGermanDate(date);
    if (!allDatesMap.has(key)) {
      allDatesMap.set(key, date);
    }
  };

  // Start & Now hinzufügen
  addDateIfNew(new Date("2024-09-05"));

  // Alle Aktivitätsdaten prüfen
  athletes.forEach((athlete) => {
    athlete.activities.forEach((activity) => {
      addDateIfNew(activity.date);
    });
  });

  // Nach Datum sortieren
  const allDates = Array.from(allDatesMap.values()).sort(
    (a, b) => a.getTime() - b.getTime()
  );

  // Für jeden Athleten Verlauf über alle Daten berechnen
  const athleteProgress: { [name: string]: { [date: string]: number } } = {};

  athletes.forEach((athlete) => {
    const sorted = [...athlete.activities].sort(
      (a, b) => a.date.getTime() - b.date.getTime()
    );
    let total = 0;
    let i = 0;

    const progress: { [date: string]: number } = {};

    allDates.forEach((date) => {
      while (
        i < sorted.length &&
        formatGermanDate(sorted[i].date) === formatGermanDate(date)
      ) {
        total += calculatePoints(sorted[i].type, sorted[i].distance);
        i++;
      }

      progress[formatGermanDate(date)] = total;
    });

    athleteProgress[athlete.name] = progress;
  });

  // Diagramm-Daten vorbereiten
  const chartData = allDates.map((date) => {
    const entry: Record<string, number | string> = {
      date: formatGermanDate(date),
    };
    athletes.forEach((athlete) => {
      entry[athlete.name] =
        athleteProgress[athlete.name][formatGermanDate(date)] ?? 0;
    });
    return entry;
  });

  const maxY = Math.max(
    ...chartData.flatMap((entry) =>
      athletes.map((athlete) => entry[athlete.name] as number)
    )
  );

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(value, index) =>
            index === 0 ? "" : substringDate(value)
          }
          angle={-30}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis
          tick={{ fontSize: 12, fill: "#6b7280" }}
          allowDecimals={false}
          domain={[0, Math.ceil((maxY + 6) / 10) * 10]}
        />
        <Tooltip
          formatter={(value: number) => formatPoints(value)}
          contentStyle={{
            backgroundColor: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          labelStyle={{ color: "#374151", fontWeight: 500 }}
        />
        <Legend
          payload={athletes.map((athlete, index) => ({
            id: athlete.name,
            value: athlete.name,
            type: "line",
            color: `hsl(${(index * 60) % 360}, 70%, 50%)`,
            inactive: !visibleLines[athlete.name],
          }))}
          onClick={(e) => {
            const name = e.value as string;
            setVisibleLines((prev) => ({
              ...prev,
              [name]: !prev[name],
            }));
          }}
          wrapperStyle={{ paddingTop: 12, cursor: "pointer" }}
        />
        {athletes.map((athlete, index) =>
          visibleLines[athlete.name] ? (
            <Line
              key={athlete.name}
              type="monotone"
              dataKey={athlete.name}
              stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
              strokeWidth={2}
              dot={{ r: 3 }}
              activeDot={{ r: 6 }}
            />
          ) : null
        )}
      </LineChart>
    </ResponsiveContainer>
  );
}
