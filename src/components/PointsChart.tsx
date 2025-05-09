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
import { formatGermanDate, formatGermanDateShort } from "@/lib/formatDate";

type Props = {
  athletes: Athlete[];
};

export default function PointsChart({ athletes }: Props) {
  const allDatesSet = new Set<Date>();

  // Add Start & Now
  allDatesSet.add(new Date("2024-03-01"));
  allDatesSet.add(new Date());

  // Add All Dates
  athletes.forEach((athlete) => {
    athlete.activities.forEach((activity) => {
      allDatesSet.add(activity.date);
    });
  });

  // Sort Dates Ascending
  const allDates = Array.from(allDatesSet).sort(
    (a, b) => a.getTime() - b.getTime()
  );
  console.log(allDates);

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
    const entry: Record<string, number | string> = { date: formatGermanDate(date) };
    athletes.forEach((athlete) => {
      entry[athlete.name] = parseFloat(
        formatPoints(athleteProgress[athlete.name][formatGermanDate(date)] ?? 0)
      );
    });
    return entry;
  });

  return (
    <ResponsiveContainer width="100%" height={400}>
      <LineChart
        data={chartData}
        margin={{ top: 20, right: 30, left: 10, bottom: 50 }}
      >
        <CartesianGrid strokeDasharray="4 4" stroke="#e5e7eb" />
        <XAxis
          dataKey="date"
          tickFormatter={(date) => formatGermanDateShort(new Date(date))}
          angle={-30}
          textAnchor="end"
          height={60}
          tick={{ fontSize: 12, fill: "#6b7280" }}
        />
        <YAxis tick={{ fontSize: 12, fill: "#6b7280" }} allowDecimals={false} />
        <Tooltip
          contentStyle={{
            backgroundColor: "#f9fafb",
            borderRadius: 8,
            border: "1px solid #d1d5db",
          }}
          labelStyle={{ color: "#374151", fontWeight: 500 }}
        />
        <Legend wrapperStyle={{ paddingTop: 12 }} />
        {athletes.map((athlete, index) => (
          <Line
            key={athlete.name}
            type="monotone"
            dataKey={athlete.name}
            stroke={`hsl(${(index * 60) % 360}, 70%, 50%)`}
            strokeWidth={2}
            dot={{ r: 3 }}
            activeDot={{ r: 6 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
