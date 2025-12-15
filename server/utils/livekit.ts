import { AccessToken } from "livekit-server-sdk";

export const generateToken = (
  roomName: string,
  userName: string,
  role: "customer" | "agent"
) => {
  const apiKey = process.env.LIVEKIT_API_KEY!;
  const apiSecret = process.env.LIVEKIT_API_SECRET!;

  const token = new AccessToken(apiKey, apiSecret, {
    identity: `${role}_${userName}_${Date.now()}`,
    name: userName,
    ttl: "2h",
  });

  token.addGrant({
    roomJoin: true,
    room: roomName,
    canPublish: true,
    canSubscribe: true,
    canPublishData: true,
    canPublishSources: ["microphone", "camera"],
    hidden: false,
    recorder: false,
  });

  return token.toJwt();
};
