<template>
  <div class="video-call-container">
    <!-- رأس المكالمة مع معلومات المشاركين -->
    <UCard class="mb-4">
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div class="flex-1">
          <h2 class="text-xl font-bold text-gray-900">{{ title }}</h2>
          <div class="flex flex-wrap items-center gap-3 mt-2">
            <!-- حالة الاتصال -->
            <UBadge :color="connectionColor" class="flex items-center gap-1">
              <span class="w-2 h-2 rounded-full animate-pulse" :class="connectionDotClass"></span>
              {{ connectionText }}
            </UBadge>
            
            <!-- رمز الغرفة -->
            <div class="flex items-center gap-1 text-sm text-gray-600">
              <UIcon name="i-heroicons-key" class="w-4 h-4" />
              <span class="font-mono">{{ roomId }}</span>
            </div>
            
            <!-- مدة المكالمة -->
            <div v-if="isConnected" class="flex items-center gap-1 text-sm text-gray-600">
              <UIcon name="i-heroicons-clock" class="w-4 h-4" />
              <span>{{ formattedDuration }}</span>
            </div>
          </div>
        </div>
        
        <!-- قائمة المشاركين -->
        <div v-if="participants.length > 0" class="text-right">
          <div class="flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="w-5 h-5 text-green-600" />
            <div>
              <p class="text-sm font-medium text-green-600">
                {{ participants.length + 1 }} مشارك في المكالمة
              </p>
              <p class="text-xs text-gray-500">
                <!-- عرض أسماء المشاركين -->
                <span v-for="(participant, index) in participants" :key="participant.identity">
                  {{ getParticipantName(participant.identity) }}
                  <span v-if="index < participants.length - 1">، </span>
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </UCard>

    <!-- منطقة الفيديو الرئيسية -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      <!-- فيديو الطرف الآخر -->
      <div class="video-area">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-lg font-semibold">
              <!-- اسم الطرف الآخر -->
              {{ remoteParticipantName || 'في انتظار اتصال...' }}
            </h3>
            <p class="text-xs text-gray-500">
              {{ remoteParticipant?.identity || 'لم ينضم بعد' }}
            </p>
          </div>
          <div class="flex items-center gap-2">
            <span v-if="remoteVideoTrack" class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              فيديو: {{ checkVideoStatus() }}
            </span>
            <span v-if="remoteAudioTrack" class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              صوت: {{ checkAudioStatus() }}
            </span>
          </div>
        </div>
        
        <div class="video-wrapper bg-gradient-to-br from-gray-900 to-black rounded-xl overflow-hidden border-2 border-blue-500 relative min-h-[400px]">
          <!-- فيديو الطرف الآخر -->
          <video 
            v-if="remoteVideoStream"
            ref="remoteVideoRef"
            autoplay
            playsinline
            class="w-full h-full object-cover"
          />
          
          <!-- حالة الانتظار -->
          <div v-else class="flex flex-col items-center justify-center h-full text-white p-6">
            <div class="text-center">
              <!-- عرض صورة واسم الطرف الآخر حتى بدون فيديو -->
              <div v-if="remoteParticipant" class="mb-4">
                <div class="w-24 h-24 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center mx-auto">
                  <span class="text-3xl font-bold text-white">
                    {{ remoteParticipantName?.charAt(0) || '?' }}
                  </span>
                </div>
                <p class="text-xl font-bold mt-3">{{ remoteParticipantName }}</p>
                <p class="text-gray-400 text-sm mt-1">متصل بدون فيديو</p>
              </div>
              
              <div v-else>
                <UIcon name="i-heroicons-user" class="w-24 h-24 text-gray-600 mx-auto mb-4" />
                <p class="text-xl font-semibold mb-2">في انتظار الطرف الآخر</p>
                <p class="text-gray-400">سيظهر الفيديو هنا عند الاتصال</p>
              </div>
            </div>
          </div>
          
          <!-- معلومات الفيديو -->
          <div v-if="remoteVideoTrack" class="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded">
            📹 مباشر
          </div>
          
          <!-- بطاقة اسم المشارك -->
          <div v-if="remoteParticipantName" class="absolute top-3 left-3 bg-black/70 text-white px-3 py-2 rounded-lg shadow-lg">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-bold">{{ remoteParticipantName.charAt(0) }}</span>
              </div>
              <div>
                <p class="font-semibold">{{ remoteParticipantName }}</p>
                <p class="text-xs text-gray-300">
                  {{ remoteParticipant?.metadata ? 'مع بيانات إضافية' : 'متصل مباشرة' }}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        <!-- حالة الطرف الآخر -->
        <div v-if="remoteParticipant" class="mt-3 grid grid-cols-2 gap-3">
          <div class="bg-blue-50 p-2 rounded text-center">
            <p class="text-xs text-blue-700">حالة الصوت</p>
            <p class="text-sm font-semibold text-blue-900">
              {{ checkAudioStatus() }}
            </p>
          </div>
          <div class="bg-green-50 p-2 rounded text-center">
            <p class="text-xs text-green-700">حالة الفيديو</p>
            <p class="text-sm font-semibold text-green-900">
              {{ checkVideoStatus() }}
            </p>
          </div>
        </div>
      </div>

      <!-- فيديو الخاص بك -->
      <div class="video-area">
        <div class="flex items-center justify-between mb-2">
          <div>
            <h3 class="text-lg font-semibold">
              أنت 
              <span class="text-blue-600">{{ userName }}</span>
            </h3>
            <p class="text-xs text-gray-500">أنت في هذه المكالمة</p>
          </div>
          <div class="flex items-center gap-2">
            <span class="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
              فيديو: {{ isVideoOff ? 'معطل' : 'نشط' }}
            </span>
            <span class="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
              صوت: {{ isAudioMuted ? 'مكتوم' : 'نشط' }}
            </span>
          </div>
        </div>
        
        <div class="video-wrapper bg-gradient-to-br from-gray-800 to-gray-900 rounded-xl overflow-hidden border-2 border-green-500 relative min-h-[400px]">
          <!-- فيديو الخاص بك -->
          <video 
            v-if="localVideoStream && !isVideoOff"
            ref="localVideoRef"
            autoplay
            playsinline
            muted
            class="w-full h-full object-cover"
          />
          
          <!-- حالة عدم وجود فيديو -->
          <div v-else class="flex flex-col items-center justify-center h-full text-white p-6">
            <div class="text-center">
              <!-- عرض صورتك حتى بدون كاميرا -->
              <div class="w-24 h-24 bg-gradient-to-br from-green-600 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span class="text-3xl font-bold text-white">
                  {{ userName?.charAt(0) || 'أ' }}
                </span>
              </div>
              <p class="text-xl font-semibold mb-2">
                {{ isVideoOff ? 'الكاميرا معطلة' : 'أنت في المكالمة' }}
              </p>
              <p class="text-gray-400">{{ userName }}</p>
            </div>
          </div>
          
          <!-- مؤشرات الحالة -->
          <div class="absolute top-3 left-3 flex gap-2">
            <UBadge v-if="isAudioMuted" color="red" size="sm" class="bg-red-600/80 backdrop-blur-sm">
              <UIcon name="i-heroicons-microphone-slash" class="w-3 h-3" />
              مكتوم
            </UBadge>
            <UBadge v-if="isVideoOff" color="red" size="sm" class="bg-red-600/80 backdrop-blur-sm">
              <UIcon name="i-heroicons-video-camera-slash" class="w-3 h-3" />
              معطل
            </UBadge>
          </div>
          
          <!-- بطاقة اسمك -->
          <div class="absolute top-3 right-3 bg-black/70 text-white px-3 py-2 rounded-lg shadow-lg">
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <span class="text-sm font-bold">{{ userName?.charAt(0) || 'أ' }}</span>
              </div>
              <div>
                <p class="font-semibold">{{ userName }}</p>
                <p class="text-xs text-gray-300">أنت</p>
              </div>
            </div>
          </div>
          
          <!-- مؤشر البث -->
          <div v-if="localVideoTrack && !isVideoOff" 
               class="absolute bottom-3 left-3 bg-black/70 text-white text-xs px-2 py-1 rounded flex items-center gap-1">
            <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            تبث مباشرة
          </div>
        </div>
        
        <!-- حالتك -->
        <div class="mt-3 grid grid-cols-2 gap-3">
          <div class="bg-gray-50 p-2 rounded text-center">
            <p class="text-xs text-gray-700">حالة الصوت</p>
            <p class="text-sm font-semibold text-gray-900">
              {{ isAudioMuted ? '🔇 مكتوم' : '🔊 نشط' }}
            </p>
          </div>
          <div class="bg-gray-50 p-2 rounded text-center">
            <p class="text-xs text-gray-700">حالة الفيديو</p>
            <p class="text-sm font-semibold text-gray-900">
              {{ isVideoOff ? '📵 معطل' : '🎥 نشط' }}
            </p>
          </div>
        </div>
      </div>
    </div>

    <!-- أدوات التحكم -->
    <UCard>
      <div class="flex flex-col md:flex-row justify-between items-center gap-6">
        <!-- أدوات الوسائط -->
        <div class="flex gap-4">
          <!-- زر الصوت -->
          <UButton 
            :color="isAudioMuted ? 'red' : 'green'"
            :variant="isAudioMuted ? 'solid' : 'outline'"
            @click="toggleAudio"
            :disabled="!isConnected || isConnecting"
            size="xl"
            class="px-6"
          >
            <template #leading>
              <UIcon :name="isAudioMuted ? 'i-heroicons-microphone-slash' : 'i-heroicons-microphone'" class="w-5 h-5" />
            </template>
            {{ isAudioMuted ? 'تشغيل الصوت' : 'كتم الصوت' }}
          </UButton>

          <!-- زر الفيديو -->
          <UButton 
            :color="isVideoOff ? 'red' : 'blue'"
            :variant="isVideoOff ? 'solid' : 'outline'"
            @click="toggleVideo"
            :disabled="!isConnected || isConnecting"
            size="xl"
            class="px-6"
          >
            <template #leading>
              <UIcon :name="isVideoOff ? 'i-heroicons-video-camera-slash' : 'i-heroicons-video-camera'" class="w-5 h-5" />
            </template>
            {{ isVideoOff ? 'تشغيل الكاميرا' : 'إيقاف الكاميرا' }}
          </UButton>
        </div>

        <!-- زر إنهاء المكالمة -->
        <UButton 
          color="red"
          @click="disconnect"
          :disabled="isConnecting"
          size="xl"
          class="px-8"
        >
          <template #leading>
            <UIcon name="i-heroicons-phone-x-mark" class="w-5 h-5" />
          </template>
          إنهاء المكالمة
        </UButton>
      </div>
    </UCard>

    <!-- معلومات الاتصال -->
    <UCard class="mt-6">
      <template #header>
        <h3 class="text-lg font-semibold">📡 معلومات المكالمة</h3>
      </template>
      
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- حالة الاتصال -->
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <UIcon name="i-heroicons-wifi" class="w-8 h-8 text-blue-600 mx-auto mb-2" />
          <p class="text-2xl font-bold" :class="connectionColor">
            {{ connectionText }}
          </p>
          <p class="text-sm text-gray-600">حالة الاتصال</p>
        </div>
        
        <!-- المشاركون -->
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <UIcon name="i-heroicons-user-group" class="w-8 h-8 text-purple-600 mx-auto mb-2" />
          <p class="text-2xl font-bold text-purple-600">
            {{ participantsCount }}
          </p>
          <p class="text-sm text-gray-600">المشاركون</p>
        </div>
        
        <!-- مدة المكالمة -->
        <div class="text-center p-4 bg-gray-50 rounded-lg">
          <UIcon name="i-heroicons-clock" class="w-8 h-8 text-green-600 mx-auto mb-2" />
          <p class="text-2xl font-bold text-green-600">{{ formattedDuration }}</p>
          <p class="text-sm text-gray-600">مدة المكالمة</p>
        </div>
      </div>
      
      <!-- قائمة المشاركين التفصيلية -->
      <div v-if="participants.length > 0" class="mt-6">
        <h4 class="font-medium text-gray-700 mb-3">المشاركون في المكالمة:</h4>
        <div class="space-y-2">
          <!-- أنت -->
          <div class="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">{{ userName?.charAt(0) || 'أ' }}</span>
              </div>
              <div>
                <p class="font-semibold">{{ userName }}</p>
                <p class="text-xs text-gray-500">أنت</p>
              </div>
            </div>
            <UBadge color="blue">أنت</UBadge>
          </div>
          
          <!-- المشاركون الآخرون -->
          <div v-for="participant in participants" :key="participant.identity" 
               class="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center">
                <span class="text-white font-bold">
                  {{ getParticipantName(participant.identity)?.charAt(0) || '?' }}
                </span>
              </div>
              <div>
                <p class="font-semibold">{{ getParticipantName(participant.identity) }}</p>
                <p class="text-xs text-gray-500">{{ participant.identity }}</p>
              </div>
            </div>
            <div class="flex gap-2">
              <UBadge v-if="participant.tracks.size > 0" color="green" size="sm">
                {{ participant.tracks.size }} جهاز
              </UBadge>
              <UBadge color="gray" size="sm">متصل</UBadge>
            </div>
          </div>
        </div>
      </div>
    </UCard>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useLiveKit } from '~/composables/useLiveKit'

