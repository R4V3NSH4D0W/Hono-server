export async function getMatrixDistances(
  landmarks: { lat: number; lng: number }[],
  destination: { lat: number; lng: number }
): Promise<
  {
    walking: number;
    driving: number;
  }[]
> {
  const locations = [
    ...landmarks.map(lm => [lm.lng, lm.lat]),
    [destination.lng, destination.lat],
  ];
  const sources = landmarks.map((_, i) => i);
  const destIndex = locations.length - 1;

  const getDistanceMatrix = async (mode: 'foot-walking' | 'driving-car') => {
    const res = await fetch(
      `https://api.openrouteservice.org/v2/matrix/${mode}`,
      {
        method: 'POST',
        headers: {
          Authorization: process.env.ORS_API_KEY!,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          locations,
          sources,
          destinations: [destIndex],
          metrics: ['distance'],
        }),
      }
    );
    const data = await res.json();
    return data.distances.map((row: number[]) => row[0]);
  };

  // Parallel fetches for walking and driving distances
  const [walkingDistances, drivingDistances] = await Promise.all([
    getDistanceMatrix('foot-walking'),
    getDistanceMatrix('driving-car'),
  ]);

  // Combine both results
  return landmarks.map((_, i) => ({
    walking: walkingDistances[i],
    driving: drivingDistances[i],
  }));
}
