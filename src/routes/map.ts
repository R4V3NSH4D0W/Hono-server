// import { Hono } from 'hono';
// import { getLandmarksNear } from '../services/map/overpass.js';
// import { getRouteDistance } from '../services/map/open-route-service.js';

// const map = new Hono();

// map.post('/check-landmark-distance', async c => {
//   const { lat, lng } = await c.req.json();

//   const landmarks = await getLandmarksNear(lat, lng);

//   for (const lm of landmarks) {
//     const walkingDist = await getRouteDistance(
//       [lm.lng, lm.lat],
//       [lng, lat],
//       'foot-walking'
//     );
//     const drivingDist = await getRouteDistance(
//       [lm.lng, lm.lat],
//       [lng, lat],
//       'driving-car'
//     );
//     if (walkingDist <= 2500 || drivingDist <= 2500) {
//       return c.json({
//         success: true,
//         landmark: lm,
//         walkingDistanceKm: (walkingDist / 1000).toFixed(2),
//         drivingDistanceKm: (drivingDist / 1000).toFixed(2),
//       });
//     }
//   }

//   return c.json({ success: false, message: 'No landmark within 2.5 km' });
// });

// export default map;

import { Hono } from 'hono';
import { getLandmarksNear } from '../services/map/overpass.js';
import { getMatrixDistances } from '../services/map/get-matrix-distances.js';

const map = new Hono();

map.post('/check-landmark-distance', async c => {
  const { lat, lng } = await c.req.json();

  // Step 1: Get nearby landmarks (limit to avoid overload)
  const landmarks = (await getLandmarksNear(lat, lng)).slice(0, 30); // optional limit

  // Step 2: Get matrix distances
  const distances = await getMatrixDistances(landmarks, { lat, lng });

  // Step 3: Log all results
  console.log('\n📍 Initial Landmark Distances:');
  distances.forEach((d, i) => {
    console.log(
      `- ${landmarks[i].name}: Walking = ${(d.walking / 1000).toFixed(2)} km, Driving = ${(d.driving / 1000).toFixed(2)} km`
    );
  });

  // Step 4: Filter only landmarks within 2.5 km
  const valid = distances
    .map((d, i) => ({
      ...d,
      landmark: landmarks[i],
      i,
    }))
    .filter(d => d.walking <= 2500 || d.driving <= 2500);

  if (valid.length === 0) {
    return c.json({
      success: false,
      message: 'No landmark within 2.5 km route distance',
    });
  }

  // Step 5: Sort by closest route (min of walking or driving)
  const closest = valid.sort(
    (a, b) => Math.min(a.walking, a.driving) - Math.min(b.walking, b.driving)
  )[0];

  // Step 6: Return the closest landmark
  return c.json({
    success: true,
    landmark: closest.landmark,
    walkingDistanceKm: (closest.walking / 1000).toFixed(2),
    drivingDistanceKm: (closest.driving / 1000).toFixed(2),
  });
});

export default map;
