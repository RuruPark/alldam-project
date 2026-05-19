import { createDrivingCommuteResponse } from "./_driving-core.js";

export default async function handler(request, response) {
  const method = request.method ?? "GET";

  if (method !== "GET" && method !== "POST") {
    response.setHeader("Allow", "GET, POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const body = method === "POST" ? request.body ?? {} : request.query ?? {};
  const result = await createDrivingCommuteResponse({
    start: body.start ?? {
      lat: body.startLat ?? body.slat,
      lng: body.startLng ?? body.slng
    },
    goal: body.goal ?? {
      lat: body.goalLat ?? body.elat,
      lng: body.goalLng ?? body.elng
    }
  });

  response.status(result.statusCode).json(result.body);
}
