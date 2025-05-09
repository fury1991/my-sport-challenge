export function calculatePoints(type: string, distance: number): number {
  let points = 0;

  switch (type.toLowerCase()) {
    case "laufen":
      points = distance * 3;
      break;
    case "fahrrad":
      points = distance * 1;
      break;
    default:
      points = 0;
  }

  return Math.round(points * 100) / 100; // auf 2 Nachkommastellen runden
}

export function formatPoints(points: number): string {
  return points.toFixed(2);
}

export function getActivityIcon(type: string): string {
  switch (type.toLowerCase()) {
    case "laufen":
      return "🏃";
    case "fahrrad":
      return "🚴";
    default:
      return "❓";
  }
}
