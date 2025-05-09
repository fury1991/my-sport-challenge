export type Activity = {
  date: Date;
  type: string;
  distance: number;
};

export type Athlete = {
  id: string;
  name: string;
  activities: Activity[];
  totalPoints: number; // Optional, je nach Bedarf
};
