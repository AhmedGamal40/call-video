<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
    <UContainer class="py-6 md:py-8">
      
      <!-- شريط التنقل العلوي -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UIcon name="i-heroicons-video-camera" class="text-blue-600" />
            غرفة العميل
          </h1>
          <p class="text-gray-600 mt-1">اتصل بوكيل الدعم عبر مكالمة فيديو مباشرة</p>
        </div>
        
        <div class="flex gap-2">
          <UButton 
            color="gray" 
            variant="ghost" 
            icon="i-heroicons-arrow-left"
            @click="goBack"
            size="sm"
          >
            العودة
          </UButton>
          
          <UButton 
            color="blue" 
            variant="soft"
            icon="i-heroicons-question-mark-circle"
            @click="showHelp = true"
            size="sm"
          >
            مساعدة
          </UButton>
        </div>
      </div>

      <!-- حالة التطبيق الرئيسية -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- العمود الأيسر: معلومات المستخدم -->
        <div class="lg:col-span-1 space-y-6">
          <!-- بطاقة معلومات المستخدم -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">👤 معلوماتك</h3>
            </template>
            
            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">اسمك</label>
                <UInput 
                  v-model="userName" 
                  placeholder="أدخل اسمك"
                  icon="i-heroicons-user"
                  size="lg"
                  :disabled="isConnected"
                />
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-700 mb-1">رقم الغرفة</label>
                <div class="flex gap-2">
                  <UInput 
                    v-model="roomId" 
                    placeholder="سيتم إنشاؤه تلقائياً"
                    icon="i-heroicons-key"
                    size="lg"
                    readonly
                    class="flex-1"
                  />
                  <UButton 
                    color="gray" 
                    variant="outline"
                    @click="generateNewRoomId"
                    :disabled="isConnected"
                    icon="i-heroicons-arrow-path"
                  />
                </div>
              </div>
              
              <div v-if="roomId" class="bg-blue-50 p-3 rounded-lg">
                <p class="text-sm text-blue-800 mb-2">
                  <UIcon name="i-heroicons-information-circle" class="w-4 h-4 inline mr-1" />
                  شارك هذا الرمز مع الوكيل:
                </p>
                <div class="flex items-center justify-between bg-white p-2 rounded border">
                  <code class="text-lg font-bold text-blue-600">{{ roomId }}</code>
                  <UButton 
                    color="blue" 
                    size="xs"
                    @click="copyRoomId"
                    icon="i-heroicons-clipboard-document"
                  >
                    نسخ
                  </UButton>
                </div>
              </div>
            </div>
          </UCard>

          <!-- بطاقة إعدادات الجهاز -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">⚙️ إعدادات الجهاز</h3>
            </template>
            
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">الكاميرا</p>
                  <p class="text-sm text-gray-600">تأكد من صلاحيتها</p>
                </div>
                <UButton 
                  color="gray" 
                  variant="outline"
                  size="sm"
                  @click="testCamera"
                  icon="i-heroicons-video-camera"
                >
                  اختبار
                </UButton>
              </div>
              
              <div class="flex items-center justify-between">
                <div>
                  <p class="font-medium">الميكروفون</p>
                  <p class="text-sm text-gray-600">تأكد من عمله</p>
                </div>
                <UButton 
                  color="gray" 
                  variant="outline"
                  size="sm"
                  @click="testMicrophone"
                  icon="i-heroicons-microphone"
                >
                  اختبار
                </UButton>
              </div>
            </div>
          </UCard>

          <!-- بطاقة التعليمات السريعة -->
          <UCard class="bg-gradient-to-r from-green-50 to-emerald-50">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">🚀 كيف تبدأ؟</h3>
            </template>
            
            <ul class="space-y-3">
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span>أدخل اسمك وانقر على "بدء المكالمة"</span>
              </li>
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span>انسخ رمز الغرفة وأرسله للوكيل</span>
              </li>
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                <span>انتظر حتى ينضم الوكيل للغرفة</span>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- العمود الأيمن: منطقة المكالمة -->
        <div class="lg:col-span-2">
          <!-- حالة قبل الاتصال -->
          <div v-if="!isConnected" class="space-y-6">
            <!-- بطاقة بدء المكالمة -->
            <UCard class="text-center">
              <template #header>
                <div class="flex justify-center mb-4">
                  <div class="p-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full">
                    <UIcon name="i-heroicons-video-camera" class="w-16 h-16 text-white" />
                  </div>
                </div>
                <h2 class="text-2xl font-bold text-gray-900">ابدأ مكالمة فيديو</h2>
                <p class="text-gray-600 mt-2">اتصل بوكيل الدعم للمساعدة الفورية</p>
              </template>

              <div class="max-w-md mx-auto space-y-4">
                <UButton 
                  block 
                  size="xl" 
                  color="blue"
                  :loading="loading"
                  :disabled="!userName"
                  @click="startCall"
                  class="h-14 text-lg"
                >
                  <template #leading>
                    <UIcon name="i-heroicons-play" class="w-6 h-6" />
                  </template>
                  بدء المكالمة
                </UButton>
                
                <p v-if="!userName" class="text-red-500 text-sm">
                  ⚠️ يرجى إدخال اسمك أولاً
                </p>
              </div>
            </UCard>

            <!-- حالة الانتظار -->
            <div v-if="waitingForAgent" class="animate-pulse">
              <UCard>
                <div class="text-center py-8">
                  <div class="relative inline-block mb-6">
                    <div class="w-24 h-24 bg-gradient-to-r from-blue-200 to-cyan-200 rounded-full flex items-center justify-center">
                      <UIcon name="i-heroicons-clock" class="w-12 h-12 text-blue-600" />
                    </div>
                    <span class="absolute -top-1 -right-1 flex h-6 w-6">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-6 w-6 bg-blue-500"></span>
                    </span>
                  </div>
                  
                  <h3 class="text-xl font-semibold text-gray-800 mb-3">
                    🔄 في انتظار الوكيل...
                  </h3>
                  <p class="text-gray-600 mb-6 max-w-md mx-auto">
                    نبحث عن وكيل دعم متاح للاتصال بك. قد تستغرق العملية بضع لحظات.
                  </p>
                  
                  <div class="inline-flex items-center gap-3 bg-blue-100 px-5 py-3 rounded-full mb-6">
                    <span class="relative flex h-3 w-3">
                      <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span class="relative inline-flex rounded-full h-3 w-3 bg-blue-600"></span>
                    </span>
                    <span class="text-blue-700 font-medium">جارٍ البحث عن وكيل متاح</span>
                  </div>
                  
                  <!-- مؤشر التقدم -->
                  <div class="max-w-md mx-auto">
                    <UProgress 
                      :value="progressValue" 
                      size="md" 
                      color="blue"
                      class="mb-4"
                    />
                    <p class="text-sm text-gray-500">
                      الوقت المتوقع: <span class="font-semibold">{{ estimatedTime }}</span>
                    </p>
                  </div>
                </div>
              </UCard>
            </div>
          </div>

          <!-- حالة أثناء المكالمة -->
          <div v-else>
            <VideoCall 
              :token="token"
              :ws-url="wsUrl"
              :user-name="userName"
              :room-id="roomId"
              title="مكالمة دعم العميل"
              @disconnected="handleCallEnded"
            />
            
            <!-- إحصائيات المكالمة -->
            <UCard class="mt-6">
              <template #header>
                <h3 class="text-lg font-semibold text-gray-900">📊 إحصائيات المكالمة</h3>
              </template>
              
              <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold text-blue-600">{{ callDuration }}</p>
                  <p class="text-sm text-gray-600">مدة المكالمة</p>
                </div>
                
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold text-green-600">
                    {{ connectionQuality }}
                  </p>
                  <p class="text-sm text-gray-600">جودة الاتصال</p>
                </div>
                
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold text-purple-600">
                    {{ participantsCount }}
                  </p>
                  <p class="text-sm text-gray-600">عدد المشاركين</p>
                </div>
                
                <div class="text-center p-3 bg-gray-50 rounded-lg">
                  <p class="text-2xl font-bold text-orange-600">
                    {{ isAudioMuted ? 'مكتوم' : 'نشط' }}
                  </p>
                  <p class="text-sm text-gray-600">حالة الصوت</p>
                </div>
              </div>
            </UCard>
          </div>
        </div>
      </div>

      <!-- نافذة المساعدة -->
      <UModal v-model="showHelp">
        <UCard>
          <template #header>
            <h3 class="text-lg font-semibold">❓ تعليمات الاستخدام</h3>
          </template>
          
          <div class="space-y-4">
            <div>
              <h4 class="font-semibold text-blue-600 mb-2">📱 متطلبات النظام</h4>
              <ul class="space-y-1 text-sm text-gray-600">
                <li>• متصفح حديث (Chrome, Firefox, Edge, Safari)</li>
                <li>• كاميرا ويب وميكروفون</li>
                <li>• اتصال إنترنت مستقر (سرعة 1 ميجابت/ثانية على الأقل)</li>
              </ul>
            </div>
            
            <div>
              <h4 class="font-semibold text-green-600 mb-2">🔄 خطوات بدء المكالمة</h4>
              <ol class="space-y-2 text-sm text-gray-600">
                <li class="flex items-start">
                  <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">1</span>
                  <span>أدخل اسمك في الحقل المخصص</span>
                </li>
                <li class="flex items-start">
                  <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">2</span>
                  <span>انقر على زر "بدء المكالمة"</span>
                </li>
                <li class="flex items-start">
                  <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">3</span>
                  <span>انسخ رمز الغرفة وأرسله للوكيل</span>
                </li>
                <li class="flex items-start">
                  <span class="bg-blue-100 text-blue-800 rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold mr-2">4</span>
                  <span>انتظر اتصال الوكيل</span>
                </li>
              </ol>
            </div>
            
            <div>
              <h4 class="font-semibold text-red-600 mb-2">⚠️ استكشاف الأخطاء</h4>
              <ul class="space-y-1 text-sm text-gray-600">
                <li>• إذا لم تظهر الكاميرا: تحقق من إذن المتصفح</li>
                <li>• إذا لم يسمعك الوكيل: اختبر الميكروفون أولاً</li>
                <li>• إذا انقطع الاتصال: أعد الاتصال بنفس رمز الغرفة</li>
              </ul>
            </div>
          </div>
          
          <template #footer>
            <div class="flex justify-end">
              <UButton color="blue" @click="showHelp = false">
                فهمت
              </UButton>
            </div>
          </template>
        </UCard>
      </UModal>

      <!-- رسائل التنبيه -->
      <UNotifications />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useToast } from '#imports';

