export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomName, userName, role } = body;

  if (!roomName || !userName || !role) {
    throw createError({
      statusCode: 400,
      message: "Missing required fields",
    });
  }

  const { generateToken } = await import("../utils/livekit");

  try {
    const token = generateToken(roomName, userName, role);

    return {
      token,
      wsUrl: process.env.LIVEKIT_WS_URL,
    };
  } catch (error) {
    throw createError({
      statusCode: 500,
      message: "Failed to generate token",
    });
  }
});
