import { createDrivingBatchResponse } from "./_driving-core.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    response.status(405).json({ message: "Method not allowed" });
    return;
  }

  const result = await createDrivingBatchResponse({
    start: request.body?.start,
    goals: request.body?.goals
  });

  response.status(result.statusCode).json(result.body);
}
