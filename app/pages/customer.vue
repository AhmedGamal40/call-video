<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50">
    <UContainer class="py-6 md:py-8">
      
      <!-- شريط التنقل -->
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
        </div>
      </div>

      <!-- حالة التطبيق -->
      <div class="grid lg:grid-cols-3 gap-6">
        <!-- العمود الأيسر: معلومات المستخدم -->
        <div class="lg:col-span-1 space-y-6">
          <!-- مكون الانضمام -->
          <RoomJoin
            v-model:userName="userName"
            v-model:roomId="roomId"
            title="ابدأ مكالمة جديدة"
            labelName="اسمك"
            placeholderName="أدخل اسمك"
            buttonText="بدء المكالمة"
            buttonColor="blue"
            buttonIcon="i-heroicons-play"
            :showRoomInput="false"
            :showBackButton="false"
            :isConnecting="isLoading"
            :isConnected="isConnected"
            :deviceStatus="deviceStatus"
            :error="joinError"
            @join="startCall"
          />

          <!-- معلومات الاتصال -->
          <UCard v-if="isConnected">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">📞 معلومات المكالمة</h3>
            </template>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">رقم الغرفة:</span>
                <span class="font-mono font-bold text-blue-600">{{ roomId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">حالة الاتصال:</span>
                <span class="font-semibold text-green-600">نشط</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">المشاركون:</span>
                <span class="font-semibold">1/2</span>
              </div>
            </div>
            
            <template #footer>
              <UButton 
                block 
                color="red" 
                @click="handleDisconnect"
                icon="i-heroicons-phone-x-mark"
              >
                إنهاء المكالمة
              </UButton>
            </template>
          </UCard>

          <!-- إرشادات -->
          <UCard class="bg-blue-50">
            <template #header>
              <h3 class="text-lg font-semibold text-blue-900">💡 إرشادات سريعة</h3>
            </template>
            
            <ul class="space-y-2">
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-blue-500 mr-2 mt-0.5" />
                <span class="text-sm">انسخ رمز الغرفة وأرسله للوكيل</span>
              </li>
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-blue-500 mr-2 mt=0.5" />
                <span class="text-sm">انتظر حتى ينضم الوكيل للمكالمة</span>
              </li>
              <li class="flex items-start">
                <UIcon name="i-heroicons-check-circle" class="w-5 h-5 text-blue-500 mr-2 mt=0.5" />
                <span class="text-sm">تأكد من أن الكاميرا والميكروفون يعملان</span>
              </li>
            </ul>
          </UCard>
        </div>

        <!-- العمود الأيمن: منطقة المكالمة -->
        <div class="lg:col-span-2">
          <!-- قبل الاتصال -->
          <div v-if="!isConnected" class="text-center py-12">
            <div class="max-w-md mx-auto">
              <UIcon name="i-heroicons-video-camera" class="w-24 h-24 text-blue-400 mx-auto mb-6" />
              <h2 class="text-2xl font-bold text-gray-800 mb-4">جاهز للاتصال</h2>
              <p class="text-gray-600 mb-8">
                انقر على "بدء المكالمة" لإنشاء غرفة جديدة ومشاركة الرمز مع الوكيل
              </p>
              
              <div v-if="roomId" class="bg-blue-50 p-4 rounded-lg mb-6">
                <p class="text-blue-800 font-medium mb-2">رقم الغرفة الخاص بك:</p>
                <div class="flex items-center justify-center gap-2">
                  <code class="text-2xl font-bold text-blue-600 bg-white px-4 py-2 rounded">{{ roomId }}</code>
                  <UButton 
                    color="blue" 
                    size="sm"
                    @click="copyRoomId"
                    icon="i-heroicons-clipboard-document"
                  />
                </div>
              </div>
            </div>
          </div>

          <!-- أثناء المكالمة -->
          <div v-else-if="token && wsUrl">
            <VideoCall
              :token="token"
              :ws-url="wsUrl"
              :user-name="userName"
              :room-id="roomId"
              title="مكالمة دعم العميل"
              @disconnected="handleCallEnded"
            />
          </div>
        </div>
      </div>

      <!-- رسائل التنبيه -->
      <UNotifications />
    </UContainer>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

definePageMeta({
  middleware: 'auth'
})

const toast = useToast()
const router = useRouter()

// البيانات الأساسية
const userName = ref('')
const roomId = ref('')
const token = ref('')
const wsUrl = ref('')
const isLoading = ref(false)
const isConnected = ref(false)
const joinError = ref('')

// حالة الأجهزة
const deviceStatus = ref({
  hasCamera: false,
  hasMicrophone: false
})

// توليد رمز غرفة عشوائي
const generateRoomId = () => {
  const timestamp = Date.now().toString(36)
  const random = Math.random().toString(36).substring(2, 8)
  return `room_${timestamp}_${random}`.toUpperCase()
}

// نسخ رمز الغرفة
const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(roomId.value)
    toast.add({
      title: '✅ تم النسخ',
      description: 'تم نسخ رمز الغرفة',
      color: 'green',
      timeout: 2000
    })
  } catch (err) {
    toast.add({
      title: '❌ خطأ',
      description: 'تعذر نسخ الرمز',
      color: 'red'
    })
  }
}

