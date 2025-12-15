<template>
  <div class="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50">
    <UContainer class="py-6 md:py-8">
      
      <!-- شريط التنقل -->
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <div>
          <h1 class="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2">
            <UIcon name="i-heroicons-user-group" class="text-green-600" />
            غرفة الوكيل
          </h1>
          <p class="text-gray-600 mt-1">انضم إلى غرفة العميل لتقديم الدعم الفوري</p>
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
        <!-- العمود الأيسر: معلومات الوكيل -->
        <div class="lg:col-span-1 space-y-6">
          <!-- مكون الانضمام -->
          <RoomJoin
            v-model:userName="agentName"
            v-model:roomId="roomId"
            title="انضم إلى مكالمة"
            labelName="اسم الوكيل"
            labelRoom="رقم غرفة العميل"
            placeholderName="أدخل اسمك"
            placeholderRoom="أدخل رقم الغرفة"
            buttonText="انضم إلى المكالمة"
            buttonColor="green"
            buttonIcon="i-heroicons-play"
            :showRoomInput="true"
            :showBackButton="false"
            :isConnecting="isLoading"
            :isConnected="isConnected"
            :deviceStatus="deviceStatus"
            :error="joinError"
            @join="joinRoom"
          />

          <!-- معلومات الاتصال -->
          <UCard v-if="isConnected">
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">📞 معلومات المكالمة</h3>
            </template>
            
            <div class="space-y-3">
              <div class="flex justify-between">
                <span class="text-gray-600">رقم الغرفة:</span>
                <span class="font-mono font-bold text-green-600">{{ roomId }}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">حالة الاتصال:</span>
                <span class="font-semibold text-green-600">نشط</span>
              </div>
              <div class="flex justify-between">
                <span class="text-gray-600">العميل:</span>
                <span class="font-semibold">{{ customerName || 'غير معروف' }}</span>
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

          <!-- أدوات مساعدة -->
          <UCard>
            <template #header>
              <h3 class="text-lg font-semibold text-gray-900">🛠️ أدوات مساعدة</h3>
            </template>
            
            <div class="space-y-2">
              <UButton 
                block 
                color="gray" 
                variant="outline"
                @click="testDevices"
                icon="i-heroicons-wrench-screwdriver"
              >
                اختبار الأجهزة
              </UButton>
              
              <UButton 
                block 
                color="blue" 
                variant="outline"
                @click="openKnowledgeBase"
                icon="i-heroicons-book-open"
              >
                قاعدة المعرفة
              </UButton>
            </div>
          </UCard>
        </div>

        <!-- العمود الأيمن: منطقة المكالمة -->
        <div class="lg:col-span-2">
          <!-- قبل الاتصال -->
          <div v-if="!isConnected" class="text-center py-12">
            <div class="max-w-md mx-auto">
              <UIcon name="i-heroicons-user-group" class="w-24 h-24 text-green-400 mx-auto mb-6" />
              <h2 class="text-2xl font-bold text-gray-800 mb-4">جاهز للمساعدة</h2>
              <p class="text-gray-600 mb-8">
                أدخل اسمك ورقم غرفة العميل للانضمام إلى المكالمة وتقديم الدعم
              </p>
              
              <div class="bg-green-50 p-4 rounded-lg">
                <p class="text-green-800 font-medium mb-2">💡 تلميح:</p>
                <p class="text-sm text-green-700">
                  اطلب من العميل مشاركة رقم الغرفة معك. الرمز يشبه: ROOM_ABC123XYZ
                </p>
              </div>
            </div>
          </div>

          <!-- أثناء المكالمة -->
          <div v-else-if="token && wsUrl">
            <VideoCall
              :token="token"
              :ws-url="wsUrl"
              :user-name="agentName"
              :room-id="roomId"
              title="مكالمة دعم - الوكيل"
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
const agentName = ref('')
const roomId = ref('')
const token = ref('')
const wsUrl = ref('')
const isLoading = ref(false)
const isConnected = ref(false)
const joinError = ref('')
const customerName = ref('')

// حالة الأجهزة
const deviceStatus = ref({
  hasCamera: false,
  hasMicrophone: false
})

// انضمام للغرفة
const joinRoom = async (name: string, room: string) => {
  if (!name.trim() || !room.trim()) {
    joinError.value = 'الرجاء إدخال اسم الوكيل ورقم الغرفة'
    return
  }

  isLoading.value = true
  joinError.value = ''

  // حفظ البيانات
  agentName.value = name
  roomId.value = room
  
  localStorage.setItem('userName', agentName.value)
  localStorage.setItem('roomId', roomId.value)
  localStorage.setItem('userRole', 'agent')

  try {
    // الحصول على التوكن
    const response = await $fetch('/api/token', {
      method: 'POST',
      body: {
        roomName: roomId.value,
        userName: agentName.value,
        role: 'agent'
      }
    })

    token.value = response.token
    wsUrl.value = response.wsUrl
    isConnected.value = true
    
    // محاكاة اسم العميل
    customerName.value = 'عميل ' + Math.floor(Math.random() * 1000)
    
    toast.add({
      title: '🎉 تم الانضمام',
      description: `تم الاتصال بغرفة العميل ${roomId.value}`,
      color: 'green',
      timeout: 4000
    })

  } catch (error: any) {
    joinError.value = error.message || 'حدث خطأ أثناء الانضمام للغرفة'
    
    toast.add({
      title: '❌ فشل الانضمام',
      description: error.message || 'حدث خطأ أثناء الانضمام للغرفة',
      color: 'red'
    })
  } finally {
    isLoading.value = false
  }
}

// اختبار الأجهزة
const testDevices = async () => {
  try {
    const { checkAllDevices } = await import('~/composables/useDeviceCheck')
    const deviceCheck = checkAllDevices()
    const result = await deviceCheck.checkAllDevices()
    
    deviceStatus.value = {
      hasCamera: result.hasCamera,
      hasMicrophone: result.hasMicrophone
    }
    
    toast.add({
      title: '✅ تم الاختبار',
      description: `الكاميرا: ${result.hasCamera ? 'متاحة' : 'غير متاحة'} | الميكروفون: ${result.hasMicrophone ? 'متاح' : 'غير متاح'}`,
      color: 'green',
      timeout: 3000
    })
  } catch (error) {
    toast.add({
      title: '❌ فشل الاختبار',
      description: 'تعذر التحقق من الأجهزة',
      color: 'red'
    })
  }
}

// فتح قاعدة المعرفة
const openKnowledgeBase = () => {
  window.open('https://docs.livekit.io', '_blank')
}

// قطع الاتصال
const handleDisconnect = () => {
  isConnected.value = false
  token.value = ''
  wsUrl.value = ''
  customerName.value = ''
  
  toast.add({
    title: '📞 تم إنهاء المكالمة',
    description: 'تم إنهاء المكالمة مع العميل',
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

// التهيئة عند التحميل
onMounted(async () => {
  // استعادة البيانات
  const savedName = localStorage.getItem('userName')
  const savedRoom = localStorage.getItem('roomId')
  
  if (savedName) agentName.value = savedName
  if (savedRoom) roomId.value = savedRoom
  
  // التحقق من الأجهزة
  await testDevices()
})
</script>