export async function getLandmarksNear(lat: number, lng: number) {
  const query = `
    [out:json];
    (
      node["tourism"="attraction"](around:2500,${lat},${lng});
      node["historic"](around:2500,${lat},${lng});
    );
    out center;
  `;
  const res = await fetch('https://overpass-api.de/api/interpreter', {
    method: 'POST',
    body: query,
  });
  const data = await res.json();
  return data.elements
    .filter(
      (el: any) =>
        el.tags?.name && el.tags.name.trim().toLowerCase() !== 'unknown'
    )
    .map((el: any) => ({
      id: el.id,
      name: el.tags.name,
      lat: el.lat,
      lng: el.lon,
    }));
}
