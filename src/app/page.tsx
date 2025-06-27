"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import PointsChart from "@/components/PointsChart";
import { Activity, Athlete } from "@/lib/types";
import {
  calculatePoints,
  formatPoints,
  getActivityDisplay,
  getActivityIcon,
} from "@/lib/calculatePoints";
import { formatGermanDate, formatGermanDateLong } from "@/lib/formatDate";

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);

  const handleToggle = (id: string) => {
    setActiveAthleteId((prev) => (prev === id ? null : id));
  };

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
      athleteData.sort((a, b) => b.totalPoints - a.totalPoints);
      setAthletes(athleteData);

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
    <main className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight">
        <span className="block text-gray-800 dark:text-white">Fatty</span>
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400">
          Forward
        </span>
      </h1>

      {lastUpdate && (
        <p className="text-sm text-gray-500 text-center mb-8">
          Letzte Aktualisierung: {formatGermanDateLong(lastUpdate)}
        </p>
      )}

      {/* Winner */}
      {new Date().getTime() >= Date.UTC(2025, 5, 30, 20, 0, 0) &&
        athletes.length > 0 && (
          <section className="mb-10 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="text-5xl animate-spin-slow">🏆</div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-700">
                  Gewinner: {athletes[0].name}
                </h2>
                <p className="text-md text-yellow-600">
                  Mit {formatPoints(athletes[0].totalPoints)} Punkten – So viele
                  Punkte – das war kein Sport, das war eine Machtdemonstration.
                </p>
              </div>
            </div>
          </section>
        )}

      {/* Leaderboard */}
      <section className="mb-10 bg-gray-50 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold flex items-center mb-3 text-gray-800">
          🏆 <span className="ml-2">Aktueller Stand</span>
        </h2>
        <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-left">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3">Name</th>
              <th className="p-3">Punkte</th>
            </tr>
          </thead>
          <tbody>
            {[...athletes]
              .sort((a, b) => b.totalPoints - a.totalPoints)
              .map((athlete, index) => (
                <tr
                  key={athlete.id}
                  className={`border-t hover:bg-gray-50 ${
                    index === 0 ? "font-bold text-green-600" : ""
                  }`}
                >
                  <td className="p-3">{athlete.name}</td>
                  <td className="p-3">{formatPoints(athlete.totalPoints)}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </section>

      {/* Aktivitäten als Tabs */}
      <section className="mb-10 bg-gray-50 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold flex items-center mb-3 text-gray-800">
          🗓️ <span className="ml-2">Aktivitäten</span>
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Klicke auf einen Namen, um die Aktivitäten anzuzeigen oder
          auszublenden.
        </p>

        <div className="flex flex-wrap gap-2 mb-4">
          {athletes.map((athlete) => (
            <button
              key={athlete.id}
              onClick={() => handleToggle(athlete.id)}
              className={`capitalize px-4 py-2 rounded-full transition font-medium ${
                activeAthleteId === athlete.id
                  ? "bg-sky-500 text-white"
                  : "bg-gray-100 hover:bg-gray-200"
              }`}
            >
              {athlete.name}
            </button>
          ))}
        </div>

        {athletes.map((athlete) =>
          activeAthleteId === athlete.id ? (
            <div key={athlete.id} className="mt-4">
              {athlete.activities.length === 0 ? (
                <p className="text-gray-500 italic">
                  Keine Aktivitäten vorhanden.
                </p>
              ) : (
                <ul className="space-y-3">
                  {athlete.activities.map((activity, i) => (
                    <li
                      key={i}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg shadow-sm hover:shadow-md transition"
                    >
                      <div className="flex items-center space-x-4">
                        <span className="text-2xl">
                          {getActivityIcon(activity.type)}
                        </span>
                        <div>
                          <p className="text-md font-semibold">
                            {getActivityDisplay(activity.type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatGermanDate(activity.date)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-md">{activity.distance} km</p>
                        <p className="text-sm text-gray-500">
                          (
                          {formatPoints(
                            calculatePoints(activity.type, activity.distance)
                          )}{" "}
                          Punkte)
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : null
        )}
      </section>

      {/* Punkteverlauf */}
      <section className="mb-10 bg-gray-50 p-5 rounded-xl shadow-sm">
        <h2 className="text-xl font-semibold flex items-center mb-3 text-gray-800">
          📈 <span className="ml-2">Punkteverlauf</span>
        </h2>
        <PointsChart athletes={athletes} />
      </section>
    </main>
  );
}
