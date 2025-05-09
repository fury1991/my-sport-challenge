"use client";

import { Poppins } from "next/font/google";
import { useEffect, useState } from "react";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import PointsChart from "@/components/PointsChart";
import { Activity, Athlete } from "@/lib/types";
import {
  calculatePoints,
  formatPoints,
  getActivityIcon,
} from "@/lib/calculatePoints";
import { formatGermanDate } from "@/lib/formatDate";

const poppins = Poppins({ subsets: ["latin"], weight: "700" });
export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  useEffect(() => {
    console.log('Firebase Project ID:', process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID);
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
    <main className="max-w-4xl mx-auto p-6 bg-white rounded-xl shadow-lg">
      <h1 className="text-center text-4xl sm:text-5xl md:text-6xl font-extrabold mb-8 leading-tight tracking-tight">
        <span className="block text-gray-800 dark:text-white">Fatty</span>
        <span className="block text-transparent bg-clip-text bg-gradient-to-r from-sky-500 via-cyan-500 to-teal-400">
          Forward
        </span>
      </h1>

      {lastUpdate && (
        <p className="text-sm text-gray-500 text-center mb-8">
          Letzte Aktualisierung: {formatGermanDate(lastUpdate)}
        </p>
      )}

      {/* Leaderboard */}
      <section className="mb-10">
        <h2 className="text-2xl font-semibold mb-2">🏆 Aktueller Stand</h2>
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
      <section className="mb-12">
        <h2 className="text-2xl font-semibold mb-4">🗓️ Aktivitäten</h2>
        <Tabs defaultValue={athletes[0]?.id} className="w-full">
          <TabsList className="flex flex-wrap justify-start overflow-x-auto">
            {athletes.map((athlete) => (
              <TabsTrigger
                key={athlete.id}
                value={athlete.id}
                className="capitalize"
              >
                {athlete.name}
              </TabsTrigger>
            ))}
          </TabsList>

          {athletes.map((athlete) => (
            <TabsContent key={athlete.id} value={athlete.id}>
              <ul className="space-y-3 mt-4">
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
                        <p className="text-md font-semibold">{activity.type}</p>
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
            </TabsContent>
          ))}
        </Tabs>
      </section>

      {/* Punkteverlauf */}
      <section className="bg-gray-50 p-6 rounded-xl shadow-inner">
        <h2 className="text-2xl font-semibold mb-4 text-gray-700">
          📈 Punkteverlauf
        </h2>
        <PointsChart athletes={athletes} />
      </section>
    </main>
  );
}
