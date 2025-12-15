import { ref, onUnmounted } from "vue";

export const useDeviceCheck = () => {
  const devices = ref<MediaDeviceInfo[]>([]);
  const cameras = ref<MediaDeviceInfo[]>([]);
  const microphones = ref<MediaDeviceInfo[]>([]);
  const speakers = ref<MediaDeviceInfo[]>([]);

  const hasCamera = ref(false);
  const hasMicrophone = ref(false);
  const hasSpeakers = ref(false);

  const permissionStatus = ref<"granted" | "denied" | "prompt">("prompt");
  const isLoading = ref(false);
  const error = ref<string>("");

  // الحصول على قائمة الأجهزة
  const enumerateDevices = async (): Promise<MediaDeviceInfo[]> => {
    try {
      isLoading.value = true;
      error.value = "";

      const deviceList = await navigator.mediaDevices.enumerateDevices();
      devices.value = deviceList;

      cameras.value = deviceList.filter(
        (d) => d.kind === "videoinput" && d.deviceId && d.deviceId !== "default"
      );

      microphones.value = deviceList.filter(
        (d) => d.kind === "audioinput" && d.deviceId && d.deviceId !== "default"
      );

      speakers.value = deviceList.filter(
        (d) =>
          d.kind === "audiooutput" && d.deviceId && d.deviceId !== "default"
      );

      hasCamera.value = cameras.value.length > 0;
      hasMicrophone.value = microphones.value.length > 0;
      hasSpeakers.value = speakers.value.length > 0;

      return deviceList;
    } catch (err: any) {
      error.value = `خطأ في سرد الأجهزة: ${err.message}`;
      throw err;
    } finally {
      isLoading.value = false;
    }
  };

  // طلب إذن الوصول للأجهزة
  const requestPermissions = async (): Promise<boolean> => {
    try {
      error.value = "";

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      stream.getTracks().forEach((track) => track.stop());

      await enumerateDevices();

      permissionStatus.value = "granted";
      return true;
    } catch (err: any) {
      permissionStatus.value = "denied";
      error.value = `رفض إذن الوصول: ${err.message}`;
      return false;
    }
  };

  // اختبار الكاميرا
  const testCamera = async (deviceId?: string): Promise<MediaStream | null> => {
    try {
      const constraints = deviceId
        ? { video: { deviceId: { exact: deviceId } } }
        : { video: true };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      error.value = `خطأ في اختبار الكاميرا: ${err.message}`;
      return null;
    }
  };

  // اختبار الميكروفون
  const testMicrophone = async (
    deviceId?: string
  ): Promise<MediaStream | null> => {
    try {
      const constraints = deviceId
        ? { audio: { deviceId: { exact: deviceId } } }
        : { audio: true };

      return await navigator.mediaDevices.getUserMedia(constraints);
    } catch (err: any) {
      error.value = `خطأ في اختبار الميكروفون: ${err.message}`;
      return null;
    }
  };

  // اختبار السماعات
  const testSpeakers = async (): Promise<boolean> => {
    return new Promise((resolve) => {
      const audioContext = new (window.AudioContext ||
        (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      oscillator.frequency.value = 440;
      gainNode.gain.value = 0.1;

      oscillator.start();

      setTimeout(() => {
        oscillator.stop();
        audioContext.close();
        resolve(true);
      }, 500);
    });
  };

  // التحقق الشامل
  const checkAllDevices = async () => {
    await requestPermissions();
    await enumerateDevices();

    return {
      cameras: cameras.value,
      microphones: microphones.value,
      speakers: speakers.value,
      hasCamera: hasCamera.value,
      hasMicrophone: hasMicrophone.value,
      hasSpeakers: hasSpeakers.value,
      permission: permissionStatus.value,
    };
  };

  // تنظيف الموارد
  const cleanup = () => {
    // لا توجد حاليًا موارد دائمة تحتاج للتنظيف
  };

  onUnmounted(() => {
    cleanup();
  });

  return {
    // البيانات
    devices,
    cameras,
    microphones,
    speakers,
    hasCamera,
    hasMicrophone,
    hasSpeakers,
    permissionStatus,
    isLoading,
    error,

    // الوظائف
    enumerateDevices,
    requestPermissions,
    testCamera,
    testMicrophone,
    testSpeakers,
    checkAllDevices,
    cleanup,
  };
};