interface Props {
  token: string
  wsUrl: string
  userName: string
  roomId: string
  title: string
}

const props = defineProps<Props>()
const emit = defineEmits(['disconnected'])

// استخدام LiveKit composable
const {
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
  connectToRoom,
  toggleAudio,
  toggleVideo,
  disconnect: disconnectLiveKit,
  callDuration,
  getParticipantName,
  getRemoteParticipantName,
  checkAudioStatus,
  checkVideoStatus
} = useLiveKit()

// المراجع
const localVideoRef = ref<HTMLVideoElement>()
const remoteVideoRef = ref<HTMLVideoElement>()
const remoteParticipantName = ref<string>('')
const localVideoStream = ref<MediaStream | null>(null)
const remoteVideoStream = ref<MediaStream | null>(null)

// الاتصال عند التحميل
onMounted(async () => {
  console.log('🚀 بدء اتصال المكالمة...', props.userName)
  
  try {
    const result = await connectToRoom(
      props.token,
      props.wsUrl,
      props.userName,
      props.userName // displayName
    )
    
    if (result.success) {
      console.log('✅ اتصال المكالمة ناجح')
    }
  } catch (error) {
    console.error('❌ فشل اتصال المكالمة:', error)
    emit('disconnected')
  }
})

// إعداد تتبع الوسائط
watch(localVideoTrack, (track) => {
  if (track && localVideoRef.value) {
    const stream = new MediaStream([track.mediaStreamTrack])
    localVideoStream.value = stream
    localVideoRef.value.srcObject = stream
  } else {
    localVideoStream.value = null
    if (localVideoRef.value) localVideoRef.value.srcObject = null
  }
}, { immediate: true })

