export default defineEventHandler(async (event) => {
  const body = await readBody(event);
  const { roomName, userName, role } = body;

  if (!roomName || !userName || !role) {
    throw createError({
      statusCode: 400,
      message: "الحقول المطلوبة: roomName, userName, role",
    });
  }

  // تحميل مكتبة LiveKit Server SDK
  const { AccessToken } = await import("livekit-server-sdk");

  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  try {
    // إنشاء هوية فريدة مع الطابع الزمني
    const identity = `${role}_${userName}_${Date.now()}`;

    // إنشاء توكن مع metadata مفصلة
    const token = new AccessToken(apiKey, apiSecret, {
      identity: identity,
      name: userName,
      ttl: "3h",
      metadata: JSON.stringify({
        role,
        userName,
        displayName: userName,
        joinedAt: new Date().toISOString(),
        roomName,
      }),
    });

    // منح صلاحيات كاملة
    token.addGrant({
      roomJoin: true,
      room: roomName,
      canPublish: true,
      canSubscribe: true,
      canPublishData: true,
      canPublishSources: ["camera", "microphone", "screen_share"],
      canUpdateMetadata: true,
      hidden: false,
      recorder: false,
    });

    const jwt = token.toJwt();

    console.log("🎫 تم إنشاء توكن:", {
      room: roomName,
      user: userName,
      role,
      identity,
      timestamp: new Date().toISOString(),
    });

    return {
      token: jwt,
      wsUrl: process.env.LIVEKIT_WS_URL,
      roomName,
      userName,
      role,
      identity,
      timestamp: Date.now(),
    };
  } catch (error: any) {
    console.error("❌ خطأ في إنشاء التوكن:", error);
    throw createError({
      statusCode: 500,
      message: `فشل إنشاء التوكن: ${error.message}`,
    });
  }
});