definePageMeta({
  middleware: 'auth'
});

const toast = useToast();
const router = useRouter();

// البيانات الأساسية
const userName = ref<string>('');
const roomId = ref<string>('');
const token = ref<string>('');
const wsUrl = ref<string>('');
const loading = ref<boolean>(false);
const showHelp = ref<boolean>(false);
const waitingForAgent = ref<boolean>(false);
const progressValue = ref<number>(0);
const estimatedTime = ref<string>('1-2 دقيقة');

// بيانات المكالمة
const isConnected = ref<boolean>(false);
const isAudioMuted = ref<boolean>(false);
const callStartTime = ref<Date | null>(null);
const callTimer = ref<NodeJS.Timeout | null>(null);

// توليد معرف غرفة عشوائي
const generateRoomId = () => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `room_${timestamp}_${random}`.toUpperCase();
};

// إنشاء معرف غرفة جديد
const generateNewRoomId = () => {
  roomId.value = generateRoomId();
  toast.add({
    title: 'تم إنشاء رمز جديد',
    description: 'يمكنك مشاركته مع الوكيل',
    color: 'green',
    timeout: 3000
  });
};

// نسخ رمز الغرفة
const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomId.value);
    toast.add({
      title: '✅ تم النسخ',
      description: 'رمز الغرفة جاهز للمشاركة',
      color: 'green',
      timeout: 2000
    });
  } catch (err) {
    toast.add({
      title: '❌ خطأ',
      description: 'تعذر نسخ الرمز',
      color: 'red'
    });
  }
};

