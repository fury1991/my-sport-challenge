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

type ChallengeOption = {
  label: string;
  name: string;
};

export default function Home() {
  const [athletes, setAthletes] = useState<Athlete[]>([]);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [activeAthleteId, setActiveAthleteId] = useState<string | null>(null);
  const [activeChallenge, setActiveChallenge] = useState<string | null>(null);
  const [availableChallenges, setAvailableChallenges] = useState<
    ChallengeOption[]
  >([]);
  const [challengeStart, setChallengeStart] = useState<Date | null>(null);
  const [challengeEnd, setChallengeEnd] = useState<Date | null>(null);
  const [challengeDone, setChallengeDone] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  const handleToggleAthlete = (id: string) => {
    setActiveAthleteId((prev) => (prev === id ? null : id));
  };

  // 🔹 Load available challenges + current challenge
  useEffect(() => {
    const loadChallenges = async () => {
      const currentDoc = await getDoc(doc(db, "metadata", "current"));
      const availableDoc = await getDoc(doc(db, "metadata", "available"));

      const currentChallenge = currentDoc.exists()
        ? currentDoc.data().name
        : null;

      const challenges: ChallengeOption[] = availableDoc.exists()
        ? availableDoc.data().list || []
        : [];

      setActiveChallenge(currentChallenge);
      setAvailableChallenges(challenges);
    };

    loadChallenges();
  }, []);

  // 🔹 Load data for active challenge
  useEffect(() => {
    if (!activeChallenge) return;

    const fetchData = async () => {
      // Athletes
      const athleteCol = collection(db, activeChallenge);
      const athleteSnap = await getDocs(athleteCol);

      const athleteData: Athlete[] = [];

      for (const docSnap of athleteSnap.docs) {
        const athleteId = docSnap.id;
        const { name } = docSnap.data();

        const activitiesCol = collection(
          db,
          `${activeChallenge}/${athleteId}/activities`
        );
        const activitiesSnap = await getDocs(activitiesCol);

        const activities: Activity[] = activitiesSnap.docs.map((doc) => {
          const data = doc.data();
          return {
            date: data.date?.toDate(),
            type: data.type,
            distance: data.distance,
          };
        });

        activities.sort((a, b) => a.date.getTime() - b.date.getTime());

        const totalPoints = activities.reduce(
          (sum, act) => sum + calculatePoints(act.type, act.distance),
          0
        );

        athleteData.push({ id: athleteId, name, activities, totalPoints });
      }

      athleteData.sort((a, b) => b.totalPoints - a.totalPoints);
      setAthletes(athleteData);

      // 🔹 Metadata for this challenge
      const challengeMetaDoc = await getDoc(
        doc(db, "metadata", activeChallenge)
      );
      if (challengeMetaDoc.exists()) {
        const data = challengeMetaDoc.data();
        setChallengeStart(data.start?.toDate() ?? null);
        setChallengeEnd(data.end?.toDate() ?? null);
        setLastUpdate(data.status?.toDate() ?? null);
        setChallengeDone(data.done ?? false);
      }
    };

    fetchData();
  }, [activeChallenge]);

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

      {/* 🔹 Challenge Selector */}
      {availableChallenges.length > 0 && (
        <div className="mb-8 text-center">
          <label className="mr-2 font-medium text-gray-700">Challenge:</label>
          <select
            value={activeChallenge || ""}
            onChange={(e) => setActiveChallenge(e.target.value)}
            className="border rounded-lg px-3 py-2 shadow-sm"
          >
            {availableChallenges.map((ch) => (
              <option key={ch.name} value={ch.name}>
                {ch.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 🔹 Zeitraum Section */}
      {challengeStart && challengeEnd && (
        <section className="mb-6 bg-gray-50 p-4 rounded-xl shadow-sm text-center">
          <h2 className="text-lg font-semibold text-gray-800 mb-2">
            📅 Zeitraum
          </h2>
          <p className="text-sm text-gray-600">
            {formatGermanDateLong(challengeStart)} –{" "}
            {formatGermanDateLong(challengeEnd)}
          </p>
        </section>
      )}

      {/* Regeln Section - Collapsible */}
      <section className="mb-10 bg-gray-50 p-5 rounded-xl shadow-sm">
        <button
          onClick={() => setRulesOpen((prev) => !prev)}
          className="w-full flex justify-between items-center text-gray-800 font-semibold text-lg mb-3 focus:outline-none"
        >
          <span>📜 Challenge-Regeln</span>
          <span className="ml-2 text-gray-500">{rulesOpen ? "▲" : "▼"}</span>
        </button>

        {rulesOpen && (
          <div className="text-gray-700 text-sm leading-relaxed mt-2 space-y-4">
            {/* 📅 Allgemeines */}
            <div>
              <h3 className="text-base font-semibold flex items-center mb-1">
                📅 <span className="ml-2">Allgemeines</span>
              </h3>
              <p>
                <strong>Tagesaktuelle Meldung:</strong> Alle Aktivitäten müssen
                am selben Tag in die Gruppe gepostet werden.
              </p>
            </div>

            {/* 🏃‍♂️ Laufen */}
            <div>
              <h3 className="text-base font-semibold flex items-center mb-1">
                🏃‍♂️ <span className="ml-2">Laufen</span>
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Punktevergabe: 3 Punkte pro gelaufenem Kilometer</li>
                <li>Mindeststrecke: 1 km</li>
                <li>Mindestpace: 8:00 Minuten pro Kilometer</li>
              </ul>
            </div>

            {/* 🚴‍♀️ Radfahren */}
            <div>
              <h3 className="text-base font-semibold flex items-center mb-1">
                🚴‍♀️ <span className="ml-2">Radfahren</span>
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>Punktevergabe: 1 Punkt pro gefahrenem Kilometer</li>
                <li>Mindeststrecke: 5 km</li>
                <li>Mindestdurchschnittsgeschwindigkeit: 17 km/h</li>
              </ul>
            </div>

            {/* 🏋️‍♂️ Fitnessgeräte */}
            <div>
              <h3 className="text-base font-semibold flex items-center mb-1">
                🏋️‍♂️ <span className="ml-2">Nutzung von Fitnessgeräten</span>
              </h3>
              <p className="mb-2">
                Fitnessgeräte wie Laufband, Ergometer, Hometrainer usw. sind
                grundsätzlich erlaubt, wenn:
              </p>
              <ul className="list-disc list-inside space-y-1 mb-2">
                <li>die gemessenen Werte plausibel und nachvollziehbar sind</li>
                <li>
                  sie den Regeln der entsprechenden Sportart entsprechen (z. B.
                  Mindestpace beim Laufen, Mindestgeschwindigkeit beim
                  Radfahren)
                </li>
              </ul>
            </div>

            {/* 🚫 Nicht erlaubt */}
            <div>
              <h3 className="text-base font-semibold flex items-center mb-1">
                🚫 <span className="ml-2">Nicht erlaubt</span>
              </h3>
              <ul className="list-disc list-inside space-y-1">
                <li>E-Bikes</li>
                <li>
                  Aktivitäten ohne Einhaltung der Mindestanforderungen (z. B. zu
                  langsame Pace, zu kurze Strecken)
                </li>
                <li>Unplausible oder nicht nachvollziehbare Angaben</li>
              </ul>
            </div>
          </div>
        )}
      </section>

      {/* Winner */}
      {challengeDone &&
        challengeEnd &&
        new Date().getTime() >= challengeEnd.getTime() &&
        athletes.length > 0 && (
          <section className="mb-10 bg-yellow-50 border-l-4 border-yellow-400 p-6 rounded-xl shadow-md">
            <div className="flex items-center space-x-4">
              <div className="text-5xl animate-spin-slow">🏆</div>
              <div>
                <h2 className="text-2xl font-bold text-yellow-700">
                  Gewinner: {athletes[0].name}
                </h2>
                <p className="text-md text-yellow-600">
                  Mit {formatPoints(athletes[0].totalPoints)} Punkten!
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

      {/* Aktivitäten */}
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
              onClick={() => handleToggleAthlete(athlete.id)}
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
        <PointsChart
          athletes={athletes}
          startDate={challengeStart}
          endDate={challengeEnd}
        />
      </section>
    </main>
  );
}
