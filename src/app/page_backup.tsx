"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PointsChart from "@/components/PointsChart";
import { Activity, Athlete } from "@/lib/types";
import {
  calculatePoints,
  formatPoints,
  getActivityIcon,
} from "@/lib/calculatePoints";
import { formatGermanDate } from "@/lib/formatDate";

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const athleteCol = collection(db, "athletes");
      const athleteSnap = await getDocs(athleteCol);

      const athleteData: Athlete[] = [];

      for (const docSnap of athleteSnap.docs) {
        const athleteId = docSnap.id;
        const { name } = docSnap.data();

        const activitiesCol = collection(
          db,
          `athletes/${athleteId}/activities`
        );
        const activitiesSnap = await getDocs(activitiesCol);

        const activities: Activity[] = activitiesSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            date: data.date?.toDate(), // Datum als `Date`-Objekt
            type: data.type,
            distance: data.distance,
          };
        });

        // **Sortiere Aktivitäten korrekt nach Datum (aufsteigend)**
        activities.sort((a, b) => a.date.getTime() - b.date.getTime()); // Verwenden von `getTime()` für den Vergleich

        const totalPoints = activities.reduce((sum, act) => {
          return sum + calculatePoints(act.type, act.distance);
        }, 0);

        athleteData.push({ id: athleteId, name, activities, totalPoints });
      }

      setAthletes(athleteData);
      console.log("Athleten geladen:", athleteData);

      // Abruf des letzten Aktualisierungsdatums
      const statusDoc = await getDoc(doc(db, "metadata", "status"));
      const lastUpdateTimestamp = statusDoc.exists()
        ? statusDoc.data().lastUpdate
        : null;
      setLastUpdate(lastUpdateTimestamp?.toDate() ?? null);
    };

    fetchData();
  }, []);

  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-2">Sport Challenge Übersicht</h1>

      {lastUpdate && (
        <p className="text-sm text-gray-500 mb-6">
          Letzte Aktualisierung: {formatGermanDate(lastUpdate)}
        </p>
      )}

<table className="w-full border border-gray-300 text-left">
  <thead className="bg-gray-200 text-gray-700">
    <tr>
      <th className="p-4">Name</th>
      <th className="p-4">Punkte</th>
    </tr>
  </thead>
  <tbody>
    {[...athletes]
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((athlete) => (
        <tr key={athlete.id} className="border-t hover:bg-gray-50">
          <td className="p-4 font-medium">{athlete.name}</td>
          <td className="p-4 font-semibold text-blue-600">
            {formatPoints(athlete.totalPoints)}
          </td>
        </tr>
      ))}
  </tbody>
</table>

      {athletes.map((athlete) => (
        <div key={athlete.id} className="mb-6">
          <h2 className="text-xl font-semibold">{athlete.name}</h2>
          <ul className="mt-2 space-y-1">
            {athlete.activities.map((activity, i) => (
              <li key={i} className="flex items-center space-x-2">
                <span className="text-xl">
                  {getActivityIcon(activity.type)}
                </span>
                <span>{formatGermanDate(activity.date)}</span>{" "}
                {/* Formatierte Ausgabe */}
                <span>{activity.type}</span>
                <span>{activity.distance} km</span>
                <span className="text-sm text-gray-500">
                  (
                  {formatPoints(
                    calculatePoints(activity.type, activity.distance)
                  )}{" "}
                  Punkte)
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}

      <h2 className="text-xl font-bold mt-10 mb-2">🏆 Aktueller Stand</h2>
      <table className="w-full border border-gray-300 text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="p-2">Name</th>
            <th className="p-2">Punkte</th>
          </tr>
        </thead>
        <tbody>
          {[...athletes]
            .sort((a, b) => b.totalPoints - a.totalPoints)
            .map((athlete) => (
              <tr key={athlete.id} className="border-t">
                <td className="p-2">{athlete.name}</td>
                <td className="p-2 font-semibold">
                  {formatPoints(athlete.totalPoints)}
                </td>
              </tr>
            ))}
        </tbody>
      </table>

      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">📈 Punkteverlauf</h2>
        <PointsChart athletes={athletes} />
      </div>
    </main>
  );
}
