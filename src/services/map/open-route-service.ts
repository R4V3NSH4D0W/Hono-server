export async function getRouteDistance(
  from: [number, number],
  to: [number, number],
  mode: string = 'foot-walking'
) {
  const res = await fetch(
    `https://api.openrouteservice.org/v2/directions/${mode}`,
    {
      method: 'POST',
      headers: {
        Authorization: (() => {
          if (!process.env.ORS_API_KEY) {
            throw new Error('ORS_API_KEY environment variable is not set');
          }
          return process.env.ORS_API_KEY;
        })(),
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ coordinates: [from, to] }),
    }
  );
  const data = await res.json();
  console.log('ORS Response:', data.routes);
  return data.routes[0].summary.distance;
}
