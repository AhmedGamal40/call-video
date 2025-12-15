import { ref, onUnmounted } from "vue";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  createLocalVideoTrack,
  createLocalAudioTrack,
  Track,
  LocalTrackPublication,
} from "livekit-client";

export const useLiveKit = () => {
  const room = ref<Room | null>(null);
  const localVideoTrack = ref<any>(null);
  const localAudioTrack = ref<any>(null);
  const remoteParticipant = ref<RemoteParticipant | null>(null);
  const remoteVideoTrack = ref<any>(null);
  const remoteAudioTrack = ref<any>(null);
  const isConnected = ref(false);
  const isAudioMuted = ref(false);
  const isVideoOff = ref(false);
  const participants = ref<string[]>([]);

  const connectToRoom = async (
    token: string,
    wsUrl: string,
    userName: string
  ) => {
    try {
      console.log("🚀 بدء الاتصال بالغرفة...");

      // طلب إذن الكاميرا والميكروفون أولاً
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      console.log("✅ تم الحصول على إذن الكاميرا والميكروفون");

      // إنشاء التتبعات من الـ stream
      const videoTracks = stream.getVideoTracks();
      const audioTracks = stream.getAudioTracks();

      localVideoTrack.value = await createLocalVideoTrack({
        deviceId: videoTracks[0]?.getSettings().deviceId
      });
      localAudioTrack.value = await createLocalAudioTrack({
        deviceId: audioTracks[0]?.getSettings().deviceId
      });

      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
      });

      // إعداد معالجات الأحداث
      newRoom
        .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
        .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
        .on(RoomEvent.Disconnected, handleDisconnect)
        .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
        .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
        .on(RoomEvent.LocalTrackPublished, (track, participant) => {
          console.log("📤 تم نشر التتبع المحلي:", track.kind);
        });

      // الاتصال بالغرفة
      await newRoom.connect(wsUrl, token);
      console.log("🔗 تم الاتصال بالغرفة بنجاح");

      // نشر التتبعات
      await newRoom.localParticipant.publishTrack(localVideoTrack.value);
      await newRoom.localParticipant.publishTrack(localAudioTrack.value);
      console.log("🎥🎤 تم نشر الفيديو والصوت");

      room.value = newRoom;
      isConnected.value = true;

      // إيقاف الـ stream الأصلي بعد الإنشاء
      stream.getTracks().forEach((track) => track.stop());

      console.log(`✅ ${userName} متصل ومستعد للمكالمة`);

      return { success: true, room: newRoom };
    } catch (error) {
      console.error("❌ خطأ في الاتصال:", error);
      throw error;
    }
  };

  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log(`👤 ${participant.identity} انضم إلى الغرفة`);

    if (participant.identity !== room.value?.localParticipant.identity) {
      remoteParticipant.value = participant;
      participants.value.push(participant.identity);
    }
  };

  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    console.log(`👋 ${participant.identity} غادر الغرفة`);
    participants.value = participants.value.filter(
      (p) => p !== participant.identity
    );
    if (remoteParticipant.value?.identity === participant.identity) {
      remoteParticipant.value = null;
      remoteVideoTrack.value = null;
      remoteAudioTrack.value = null;
    }
  };

  const handleTrackSubscribed = (
    track: Track,
    publication: any,
    participant: RemoteParticipant
  ) => {
    if (participant.identity === remoteParticipant.value?.identity) {
      if (track.kind === "video") {
        remoteVideoTrack.value = track;
        console.log("📹 تم استقبال فيديو من الشخص الآخر");
      } else if (track.kind === "audio") {
        remoteAudioTrack.value = track;
        console.log("🔊 تم استقبال صوت من الشخص الآخر");
      }
    }
  };

  const handleTrackUnsubscribed = (
    track: Track,
    publication: any,
    participant: RemoteParticipant
  ) => {
    if (track.kind === "video") {
      remoteVideoTrack.value = null;
    } else if (track.kind === "audio") {
      remoteAudioTrack.value = null;
    }
  };

  const handleDisconnect = () => {
    console.log("🔴 تم قطع الاتصال");
    disconnect();
  };

  const toggleAudio = async () => {
    if (!room.value) return;

    try {
      if (isAudioMuted.value) {
        // تفعيل الصوت
        localAudioTrack.value = await createLocalAudioTrack({
          echoCancellation: true,
          noiseSuppression: true,
        });
        await room.value.localParticipant.publishTrack(localAudioTrack.value);
        isAudioMuted.value = false;
        console.log("🔊 تم تفعيل الصوت");
      } else {
        // كتم الصوت
        if (localAudioTrack.value) {
          await room.value.localParticipant.unpublishTrack(
            localAudioTrack.value
          );
          localAudioTrack.value.stop();
          localAudioTrack.value = null;
          isAudioMuted.value = true;
          console.log("🔇 تم كتم الصوت");
        }
      }
    } catch (error) {
      console.error("❌ خطأ في تبديل الصوت:", error);
    }
  };

  const toggleVideo = async () => {
    if (!room.value) return;

    try {
      if (isVideoOff.value) {
        // تشغيل الكاميرا
        localVideoTrack.value = await createLocalVideoTrack({
          facingMode: "user",
          resolution: { width: 1280, height: 720 },
        });
        await room.value.localParticipant.publishTrack(localVideoTrack.value);
        isVideoOff.value = false;
        console.log("🎥 تم تشغيل الكاميرا");
      } else {
        // إيقاف الكاميرا
        if (localVideoTrack.value) {
          await room.value.localParticipant.unpublishTrack(
            localVideoTrack.value
          );
          localVideoTrack.value.stop();
          localVideoTrack.value = null;
          isVideoOff.value = true;
          console.log("📵 تم إيقاف الكاميرا");
        }
      }
    } catch (error) {
      console.error("❌ خطأ في تبديل الفيديو:", error);
    }
  };

  const disconnect = () => {
    console.log("🛑 قطع الاتصال...");

    if (room.value) {
      room.value.disconnect();
    }

    if (localVideoTrack.value) {
      localVideoTrack.value.stop();
    }

    if (localAudioTrack.value) {
      localAudioTrack.value.stop();
    }

    room.value = null;
    localVideoTrack.value = null;
    localAudioTrack.value = null;
    remoteParticipant.value = null;
    remoteVideoTrack.value = null;
    remoteAudioTrack.value = null;
    isConnected.value = false;
    isAudioMuted.value = false;
    isVideoOff.value = false;
    participants.value = [];

    console.log("✅ تم قطع الاتصال بالكامل");
  };

  onUnmounted(() => {
    disconnect();
  });

  return {
    room,
    localVideoTrack,
    localAudioTrack,
    remoteParticipant,
    remoteVideoTrack,
    remoteAudioTrack,
    isConnected,
    isAudioMuted,
    isVideoOff,
    participants,
    connectToRoom,
    toggleAudio,
    toggleVideo,
    disconnect,
  };
};