watch(remoteVideoTrack, (track) => {
  if (track && remoteVideoRef.value) {
    const stream = new MediaStream([track.mediaStreamTrack])
    remoteVideoStream.value = stream
    remoteVideoRef.value.srcObject = stream
  } else {
    remoteVideoStream.value = null
    if (remoteVideoRef.value) remoteVideoRef.value.srcObject = null
  }
}, { immediate: true })

// مراقبة المشاركين وأسمائهم
watch(remoteParticipant, (participant) => {
  if (participant) {
    remoteParticipantName.value = getRemoteParticipantName()
    console.log('👤 تم تحديث اسم المشارك البعيد:', remoteParticipantName.value)
  } else {
    remoteParticipantName.value = ''
  }
}, { immediate: true })

watch(participantNames, (names) => {
  console.log('📝 تحديث أسماء المشاركين:', names)
  if (remoteParticipant.value) {
    remoteParticipantName.value = getRemoteParticipantName()
  }
}, { deep: true })

// الحسابات المحسوبة
const participantsCount = computed(() => {
  return participants.length + 1 // +1 لنفسك
})

const formattedDuration = computed(() => {
  return callDuration()
})

const connectionText = computed(() => {
  if (isConnecting) return 'جاري الاتصال...'
  if (isConnected) return 'متصل'
  return 'غير متصل'
})

const connectionColor = computed(() => {
  if (isConnecting) return 'yellow'
  if (isConnected) return 'green'
  return 'gray'
})

const connectionDotClass = computed(() => {
  if (isConnecting) return 'bg-yellow-500'
  if (isConnected) return 'bg-green-500'
  return 'bg-gray-500'
})

// قطع الاتصال
const disconnect = () => {
  disconnectLiveKit()
  emit('disconnected')
}

// التنظيف
onUnmounted(() => {
  disconnect()
})
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
}

video {
  background-color: #000;
  transform: scaleX(-1); /* مرآة للفيديو المحلي */
}

.video-area:first-child video {
  transform: scaleX(1); /* فيديو الطرف الآخر طبيعي */
}

/* تأثيرات للبطاقات */
.gradient-avatar {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.gradient-avatar-green {
  background: linear-gradient(135deg, #10b981 0%, #059669 100%);
}
</style>