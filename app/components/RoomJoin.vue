<template>
  <UCard class="room-join-container">
    <template #header>
      <div class="flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900">{{ title }}</h3>
        <UBadge v-if="roomId" color="blue" size="sm">
          {{ roomId }}
        </UBadge>
      </div>
    </template>

    <div class="space-y-4">
      <!-- حقل الاسم -->
      <div>
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ labelName || 'الاسم' }}
        </label>
        <UInput
          v-model="localUserName"
          :placeholder="placeholderName || 'أدخل اسمك'"
          icon="i-heroicons-user"
          size="lg"
          :disabled="isConnecting || isConnected"
          @keyup.enter="handleJoin"
        />
      </div>

      <!-- حقل رقم الغرفة -->
      <div v-if="showRoomInput">
        <label class="block text-sm font-medium text-gray-700 mb-1">
          {{ labelRoom || 'رقم الغرفة' }}
        </label>
        <UInput
          v-model="localRoomId"
          :placeholder="placeholderRoom || 'أدخل رقم الغرفة'"
          icon="i-heroicons-key"
          size="lg"
          :disabled="isConnecting || isConnected"
          @keyup.enter="handleJoin"
        />
      </div>

      <!-- عرض رمز الغرفة للعميل -->
      <div v-if="roomId && !showRoomInput" class="bg-blue-50 p-3 rounded-lg">
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

      <!-- أزرار التحكم -->
      <div class="flex gap-3 pt-2">
        <UButton
          block
          :color="buttonColor"
          :loading="isConnecting"
          :disabled="!canJoin || isConnected"
          @click="handleJoin"
          size="lg"
        >
          <template #leading>
            <UIcon :name="buttonIcon" class="w-5 h-5" />
          </template>
          {{ buttonText }}
        </UButton>

        <UButton
          v-if="showBackButton"
          color="gray"
          variant="outline"
          @click="$emit('back')"
          :disabled="isConnecting"
          size="lg"
        >
          العودة
        </UButton>
      </div>

      <!-- رسائل الأخطاء -->
      <div v-if="error" class="mt-3">
        <UAlert
          :title="'❌ خطأ'"
          :description="error"
          color="red"
          icon="i-heroicons-exclamation-triangle"
          variant="subtle"
        />
      </div>

      <!-- حالة الأجهزة -->
      <div v-if="deviceStatus" class="mt-4 p-3 bg-gray-50 rounded-lg">
        <h4 class="font-medium text-gray-700 mb-2">حالة الأجهزة:</h4>
        <div class="grid grid-cols-2 gap-2">
          <div class="flex items-center gap-2">
            <UIcon
              :name="deviceStatus.hasCamera ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              :class="deviceStatus.hasCamera ? 'text-green-500' : 'text-red-500'"
              class="w-4 h-4"
            />
            <span class="text-sm">كاميرا</span>
          </div>
          <div class="flex items-center gap-2">
            <UIcon
              :name="deviceStatus.hasMicrophone ? 'i-heroicons-check-circle' : 'i-heroicons-x-circle'"
              :class="deviceStatus.hasMicrophone ? 'text-green-500' : 'text-red-500'"
              class="w-4 h-4"
            />
            <span class="text-sm">ميكروفون</span>
          </div>
        </div>
      </div>
    </div>
  </UCard>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  userName?: string
  roomId?: string
  title?: string
  labelName?: string
  labelRoom?: string
  placeholderName?: string
  placeholderRoom?: string
  buttonText?: string
  buttonColor?: 'blue' | 'green' | 'red' | 'gray'
  buttonIcon?: string
  showRoomInput?: boolean
  showBackButton?: boolean
  isConnecting?: boolean
  isConnected?: boolean
  deviceStatus?: {
    hasCamera: boolean
    hasMicrophone: boolean
  }
  error?: string
}

const props = withDefaults(defineProps<Props>(), {
  title: 'انضم إلى الغرفة',
  buttonText: 'انضم',
  buttonColor: 'blue',
  buttonIcon: 'i-heroicons-play',
  showRoomInput: true,
  showBackButton: false,
  isConnecting: false,
  isConnected: false
})

const emit = defineEmits<{
  join: [userName: string, roomId: string]
  back: []
  'update:userName': [value: string]
  'update:roomId': [value: string]
}>()

const localUserName = ref(props.userName || '')
const localRoomId = ref(props.roomId || '')

// تحديث القيم عند تغيير الـ props
watch(() => props.userName, (val) => {
  if (val !== undefined) localUserName.value = val
})

watch(() => props.roomId, (val) => {
  if (val !== undefined) localRoomId.value = val
})

// التحقق من إمكانية الانضمام
const canJoin = computed(() => {
  const hasName = localUserName.value.trim().length > 0
  const hasRoom = !props.showRoomInput || localRoomId.value.trim().length > 0
  return hasName && hasRoom
})

// معالجة الانضمام
const handleJoin = () => {
  if (!canJoin.value) return
  
  const userName = localUserName.value.trim()
  const roomId = localRoomId.value.trim() || props.roomId || ''
  
  emit('update:userName', userName)
  emit('update:roomId', roomId)
  emit('join', userName, roomId)
}

// نسخ رمز الغرفة
const copyRoomId = async () => {
  try {
    await navigator.clipboard.writeText(props.roomId || '')
    
    // استخدام UToast من NuxtUI (يجب تهيئته في App)
    if (typeof window !== 'undefined') {
      const toast = useToast?.()
      if (toast) {
        toast.add({
          title: '✅ تم النسخ',
          description: 'تم نسخ رمز الغرفة',
          color: 'green',
          timeout: 2000
        })
      }
    }
  } catch (err) {
    console.error('❌ خطأ في النسخ:', err)
  }
}
</script>

<style scoped>
.room-join-container {
  max-width: 500px;
  margin: 0 auto;
}
</style>