<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
    <UContainer class="py-12">
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold text-gray-900 mb-4">
          نظام مكالمات الفيديو المباشرة
        </h1>
        <p class="text-gray-600 text-lg">
          انضم كمستخدم أو وكيل للبدء في مكالمة فيديو مباشرة
        </p>
      </div>

      <div class="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <!-- بطاقة العميل -->
        <UCard class="text-center hover:shadow-xl transition-shadow duration-300">
          <template #header>
            <div class="flex justify-center mb-4">
              <div class="p-4 bg-blue-100 rounded-full">
                <UIcon name="i-heroicons-user" class="w-16 h-16 text-blue-600" />
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">عميل</h2>
            <p class="text-gray-600 mt-2">ابدأ مكالمة مع وكيل الدعم</p>
          </template>

          <div class="space-y-4">
            <UInput 
              v-model="customerName" 
              placeholder="اسمك" 
              icon="i-heroicons-user-circle"
              size="lg"
            />
            
            <UButton 
              block 
              size="lg" 
              color="blue" 
              :disabled="!customerName"
              @click="joinAsCustomer"
              :loading="loading"
            >
              <template #leading>
                <UIcon name="i-heroicons-video-camera" class="w-5 h-5" />
              </template>
              انضم كمستخدم
            </UButton>
          </div>
        </UCard>

        <!-- بطاقة الوكيل -->
        <UCard class="text-center hover:shadow-xl transition-shadow duration-300">
          <template #header>
            <div class="flex justify-center mb-4">
              <div class="p-4 bg-green-100 rounded-full">
                <UIcon name="i-heroicons-user-group" class="w-16 h-16 text-green-600" />
              </div>
            </div>
            <h2 class="text-2xl font-bold text-gray-900">وكيل دعم</h2>
            <p class="text-gray-600 mt-2">ساعد العملاء في مكالمات الفيديو</p>
          </template>

          <div class="space-y-4">
            <UInput 
              v-model="agentName" 
              placeholder="اسم الوكيل" 
              icon="i-heroicons-badge"
              size="lg"
            />
            <UInput 
              v-model="agentRoom" 
              placeholder="رقم الغرفة" 
              icon="i-heroicons-key"
              size="lg"
              required
            />
            
            <UButton 
              block 
              size="lg" 
              color="green" 
              :disabled="!agentName || !agentRoom"
              @click="joinAsAgent"
              :loading="loading"
            >
              <template #leading>
                <UIcon name="i-heroicons-headphones" class="w-5 h-5" />
              </template>
              انضم كوكيل
            </UButton>
          </div>
        </UCard>
      </div>

      <!-- معلومات -->
      <UCard class="mt-8 max-w-4xl mx-auto">
        <div class="grid md:grid-cols-3 gap-6 text-center">
          <div>
            <UIcon name="i-heroicons-shield-check" class="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <h3 class="font-semibold">آمن</h3>
            <p class="text-sm text-gray-600">مكالمات مشفرة وآمنة</p>
          </div>
          <div>
            <UIcon name="i-heroicons-bolt" class="w-8 h-8 text-green-600 mx-auto mb-2" />
            <h3 class="font-semibold">مباشر</h3>
            <p class="text-sm text-gray-600">زمن انتقال منخفض جداً</p>
          </div>
          <div>
            <UIcon name="i-heroicons-device-phone-mobile" class="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <h3 class="font-semibold">متجاوب</h3>
            <p class="text-sm text-gray-600">يعمل على جميع الأجهزة</p>
          </div>
        </div>
      </UCard>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
const router = useRouter()
const customerName = ref('')
const agentName = ref('')
const agentRoom = ref('')
const loading = ref(false)

const joinAsCustomer = async () => {
  if (!customerName.value) {
    useToast().add({
      title: 'خطأ',
      description: 'الرجاء إدخال اسمك',
      color: 'red'
    })
    return
  }

  loading.value = true
  
  localStorage.setItem('userRole', 'customer')
  localStorage.setItem('userName', customerName.value)
  
  await navigateTo('/customer')
  loading.value = false
}

const joinAsAgent = async () => {
  if (!agentName.value || !agentRoom.value) {
    useToast().add({
      title: 'خطأ',
      description: 'الرجاء إدخال اسم الوكيل ورقم الغرفة',
      color: 'red'
    })
    return
  }

  loading.value = true
  
  localStorage.setItem('userRole', 'agent')
  localStorage.setItem('userName', agentName.value)
  localStorage.setItem('roomId', agentRoom.value)
  
  await navigateTo('/agent')
  loading.value = false
}
</script>