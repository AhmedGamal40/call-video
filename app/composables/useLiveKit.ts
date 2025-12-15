import { ref, onUnmounted } from "vue";
import {
  Room,
  RoomEvent,
  RemoteParticipant,
  createLocalVideoTrack,
  createLocalAudioTrack,
  Track,
  LocalTrackPublication,
  RemoteTrackPublication,
  Participant,
  RemoteTrack,
  LocalParticipant,
} from "livekit-client";

export const useLiveKit = () => {
  // الحالة الأساسية
  const room = ref<Room | null>(null);
  const localVideoTrack = ref<any>(null);
  const localAudioTrack = ref<any>(null);
  const remoteParticipant = ref<RemoteParticipant | null>(null);
  const remoteVideoTrack = ref<any>(null);
  const remoteAudioTrack = ref<any>(null);

  // حالة الاتصال
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const isAudioMuted = ref(false);
  const isVideoOff = ref(false);
  const participants = ref<RemoteParticipant[]>([]);
  const connectionError = ref<string>("");

  // بيانات المشاركين
  const participantNames = ref<Record<string, string>>({});

  // إحصائيات
  const callDuration = ref(0);
  let callTimer: NodeJS.Timeout | null = null;

  // 🔥 دالة الاتصال الرئيسية مع Metadata
  const connectToRoom = async (
    token: string,
    wsUrl: string,
    userName: string,
    userDisplayName?: string
  ) => {
    try {
      isConnecting.value = true;
      connectionError.value = "";

      console.log("🚀 بدء الاتصال المباشر...", { userName, userDisplayName });

      // 1. التحقق من الأجهزة المتاحة
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      } catch (error) {
        console.warn("⚠️ بعض الأجهزة غير متاحة، سيتم الاستمرار:", error);
      }

      // 2. إعدادات الوسائط المحلية
      let localStream: MediaStream | null = null;

      try {
        localStream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280, min: 640 },
            height: { ideal: 720, min: 480 },
            facingMode: "user",
            frameRate: { ideal: 30, min: 15 },
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000,
          },
        });
        console.log("✅ تم الحصول على الوسائط المحلية");
      } catch (mediaError) {
        console.warn(
          "⚠️ لا يمكن الوصول للأجهزة، سيتم الاتصال بدون وسائط:",
          mediaError
        );
      }

      // 3. إنشاء وتوصيل الغرفة مع Metadata
      const newRoom = new Room({
        adaptiveStream: true,
        dynacast: true,
        videoCaptureDefaults: {
          resolution: { width: 1280, height: 720 },
        },
      });

      // 4. إعداد معالجات الأحداث
      setupEventHandlers(newRoom);

      // 5. الاتصال بخادم LiveKit مع Metadata
      console.log("🔗 جاري الاتصال بخادم LiveKit...");
      await newRoom.connect(wsUrl, token, {
        autoSubscribe: true,
        publishOnly: "user_media", // نشر الوسائط فقط
      });

      // 6. تعيين Metadata للمشارك المحلي
      if (newRoom.localParticipant) {
        const metadata = JSON.stringify({
          displayName: userDisplayName || userName,
          role: "customer",
          joinedAt: new Date().toISOString(),
        });
        newRoom.localParticipant.setMetadata(metadata);
        console.log("📝 تم تعيين Metadata للمشارك المحلي:", metadata);
      }

      // 7. نشر الوسائط المحلية
      if (localStream) {
        await publishLocalTracks(newRoom, localStream);
      }

      // 8. تحديث الحالة
      room.value = newRoom;
      isConnected.value = true;
      isConnecting.value = false;

      // 9. حفظ اسم المشارك المحلي
      participantNames.value[newRoom.localParticipant.identity] =
        userDisplayName || userName;

      // 10. بدء مؤقت المكالمة
      startCallTimer();

      // 11. الاشتراك في المشاركين الموجودين
      newRoom.participants.forEach((participant) => {
        if (participant.identity !== newRoom.localParticipant.identity) {
          handleParticipantConnected(participant);
        }
      });

      console.log(`🎉 ${userName} متصل بالغرفة بنجاح`);
      return {
        success: true,
        room: newRoom,
        localParticipant: newRoom.localParticipant,
      };
    } catch (error: any) {
      console.error("❌ خطأ في الاتصال:", error);
      isConnecting.value = false;
      connectionError.value = error.message;

      let errorMessage = "فشل الاتصال بالخادم";
      if (error.message.includes("Failed to fetch")) {
        errorMessage = "تعذر الاتصال بخادم LiveKit. تحقق من اتصال الإنترنت.";
      } else if (error.message.includes("Invalid token")) {
        errorMessage = "رمز الدخول غير صالح.";
      } else if (error.message.includes("Room not found")) {
        errorMessage = "الغرفة غير موجودة.";
      }

      throw new Error(errorMessage);
    }
  };

  // 🔥 إعداد معالجات الأحداث المتقدمة
  const setupEventHandlers = (room: Room) => {
    room
      .on(RoomEvent.ParticipantConnected, handleParticipantConnected)
      .on(RoomEvent.ParticipantDisconnected, handleParticipantDisconnected)
      .on(RoomEvent.Disconnected, handleDisconnect)
      .on(RoomEvent.TrackSubscribed, handleTrackSubscribed)
      .on(RoomEvent.TrackUnsubscribed, handleTrackUnsubscribed)
      .on(RoomEvent.LocalTrackPublished, handleLocalTrackPublished)
      .on(RoomEvent.TrackPublished, handleTrackPublished)
      .on(RoomEvent.TrackMuted, handleTrackMuted)
      .on(RoomEvent.TrackUnmuted, handleTrackUnmuted)
      .on(
        RoomEvent.ParticipantMetadataChanged,
        handleParticipantMetadataChanged
      )
      .on(RoomEvent.ConnectionStateChanged, handleConnectionStateChanged);
  };

  // 🔥 معالجة تغيير Metadata للمشارك
  const handleParticipantMetadataChanged = (
    metadata: string | undefined,
    participant: RemoteParticipant
  ) => {
    console.log(`📝 تغيير Metadata لـ ${participant.identity}:`, metadata);

    if (metadata) {
      try {
        const data = JSON.parse(metadata);
        if (data.displayName) {
          participantNames.value[participant.identity] = data.displayName;
          console.log(`👤 اسم ${participant.identity}: ${data.displayName}`);
        }
      } catch (error) {
        console.warn("❌ خطأ في تحليل Metadata:", error);
      }
    }
  };

  // 🔥 معالجة تغيير حالة الاتصال
  const handleConnectionStateChanged = (state: any) => {
    console.log("🔄 تغيير حالة الاتصال:", state);
  };

  // 🔥 نشر الوسائط المحلية المحسنة
  const publishLocalTracks = async (room: Room, stream: MediaStream) => {
    const videoTracks = stream.getVideoTracks();
    const audioTracks = stream.getAudioTracks();

    if (videoTracks.length > 0) {
      try {
        const track = videoTracks[0];
        localVideoTrack.value = await createLocalVideoTrack(track, {
          name: "camera",
          source: Track.Source.Camera,
          videoEncoding: {
            maxBitrate: 2_500_000,
            maxFramerate: 30,
          },
        });

        await room.localParticipant.publishTrack(localVideoTrack.value, {
          name: "webcam",
          source: Track.Source.Camera,
          videoEncoding: {
            maxBitrate: 2_500_000,
            maxFramerate: 30,
          },
        });
        console.log("📹 تم نشر الفيديو المحلي بجودة عالية");
      } catch (error) {
        console.error("❌ خطأ في نشر الفيديو:", error);
      }
    }

    if (audioTracks.length > 0) {
      try {
        const track = audioTracks[0];
        localAudioTrack.value = await createLocalAudioTrack(track, {
          name: "microphone",
          source: Track.Source.Microphone,
          audioEncoding: {
            maxBitrate: 128_000,
            stereo: true,
          },
        });

        await room.localParticipant.publishTrack(localAudioTrack.value, {
          name: "microphone",
          source: Track.Source.Microphone,
          audioEncoding: {
            maxBitrate: 128_000,
            stereo: true,
          },
        });
        console.log("🎤 تم نشر الصوت المحلي بجودة عالية");
      } catch (error) {
        console.error("❌ خطأ في نشر الصوت:", error);
      }
    }

    // تنظيف الـ stream الأصلي
    setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
    }, 1000);
  };

  // 🔥 معالجة وصول مشارك جديد مع استخراج الاسم
  const handleParticipantConnected = (participant: RemoteParticipant) => {
    console.log(`👤 ${participant.identity} انضم إلى الغرفة`);

    if (participant.identity !== room.value?.localParticipant.identity) {
      remoteParticipant.value = participant;
      participants.value.push(participant);

      // استخراج الاسم من Metadata أو الهوية
      const displayName = extractParticipantName(participant);
      participantNames.value[participant.identity] = displayName;

      console.log(`📝 اسم المشارك: ${displayName}`);

      // الاشتراك في جميع تتبعات المشارك
      participant.tracks.forEach((publication) => {
        if (publication.track) {
          handleTrackSubscribed(publication.track, publication, participant);
        }
      });
    }
  };

  // 🔥 استخراج اسم المشارك من Metadata أو الهوية
  const extractParticipantName = (participant: RemoteParticipant): string => {
    // 1. التحقق من Metadata
    if (participant.metadata) {
      try {
        const metadata = JSON.parse(participant.metadata);
        if (metadata.displayName) {
          return metadata.displayName;
        }
      } catch (error) {
        console.warn("❌ خطأ في تحليل Metadata:", error);
      }
    }

    // 2. استخراج من الهوية (تنسيق: role_name_timestamp)
    const identity = participant.identity;
    const parts = identity.split("_");

    if (parts.length >= 2) {
      const role = parts[0];
      const name = parts[1];

      // تحويل الأدوار العربية
      if (role === "customer" || role === "عميل") {
        return `عميل: ${name}`;
      } else if (role === "agent" || role === "وكيل") {
        return `وكيل: ${name}`;
      }

      return name;
    }

    // 3. اسم افتراضي
    return participant.identity;
  };

  // 🔥 الحصول على اسم المشارك
  const getParticipantName = (participantId: string): string => {
    return participantNames.value[participantId] || participantId;
  };

  // 🔥 الحصول على اسم المشارك البعيد
  const getRemoteParticipantName = (): string => {
    if (remoteParticipant.value) {
      return getParticipantName(remoteParticipant.value.identity);
    }
    return "";
  };

  // 🔥 معالجة الاشتراك في تتبع جديد
  const handleTrackSubscribed = (
    track: Track,
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log(
      `📡 تم الاشتراك في ${track.kind} من ${getParticipantName(
        participant.identity
      )}`
    );

    if (participant.identity !== room.value?.localParticipant.identity) {
      if (track.kind === "video") {
        remoteVideoTrack.value = track;
        console.log("🎥 تم استقبال فيديو من الطرف الآخر");

        // التحقق من أن الفيديو يعمل
        if (track.mediaStreamTrack) {
          const videoElement = document.createElement("video");
          videoElement.srcObject = new MediaStream([track.mediaStreamTrack]);
          videoElement.onloadedmetadata = () => {
            console.log("✅ فيديو الطرف الآخر يعمل:", {
              width: videoElement.videoWidth,
              height: videoElement.videoHeight,
              readyState: videoElement.readyState,
            });
          };
        }
      } else if (track.kind === "audio") {
        remoteAudioTrack.value = track;
        console.log("🔊 تم استقبال صوت من الطرف الآخر");

        // التحقق من أن الصوت يعمل
        if (track.mediaStreamTrack) {
          const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
          const source = audioContext.createMediaStreamSource(
            new MediaStream([track.mediaStreamTrack])
          );
          source.connect(audioContext.destination);
          console.log("✅ صوت الطرف الآخر يعمل");
        }
      }
    }
  };

  // 🔥 معالجة مغادرة مشارك
  const handleParticipantDisconnected = (participant: RemoteParticipant) => {
    const participantName = getParticipantName(participant.identity);
    console.log(`👋 ${participantName} غادر الغرفة`);

    participants.value = participants.value.filter(
      (p) => p.identity !== participant.identity
    );
    delete participantNames.value[participant.identity];

    if (remoteParticipant.value?.identity === participant.identity) {
      remoteParticipant.value = null;
      remoteVideoTrack.value = null;
      remoteAudioTrack.value = null;
    }
  };

  // 🔥 معالجات أخرى
  const handleTrackPublished = (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log(
      `📤 ${getParticipantName(participant.identity)} نشر ${
        publication.track?.kind
      }`
    );
  };

  const handleLocalTrackPublished = (publication: LocalTrackPublication) => {
    console.log(`📤 تم نشر ${publication.track?.kind} محليًا`);
  };

  const handleTrackMuted = (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log(
      `🔇 ${getParticipantName(participant.identity)} كتم ${
        publication.track?.kind
      }`
    );
  };

  const handleTrackUnmuted = (
    publication: RemoteTrackPublication,
    participant: RemoteParticipant
  ) => {
    console.log(
      `🔊 ${getParticipantName(participant.identity)} أزال كتم ${
        publication.track?.kind
      }`
    );
  };

  // 🔥 قطع الاتصال
  const handleDisconnect = () => {
    console.log("🔴 تم قطع الاتصال من الخادم");
    disconnect();
  };

  // 🔥 بدء مؤقت المكالمة
  const startCallTimer = () => {
    if (callTimer) clearInterval(callTimer);
    callDuration.value = 0;

    callTimer = setInterval(() => {
      callDuration.value += 1;
    }, 1000);
  };

  // 🔥 تبديل حالة الصوت المحسنة
  const toggleAudio = async () => {
    if (!room.value || !isConnected.value) return;

    try {
      if (isAudioMuted.value) {
        // تشغيل الصوت
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            channelCount: 2,
            sampleRate: 48000,
          },
        });

        const audioTrack = stream.getAudioTracks()[0];
        if (audioTrack) {
          localAudioTrack.value = await createLocalAudioTrack(audioTrack, {
            name: "microphone",
            source: Track.Source.Microphone,
          });

          await room.value.localParticipant.publishTrack(
            localAudioTrack.value,
            {
              name: "microphone",
              source: Track.Source.Microphone,
            }
          );

          isAudioMuted.value = false;
          console.log("🔊 تم تفعيل الصوت بجودة عالية");

          stream.getTracks().forEach((t) => {
            if (t !== audioTrack) t.stop();
          });
        }
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

  // 🔥 تبديل حالة الفيديو المحسنة
  const toggleVideo = async () => {
    if (!room.value || !isConnected.value) return;

    try {
      if (isVideoOff.value) {
        // تشغيل الفيديو
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
            frameRate: { ideal: 30 },
          },
        });

        const videoTrack = stream.getVideoTracks()[0];
        if (videoTrack) {
          localVideoTrack.value = await createLocalVideoTrack(videoTrack, {
            name: "camera",
            source: Track.Source.Camera,
          });

          await room.value.localParticipant.publishTrack(
            localVideoTrack.value,
            {
              name: "webcam",
              source: Track.Source.Camera,
            }
          );

          isVideoOff.value = false;
          console.log("🎥 تم تشغيل الكاميرا بجودة عالية");

          stream.getTracks().forEach((t) => {
            if (t !== videoTrack) t.stop();
          });
        }
      } else {
        // إيقاف الفيديو
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

  // 🔥 قطع الاتصال الكامل
  const disconnect = () => {
    console.log("🛑 قطع الاتصال...");

    // إيقاف المؤقت
    if (callTimer) {
      clearInterval(callTimer);
      callTimer = null;
    }

    // إيقاف الـ Room
    if (room.value) {
      room.value.disconnect();
    }

    // إيقاف الوسائط المحلية
    if (localVideoTrack.value) {
      localVideoTrack.value.stop();
      localVideoTrack.value = null;
    }

    if (localAudioTrack.value) {
      localAudioTrack.value.stop();
      localAudioTrack.value = null;
    }

    // إعادة تعيين الحالة
    room.value = null;
    remoteParticipant.value = null;
    remoteVideoTrack.value = null;
    remoteAudioTrack.value = null;
    isConnected.value = false;
    isConnecting.value = false;
    isAudioMuted.value = false;
    isVideoOff.value = false;
    participants.value = [];
    participantNames.value = {};
    callDuration.value = 0;

    console.log("✅ تم قطع الاتصال بالكامل");
  };

  // 🔥 تنسيق مدة المكالمة
  const formatCallDuration = () => {
    const minutes = Math.floor(callDuration.value / 60);
    const seconds = callDuration.value % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // 🔥 التحقق من أن الصوت يعمل
  const checkAudioStatus = () => {
    if (!remoteAudioTrack.value) return "غير متوفر";

    const track = remoteAudioTrack.value;
    if (track.mediaStreamTrack) {
      return track.mediaStreamTrack.enabled ? "يعمل 🔊" : "معطل";
    }
    return "غير معروف";
  };

  // 🔥 التحقق من أن الفيديو يعمل
  const checkVideoStatus = () => {
    if (!remoteVideoTrack.value) return "غير متوفر";

    const track = remoteVideoTrack.value;
    if (track.mediaStreamTrack) {
      return track.mediaStreamTrack.enabled ? "يعمل 📹" : "معطل";
    }
    return "غير معروف";
  };

  // التنظيف عند تدمير المكون
  onUnmounted(() => {
    disconnect();
  });

  return {
    // الحالة
    room,
    localVideoTrack,
    localAudioTrack,
    remoteParticipant,
    remoteVideoTrack,
    remoteAudioTrack,
    isConnected,
    isConnecting,
    isAudioMuted,
    isVideoOff,
    participants,
    participantNames,
    connectionError,
    callDuration: formatCallDuration,

    // الوظائف
    connectToRoom,
    toggleAudio,
    toggleVideo,
    disconnect,
    getParticipantName,
    getRemoteParticipantName,
    checkAudioStatus,
    checkVideoStatus,
    extractParticipantName,
  };
};
