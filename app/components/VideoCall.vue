<template>
  <div class="video-call-container">
    <!-- رأس المكالمة -->
    <UCard class="mb-4">
      <div class="flex justify-between items-center">
        <div>
          <h2 class="text-xl font-bold">{{ title }}</h2>
          <p class="text-gray-600">الغرفة: {{ roomId }}</p>
        </div>
        
        <div class="flex items-center gap-2">
          <UBadge :color="isConnected ? 'green' : 'red'">
            {{ isConnected ? '🟢 متصل' : '🔴 غير متصل' }}
          </UBadge>
          
          <UBadge v-if="participants.length > 1" color="blue">
            👥 {{ participants.length - 1 }} شخص في المكالمة
          </UBadge>
        </div>
      </div>
    </UCard>

    <!-- منطقة الفيديو -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- فيديو الشخص الآخر -->
      <div class="video-area">
        <h3 class="text-lg font-semibold mb-2">
          {{ remoteParticipantName || 'في انتظار شخص آخر...' }}
        </h3>
        <div class="video-wrapper bg-black rounded-xl overflow-hidden border-2 border-blue-500">
          <video 
            v-if="remoteVideoStream"
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          />
          <div v-else class="flex flex-col items-center justify-center h-64 text-white">
            <UIcon name="i-heroicons-user" class="w-20 h-20 text-gray-500 mb-4" />
            <p>في انتظار اتصال الشخص الآخر...</p>
          </div>
        </div>
        
        <div v-if="remoteParticipantName" class="mt-2 text-sm text-green-600">
          <UIcon name="i-heroicons-check-circle" class="w-4 h-4 inline mr-1" />
          متصل
        </div>
      </div>

      <!-- فيديو الخاص بك -->
      <div class="video-area">
        <h3 class="text-lg font-semibold mb-2">
          أنت 
          <span class="text-blue-600">{{ userName }}</span>
        </h3>
        <div class="video-wrapper bg-black rounded-xl overflow-hidden border-2 border-green-500 relative">
          <video 
            v-if="localVideoStream"
            ref="localVideoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          />
          <div v-else class="flex flex-col items-center justify-center h-64 text-white">
            <UIcon name="i-heroicons-video-camera-slash" class="w-20 h-20 text-gray-500 mb-4" />
            <p>الكاميرا غير نشطة</p>
          </div>
          
          <!-- مؤشرات الحالة -->
          <div class="absolute top-3 left-3 flex gap-2">
            <UBadge v-if="isAudioMuted" color="red" size="sm" class="bg-red-600">
              <UIcon name="i-heroicons-microphone-slash" class="w-3 h-3" />
            </UBadge>
            <UBadge v-if="isVideoOff" color="red" size="sm" class="bg-red-600">
              <UIcon name="i-heroicons-video-camera-slash" class="w-3 h-3" />
            </UBadge>
          </div>
        </div>
        
        <div class="mt-2 text-sm text-blue-600">
          <UIcon name="i-heroicons-user-circle" class="w-4 h-4 inline mr-1" />
          أنت
        </div>
      </div>
    </div>

    <!-- أدوات التحكم -->
    <UCard class="mb-6">
      <div class="flex justify-center gap-4">
        <!-- زر الصوت -->
        <UButton 
          :color="isAudioMuted ? 'red' : 'green'"
          :variant="isAudioMuted ? 'solid' : 'outline'"
          @click="toggleAudio"
          :disabled="!isConnected"
          size="xl"
          class="px-6 py-3"
        >
          <template #leading>
            <UIcon :name="isAudioMuted ? 'i-heroicons-microphone-slash' : 'i-heroicons-microphone'" class="w-6 h-6" />
          </template>
          {{ isAudioMuted ? 'تفعيل الصوت' : 'كتم الصوت' }}
        </UButton>

        <!-- زر الفيديو -->
        <UButton 
          :color="isVideoOff ? 'red' : 'blue'"
          :variant="isVideoOff ? 'solid' : 'outline'"
          @click="toggleVideo"
          :disabled="!isConnected"
          size="xl"
          class="px-6 py-3"
        >
          <template #leading>
            <UIcon :name="isVideoOff ? 'i-heroicons-video-camera-slash' : 'i-heroicons-video-camera'" class="w-6 h-6" />
          </template>
          {{ isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا' }}
        </UButton>

        <!-- زر إنهاء المكالمة -->
        <UButton 
          color="red"
          @click="disconnect"
          :disabled="!isConnected"
          size="xl"
          class="px-6 py-3"
        >
          <template #leading>
            <UIcon name="i-heroicons-phone-x-mark" class="w-6 h-6" />
          </template>
          إنهاء المكالمة
        </UButton>
      </div>
    </UCard>

    <!-- معلومات الاتصال -->
    <UCard class="bg-gray-50">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
        <div class="text-center p-3 bg-white rounded-lg">
          <div class="text-green-600 font-semibold mb-1">
            <UIcon name="i-heroicons-check-circle" class="w-5 h-5 inline mr-1" />
            حالة الاتصال
          </div>
          <div>{{ isConnected ? '✅ متصل' : '❌ غير متصل' }}</div>
        </div>
        
        <div class="text-center p-3 bg-white rounded-lg">
          <div class="text-blue-600 font-semibold mb-1">
            <UIcon name="i-heroicons-microphone" class="w-5 h-5 inline mr-1" />
            الصوت
          </div>
          <div>{{ isAudioMuted ? '🔇 مكتوم' : '🔊 شغال' }}</div>
        </div>
        
        <div class="text-center p-3 bg-white rounded-lg">
          <div class="text-purple-600 font-semibold mb-1">
            <UIcon name="i-heroicons-video-camera" class="w-5 h-5 inline mr-1" />
            الكاميرا
          </div>
          <div>{{ isVideoOff ? '📵 مطفأة' : '🎥 شغالة' }}</div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useLiveKit } from '~/composables/useLiveKit';

const props = defineProps<{
  token: string;
  wsUrl: string;
  userName: string;
  roomId: string;
  title: string;
}>();

const emit = defineEmits(['disconnected']);

const {
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
  disconnect: disconnectLiveKit
} = useLiveKit();

const localVideoRef = ref<HTMLVideoElement>();
const remoteVideoRef = ref<HTMLVideoElement>();
const remoteParticipantName = ref<string>('');
const localVideoStream = ref<MediaStream | null>(null);
const remoteVideoStream = ref<MediaStream | null>(null);

// الاتصال بالغرفة عند التحميل
onMounted(async () => {
  console.log('📞 بدء عملية الاتصال...');
  
  try {
    const result = await connectToRoom(props.token, props.wsUrl, props.userName);
    if (result.success) {
      setupMediaTracks();
    }
  } catch (error) {
    console.error('❌ فشل الاتصال:', error);
    emit('disconnected');
  }
});

// إعداد تتبع الوسائط
const setupMediaTracks = () => {
  // تحديث فيديو المحلي
  watch(localVideoTrack, (track) => {
    if (track && localVideoRef.value) {
      localVideoStream.value = new MediaStream([track.mediaStreamTrack]);
      localVideoRef.value.srcObject = localVideoStream.value;
    } else {
      localVideoStream.value = null;
      if (localVideoRef.value) {
        localVideoRef.value.srcObject = null;
      }
    }
  }, { immediate: true });

  // تحديث فيديو الشخص الآخر
  watch(remoteVideoTrack, (track) => {
    if (track && remoteVideoRef.value) {
      remoteVideoStream.value = new MediaStream([track.mediaStreamTrack]);
      remoteVideoRef.value.srcObject = remoteVideoStream.value;
    } else {
      remoteVideoStream.value = null;
      if (remoteVideoRef.value) {
        remoteVideoRef.value.srcObject = null;
      }
    }
  }, { immediate: true });

  // تحديث اسم المشارك الآخر
  watch(remoteParticipant, (participant) => {
    if (participant) {
      remoteParticipantName.value = participant.name || participant.identity;
    } else {
      remoteParticipantName.value = '';
    }
  }, { immediate: true });
};

const disconnect = () => {
  disconnectLiveKit();
  emit('disconnected');
};

onUnmounted(() => {
  disconnect();
});
</script>

<style scoped>
.video-call-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 20px;
}

.video-wrapper {
  aspect-ratio: 16/9;
  min-height: 300px;
  max-height: 500px;
}

video {
  background-color: #000;
  transform: scaleX(-1); /* لقلب الصورة كمرآة */
}

/* لعرض فيديو الشخص الآخر بشكل طبيعي */
.video-area:first-child video {
  transform: scaleX(1);
}
</style>