// اختبار الكاميرا
const testCamera = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    // إظهار معاينة سريعة
    const video = document.createElement('video');
    video.srcObject = stream;
    video.play();
    
    toast.add({
      title: '✅ الكاميرا تعمل',
      description: 'تم الكشف عن الكاميرا بنجاح',
      color: 'green',
      timeout: 3000
    });
    
    // إيقاف التدفق بعد 3 ثواني
    setTimeout(() => {
      stream.getTracks().forEach(track => track.stop());
    }, 3000);
  } catch (error) {
    toast.add({
      title: '❌ مشكلة في الكاميرا',
      description: 'تأكد من إذن الوصول للكاميرا',
      color: 'red'
    });
  }
};

// اختبار الميكروفون
const testMicrophone = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
    toast.add({
      title: '✅ الميكروفون يعمل',
      description: 'تم الكشف عن الميكروفون بنجاح',
      color: 'green',
      timeout: 3000
    });
    
    stream.getTracks().forEach(track => track.stop());
  } catch (error) {
    toast.add({
      title: '❌ مشكلة في الميكروفون',
      description: 'تأكد من إذن الوصول للميكروفون',
      color: 'red'
    });
  }
};

// بدء المكالمة
const startCall = async () => {
  if (!userName.value.trim()) {
    toast.add({
      title: '❌ اسم مطلوب',
      description: 'الرجاء إدخال اسمك أولاً',
      color: 'red'
    });
    return;
  }

  loading.value = true;
  waitingForAgent.value = true;

  // حفظ البيانات في localStorage
  localStorage.setItem('userName', userName.value);
  if (!roomId.value) {
    roomId.value = generateRoomId();
  }
  localStorage.setItem('roomId', roomId.value);
  localStorage.setItem('userRole', 'customer');

  // محاكاة تقدم البحث عن وكيل
  const progressInterval = setInterval(() => {
    if (progressValue.value < 90) {
      progressValue.value += 10;
    }
  }, 2000);

  try {
    // الحصول على توكن الاتصال
    const response = await $fetch('/api/token', {
      method: 'POST',
      body: {
        roomName: roomId.value,
        userName: userName.value,
        role: 'customer'
      }
    });

    token.value = response.token;
    wsUrl.value = response.wsUrl;
    
    // إخفاء شاشة الانتظار بعد 5 ثواني (محاكاة)
    setTimeout(() => {
      clearInterval(progressInterval);
      progressValue.value = 100;
      waitingForAgent.value = false;
      isConnected.value = true;
      callStartTime.value = new Date();
      startCallTimer();
      
      toast.add({
        title: '🎉 تم الاتصال',
        description: 'أنت الآن في غرفة الانتظار',
        color: 'green',
        timeout: 4000
      });
    }, 5000);

  } catch (error: any) {
    clearInterval(progressInterval);
    loading.value = false;
    waitingForAgent.value = false;
    
    toast.add({
      title: '❌ فشل الاتصال',
      description: error.message || 'حدث خطأ أثناء الاتصال',
      color: 'red'
    });
  }
};