// بدء المكالمة
const startCall = async (name: string, room: string) => {
  if (!name.trim()) {
    joinError.value = 'الرجاء إدخال اسمك'
    return
  }

  isLoading.value = true
  joinError.value = ''

  // التحقق من الأجهزة أولاً
  try {
    // طلب إذن للكاميرا والميكروفون
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: true 
    })
    
    // إيقاف الـ stream بعد التأكد
    stream.getTracks().forEach(track => track.stop())
    
    toast.add({
      title: '✅ الأجهزة جاهزة',
      description: 'الكاميرا والميكروفون يعملان',
      color: 'green',
      timeout: 2000
    })
  } catch (error) {
    toast.add({
      title: '⚠️ تحذير',
      description: 'بعض الأجهزة غير متاحة، قد يؤثر على جودة المكالمة',
      color: 'orange',
      timeout: 3000
    })
  }

  // حفظ البيانات
  userName.value = name
  if (!roomId.value) {
    roomId.value = generateRoomId()
  }
  
  localStorage.setItem('userName', userName.value)
  localStorage.setItem('roomId', roomId.value)
  localStorage.setItem('userRole', 'customer')

  try {
    // الحصول على التوكن
    const response = await $fetch('/api/token', {
      method: 'POST',
      body: {
        roomName: roomId.value,
        userName: userName.value,
        role: 'customer'
      }
    })

    token.value = response.token
    wsUrl.value = response.wsUrl
    isConnected.value = true
    
    toast.add({
      title: '🎉 تم إنشاء الغرفة',
      description: `أنت الآن في غرفة ${roomId.value}. شارك الرمز مع الوكيل.`,
      color: 'green',
      timeout: 5000
    })

  } catch (error: any) {
    joinError.value = error.message || 'حدث خطأ أثناء إنشاء الغرفة'
    
    toast.add({
      title: '❌ فشل إنشاء الغرفة',
      description: error.message || 'حدث خطأ أثناء إنشاء الغرفة',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// قطع الاتصال
const handleDisconnect = () => {
  isConnected.value = false
  token.value = ''
  wsUrl.value = ''
  
  toast.add({
    title: '📞 تم إنهاء المكالمة',
    description: 'يمكنك بدء مكالمة جديدة',
    color: 'blue',
    timeout: 4000
  })
}

// معالجة انتهاء المكالمة
const handleCallEnded = () => {
  handleDisconnect()
}

// العودة للصفحة الرئيسية
const goBack = () => {
  router.push('/')
}

// التحقق من الأجهزة عند التحميل
onMounted(async () => {
  // استعادة البيانات
  const savedName = localStorage.getItem('userName')
  const savedRoom = localStorage.getItem('roomId')
  
  if (savedName) userName.value = savedName
  if (savedRoom) roomId.value = savedRoom
  else roomId.value = generateRoomId()
  
  // التحقق من الأجهزة
  try {
    const { checkAllDevices } = await import('~/composables/useDeviceCheck')
    const deviceCheck = checkAllDevices()
    const result = await deviceCheck.checkAllDevices()
    
    deviceStatus.value = {
      hasCamera: result.hasCamera,
      hasMicrophone: result.hasMicrophone
    }
  } catch (error) {
    console.error('❌ خطأ في التحقق من الأجهزة:', error)
  }
})
</script>