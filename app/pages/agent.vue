<template>
  <div class="min-h-screen bg-gray-50">
    <UContainer class="py-8">
      <!-- شريط التنقل -->
      <div class="flex justify-between items-center mb-8">
        <div>
          <h1 class="text-2xl font-bold text-gray-900">👨‍💼 غرفة الوكيل</h1>
          <p class="text-gray-600">انضم إلى غرفة العميل لتقديم الدعم</p>
        </div>
        
        <div class="flex gap-2">
          <UButton 
            color="gray" 
            variant="ghost" 
            icon="i-heroicons-arrow-left"
            @click="goBack"
          >
            العودة
          </UButton>
          
          <UButton 
            color="green" 
            icon="i-heroicons-question-mark-circle"
            @click="showInstructions = true"
          >
            المساعدة
          </UButton>
        </div>
      </div>

      <!-- إدخال رمز الغرفة -->
      <UCard v-if="!token" class="mb-6">
        <template #header>
          <h3 class="text-lg font-semibold">🎯 انضم إلى غرفة العميل</h3>
        </template>
        
        <div class="space-y-4">
          <UInput 
            v-model="agentRoomId" 
            placeholder="أدخل رمز الغرفة من العميل" 
            icon="i-heroicons-key"
            size="lg"
          />
          
          <UInput 
            v-model="agentName" 
            placeholder="اسمك كوكيل" 
            icon="i-heroicons-badge"
            size="lg"
          />
          
          <div class="flex gap-4">
            <UButton 
              block 
              color="green" 
              @click="joinRoom"
              :loading="loading"
              :disabled="!agentRoomId || !agentName"
            >
              <template #leading>
                <UIcon name="i-heroicons-play" class="w-5 h-5" />
              </template>
              انضم إلى المكالمة
            </UButton>
            
            <UButton 
              color="blue" 
              variant="outline"
              @click="testConnection"
            >
              <template #leading>
                <UIcon name="i-heroicons-wrench-screwdriver" class="w-5 h-5" />
              </template>
              اختبار الأجهزة
            </UButton>
          </div>
        </div>
      </UCard>

      <!-- مكون المكالمة -->
      <VideoCall 
        v-if="token && wsUrl"
        :token="token"
        :ws-url="wsUrl"
        :user-name="agentName"
        :room-id="agentRoomId"
        title="مكالمة دعم - الوكيل"
        @disconnected="handleDisconnect"
      />

      <!-- لوحة تحكم الوكيل -->
      <UCard v-if="token" class="mt-6">
        <template #header>
          <h3 class="text-lg font-semibold">🛠️ أدوات الوكيل</h3>
        </template>
        
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <UButton color="blue" variant="outline">
            <template #leading>
              <UIcon name="i-heroicons-document-text" class="w-5 h-5" />
            </template>
            سجل المحادثة
          </UButton>
          
          <UButton color="purple" variant="outline">
            <template #leading>
              <UIcon name="i-heroicons-share" class="w-5 h-5" />
            </template>
            مشاركة الشاشة
          </UButton>
          
          <UButton color="orange" variant="outline">
            <template #leading>
              <UIcon name="i-heroicons-clock" class="w-5 h-5" />
            </template>
            تأجيل المكالمة
          </UButton>
          
          <UButton color="red" variant="outline" @click="endCallForBoth">
            <template #leading>
              <UIcon name="i-heroicons-flag" class="w-5 h-5" />
            </template>
            إنهاء للطرفين
          </UButton>
        </div>
      </UCard>
    </UContainer>

    <!-- نافذة التعليمات -->
    <UModal v-model="showInstructions">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">📖 تعليمات الوكيل</h3>
        </template>
        
        <div class="space-y-4">
          <div>
            <h4 class="font-semibold">1. الحصول على رمز الغرفة</h4>
            <p class="text-sm text-gray-600">اطلب من العميل مشاركة رمز الغرفة معك</p>
          </div>
          
          <div>
            <h4 class="font-semibold">2. الانضمام إلى المكالمة</h4>
            <p class="text-sm text-gray-600">أدخل رمز الغرفة وانقر على "انضم إلى المكالمة"</p>
          </div>
          
          <div>
            <h4 class="font-semibold">3. تقديم الدعم</h4>
            <p class="text-sm text-gray-600">استخدم أدوات التحكم للتحكم في الصوت والفيديو</p>
          </div>
        </div>
        
        <template #footer>
          <UButton color="gray" @click="showInstructions = false">
            فهمت
          </UButton>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  middleware: 'auth'
});

const toast = useToast();
const router = useRouter();

const token = ref<string>('');
const wsUrl = ref<string>('');
const agentName = ref(localStorage.getItem('userName') || 'وكيل');
const agentRoomId = ref('');
const loading = ref(false);
const showInstructions = ref(false);

const goBack = () => {
  router.push('/');
};

const joinRoom = async () => {
  if (!agentRoomId.value || !agentName.value) {
    toast.add({
      title: 'خطأ',
      description: 'الرجاء إدخال رمز الغرفة واسمك',
      color: 'red'
    });
    return;
  }

  loading.value = true;
  
  try {
    // حفظ الاسم في LocalStorage
    localStorage.setItem('userName', agentName.value);
    
    const response = await $fetch('/api/token', {
      method: 'POST',
      body: {
        roomName: agentRoomId.value,
        userName: agentName.value,
        role: 'agent'
      }
    });
    
    token.value = response.token;
    wsUrl.value = response.wsUrl;
    
    toast.add({
      title: 'تم الاتصال',
      description: 'تم الانضمام إلى غرفة العميل',
      color: 'green'
    });
    
  } catch (error) {
    toast.add({
      title: 'خطأ',
      description: 'فشل في الانضمام إلى الغرفة. تأكد من رمز الغرفة',
      color: 'red'
    });
    console.error('Error joining room:', error);
  } finally {
    loading.value = false;
  }
};

const testConnection = async () => {
  try {
    // طلب إذن الوصول إلى الكاميرا والميكروفون
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    // إيقاف التدفق بعد الاختبار
    stream.getTracks().forEach(track => track.stop());
    
    toast.add({
      title: '✅ الاختبار ناجح',
      description: 'الكاميرا والميكروفون يعملان بشكل صحيح',
      color: 'green'
    });
    
  } catch (error) {
    toast.add({
      title: '❌ فشل الاختبار',
      description: 'تأكد من إذن الوصول إلى الكاميرا والميكروفون',
      color: 'red'
    });
  }
};

const handleDisconnect = () => {
  token.value = '';
  wsUrl.value = '';
  
  toast.add({
    title: 'تم قطع الاتصال',
    description: 'تم إنهاء المكالمة',
    color: 'blue'
  });
};

const endCallForBoth = () => {
  // هنا يمكنك إضافة منطق لإرسال إشارة إنهاء المكالمة للعميل
  handleDisconnect();
  
  toast.add({
    title: 'تم إنهاء المكالمة',
    description: 'تم إنهاء المكالمة للطرفين',
    color: 'red'
  });
};
</script>