// بدء مؤقت المكالمة
const startCallTimer = () => {
  if (callTimer.value) clearInterval(callTimer.value);
  
  callTimer.value = setInterval(() => {
    // يمكنك تحديث أي بيانات تعتمد على الوقت هنا
  }, 1000);
};

// معالجة انتهاء المكالمة
const handleCallEnded = () => {
  isConnected.value = false;
  token.value = '';
  wsUrl.value = '';
  
  if (callTimer.value) {
    clearInterval(callTimer.value);
    callTimer.value = null;
  }
  
  toast.add({
    title: '📞 تم إنهاء المكالمة',
    description: 'يمكنك بدء مكالمة جديدة إذا كنت بحاجة',
    color: 'blue',
    timeout: 4000
  });
};

// العودة للصفحة الرئيسية
const goBack = () => {
  router.push('/');
};

// الحسابات المحسوبة
const callDuration = computed(() => {
  if (!callStartTime.value) return '00:00';
  
  const now = new Date();
  const diff = Math.floor((now.getTime() - callStartTime.value.getTime()) / 1000);
  
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
});

const participantsCount = computed(() => {
  return isConnected.value ? '2/2' : '1/2';
});

const connectionQuality = computed(() => {
  return isConnected.value ? 'ممتازة' : '--';
});

// التهيئة عند تحميل الصفحة
onMounted(() => {
  // استعادة البيانات المحفوظة
  const savedName = localStorage.getItem('userName');
  const savedRoom = localStorage.getItem('roomId');
  
  if (savedName) userName.value = savedName;
  if (savedRoom) roomId.value = savedRoom;
  else roomId.value = generateRoomId();
});

// التنظيف عند تدمير المكون
onUnmounted(() => {
  if (callTimer.value) {
    clearInterval(callTimer.value);
  }
});
</script>

<style scoped>
/* تخصيصات إضافية */
:deep(.video-wrapper) {
  border-radius: 16px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
}

:deep(.video-area) {
  transition: all 0.3s ease;
}

:deep(.video-area:hover) {
  transform: translateY(-5px);
}

/* تصميم متجاوب */
@media (max-width: 768px) {
  .video-call-container {
    padding: 10px;
  }
  
  :deep(.video-wrapper) {
    max-height: 300px;
  }
}

/* تأثيرات للرسائل */
.toast-enter-active {
  animation: slideIn 0.3s ease;
}

.toast-leave-active {
  animation: slideOut 0.3s ease;
}

@keyframes slideIn {
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}

@keyframes slideOut {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
}
</style>