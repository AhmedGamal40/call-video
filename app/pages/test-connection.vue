<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
    <!-- Header -->
    <div class="max-w-7xl mx-auto">
      <div class="text-center mb-8">
        <h1 class="text-3xl font-bold text-gray-900 mb-2">🎥 LiveKit Video Call - Real Test</h1>
        <p class="text-gray-600">Real video & audio call between Agent and Customer</p>
      </div>

      <!-- Connection Status -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <span class="text-blue-600 text-xl">👨‍💼</span>
              </div>
              <div>
                <h3 class="font-bold">Agent</h3>
                <p class="text-sm text-gray-500">{{ agent.name || 'Not connected' }}</p>
              </div>
            </div>
            <UBadge :color="agent.connected ? 'green' : 'gray'" variant="soft">
              {{ agent.connected ? 'Connected' : 'Disconnected' }}
            </UBadge>
          </div>
        </div>

        <div class="bg-white rounded-xl shadow p-4">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <span class="text-green-600 text-xl">👤</span>
              </div>
              <div>
                <h3 class="font-bold">Customer</h3>
                <p class="text-sm text-gray-500">{{ customer.name || 'Not connected' }}</p>
              </div>
            </div>
            <UBadge :color="customer.connected ? 'green' : 'gray'" variant="soft">
              {{ customer.connected ? 'Connected' : 'Disconnected' }}
            </UBadge>
          </div>
        </div>
      </div>

      <!-- Connection Panel -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <!-- Agent Connection -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Agent Connection</h2>
          
          <div class="space-y-4">
            <UInput 
              v-model="agent.name" 
              placeholder="Agent Name" 
              icon="i-heroicons-user-circle"
              :disabled="agent.connected"
            />
            
            <div class="grid grid-cols-2 gap-3">
              <UButton 
                @click="connectAgent" 
                :loading="agent.connecting"
                :disabled="agent.connected"
                block
                color="blue"
              >
                {{ agent.connected ? 'Connected ✓' : 'Connect Agent' }}
              </UButton>
              
              <UButton 
                @click="disconnectAgent" 
                :disabled="!agent.connected"
                block
                color="red"
                variant="outline"
              >
                Disconnect
              </UButton>
            </div>
            
            <!-- Agent Media Controls -->
            <div v-if="agent.connected" class="space-y-3 pt-4 border-t">
              <div class="grid grid-cols-2 gap-3">
                <UButton 
                  @click="toggleAgentVideo"
                  :variant="agent.videoEnabled ? 'solid' : 'outline'"
                  :color="agent.videoEnabled ? 'blue' : 'gray'"
                  block
                  :icon="agent.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'"
                >
                  {{ agent.videoEnabled ? 'Video On' : 'Video Off' }}
                </UButton>
                
                <UButton 
                  @click="toggleAgentAudio"
                  :variant="agent.audioEnabled ? 'solid' : 'outline'"
                  :color="agent.audioEnabled ? 'blue' : 'gray'"
                  block
                  :icon="agent.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'"
                >
                  {{ agent.audioEnabled ? 'Audio On' : 'Audio Off' }}
                </UButton>
              </div>
              
              <div class="text-sm text-gray-600 space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-user-group" class="text-gray-400" />
                  <span>Participants: {{ agentParticipants.length }}</span>
                </div>
                <div v-if="agent.speaking" class="flex items-center gap-2 text-green-600">
                  <UIcon name="i-heroicons-speaker-wave" />
                  <span>Speaking now</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Customer Connection -->
        <div class="bg-white rounded-xl shadow-lg p-6">
          <h2 class="text-xl font-bold text-gray-800 mb-4">Customer Connection</h2>
          
          <div class="space-y-4">
            <UInput 
              v-model="customer.name" 
              placeholder="Customer Name" 
              icon="i-heroicons-user"
              :disabled="customer.connected"
            />
            
            <div class="grid grid-cols-2 gap-3">
              <UButton 
                @click="connectCustomer" 
                :loading="customer.connecting"
                :disabled="customer.connected"
                block
                color="green"
              >
                {{ customer.connected ? 'Connected ✓' : 'Connect Customer' }}
              </UButton>
              
              <UButton 
                @click="disconnectCustomer" 
                :disabled="!customer.connected"
                block
                color="red"
                variant="outline"
              >
                Disconnect
              </UButton>
            </div>
            
            <!-- Customer Media Controls -->
            <div v-if="customer.connected" class="space-y-3 pt-4 border-t">
              <div class="grid grid-cols-2 gap-3">
                <UButton 
                  @click="toggleCustomerVideo"
                  :variant="customer.videoEnabled ? 'solid' : 'outline'"
                  :color="customer.videoEnabled ? 'green' : 'gray'"
                  block
                  :icon="customer.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'"
                >
                  {{ customer.videoEnabled ? 'Video On' : 'Video Off' }}
                </UButton>
                
                <UButton 
                  @click="toggleCustomerAudio"
                  :variant="customer.audioEnabled ? 'solid' : 'outline'"
                  :color="customer.audioEnabled ? 'green' : 'gray'"
                  block
                  :icon="customer.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'"
                >
                  {{ customer.audioEnabled ? 'Audio On' : 'Audio Off' }}
                </UButton>
              </div>
              
              <div class="text-sm text-gray-600 space-y-1">
                <div class="flex items-center gap-2">
                  <UIcon name="i-heroicons-user-group" class="text-gray-400" />
                  <span>Participants: {{ customerParticipants.length }}</span>
                </div>
                <div v-if="customer.speaking" class="flex items-center gap-2 text-green-600">
                  <UIcon name="i-heroicons-speaker-wave" />
                  <span>Speaking now</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Video Room -->
      <div v-if="showVideoRoom" class="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-2xl font-bold text-gray-800">Video Call Room</h2>
          <div class="flex items-center gap-2">
            <UBadge color="blue" variant="soft">Room: {{ roomName }}</UBadge>
            <UBadge color="green" variant="soft">
              Total: {{ totalParticipants }} participants
            </UBadge>
          </div>
        </div>
        
        <!-- Video Grid -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Agent Video -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="text-blue-600">👨‍💼</span> 
                {{ agent.name || 'Agent' }}
                <span v-if="agent.speaking" class="animate-pulse text-green-600">● Speaking</span>
              </h3>
              <div class="flex items-center gap-2">
                <UIcon 
                  :name="agent.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'" 
                  :class="agent.videoEnabled ? 'text-green-500' : 'text-red-500'" 
                />
                <UIcon 
                  :name="agent.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'" 
                  :class="agent.audioEnabled ? 'text-green-500' : 'text-red-500'" 
                />
              </div>
            </div>
            
            <div class="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-blue-200">
              <!-- Local Agent Video -->
              <video 
                ref="agentLocalVideo" 
                autoplay 
                playsinline
                muted
                class="w-full h-full object-cover"
              ></video>
              
              <!-- Remote Customer Video (PIP) -->
              <div v-if="showRemoteVideoForAgent" class="absolute bottom-4 right-4 w-48 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video 
                  ref="agentRemoteVideo" 
                  autoplay 
                  playsinline
                  class="w-full h-full"
                ></video>
                <div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Customer
                </div>
              </div>
              
              <!-- Status Overlay -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div class="flex items-center justify-between text-white">
                  <div class="font-medium">{{ agent.name }}</div>
                  <div class="flex items-center gap-2">
                    <div v-if="!agent.videoEnabled" class="bg-black/50 px-2 py-1 rounded text-xs">
                      Camera Off
                    </div>
                    <div v-if="!agent.audioEnabled" class="bg-black/50 px-2 py-1 rounded text-xs">
                      Mic Off
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Video Off Placeholder -->
              <div v-if="!agent.videoEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div class="text-center">
                  <div class="text-5xl mb-2 text-gray-400">📷</div>
                  <p class="text-gray-300 font-medium">Camera is off</p>
                  <p class="text-gray-400 text-sm">Agent video disabled</p>
                </div>
              </div>
            </div>
            
            <!-- Agent Participants List -->
            <div v-if="agentParticipants.length > 0" class="bg-gray-50 rounded-lg p-3">
              <h4 class="text-sm font-medium text-gray-700 mb-2">In this room:</h4>
              <div class="space-y-1">
                <div 
                  v-for="participant in agentParticipants" 
                  :key="participant.sid"
                  class="flex items-center justify-between text-sm p-2 bg-white rounded"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" 
                      :class="participant.identity === agent.name ? 'bg-blue-500' : 'bg-green-500'"></div>
                    <span :class="participant.identity === agent.name ? 'font-medium' : ''">
                      {{ participant.identity }}
                    </span>
                  </div>
                  <UBadge size="xs" :color="participant.isSpeaking ? 'green' : 'gray'">
                    {{ participant.isSpeaking ? 'Speaking' : 'Silent' }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>

          <!-- Customer Video -->
          <div class="space-y-3">
            <div class="flex items-center justify-between">
              <h3 class="font-bold text-lg flex items-center gap-2">
                <span class="text-green-600">👤</span> 
                {{ customer.name || 'Customer' }}
                <span v-if="customer.speaking" class="animate-pulse text-green-600">● Speaking</span>
              </h3>
              <div class="flex items-center gap-2">
                <UIcon 
                  :name="customer.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'" 
                  :class="customer.videoEnabled ? 'text-green-500' : 'text-red-500'" 
                />
                <UIcon 
                  :name="customer.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'" 
                  :class="customer.audioEnabled ? 'text-green-500' : 'text-red-500'" 
                />
              </div>
            </div>
            
            <div class="relative rounded-xl overflow-hidden bg-black aspect-video border-2 border-green-200">
              <!-- Local Customer Video -->
              <video 
                ref="customerLocalVideo" 
                autoplay 
                playsinline
                muted
                class="w-full h-full object-cover"
              ></video>
              
              <!-- Remote Agent Video (PIP) -->
              <div v-if="showRemoteVideoForCustomer" class="absolute bottom-4 right-4 w-48 rounded-lg overflow-hidden border-2 border-white shadow-lg">
                <video 
                  ref="customerRemoteVideo" 
                  autoplay 
                  playsinline
                  class="w-full h-full"
                ></video>
                <div class="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                  Agent
                </div>
              </div>
              
              <!-- Status Overlay -->
              <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                <div class="flex items-center justify-between text-white">
                  <div class="font-medium">{{ customer.name }}</div>
                  <div class="flex items-center gap-2">
                    <div v-if="!customer.videoEnabled" class="bg-black/50 px-2 py-1 rounded text-xs">
                      Camera Off
                    </div>
                    <div v-if="!customer.audioEnabled" class="bg-black/50 px-2 py-1 rounded text-xs">
                      Mic Off
                    </div>
                  </div>
                </div>
              </div>
              
              <!-- Video Off Placeholder -->
              <div v-if="!customer.videoEnabled" class="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div class="text-center">
                  <div class="text-5xl mb-2 text-gray-400">📷</div>
                  <p class="text-gray-300 font-medium">Camera is off</p>
                  <p class="text-gray-400 text-sm">Customer video disabled</p>
                </div>
              </div>
            </div>
            
            <!-- Customer Participants List -->
            <div v-if="customerParticipants.length > 0" class="bg-gray-50 rounded-lg p-3">
              <h4 class="text-sm font-medium text-gray-700 mb-2">In this room:</h4>
              <div class="space-y-1">
                <div 
                  v-for="participant in customerParticipants" 
                  :key="participant.sid"
                  class="flex items-center justify-between text-sm p-2 bg-white rounded"
                >
                  <div class="flex items-center gap-2">
                    <div class="w-2 h-2 rounded-full" 
                      :class="participant.identity === customer.name ? 'bg-green-500' : 'bg-blue-500'"></div>
                    <span :class="participant.identity === customer.name ? 'font-medium' : ''">
                      {{ participant.identity }}
                    </span>
                  </div>
                  <UBadge size="xs" :color="participant.isSpeaking ? 'green' : 'gray'">
                    {{ participant.isSpeaking ? 'Speaking' : 'Silent' }}
                  </UBadge>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Call Controls -->
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <UButton 
            @click="toggleAgentVideo"
            :variant="agent.videoEnabled ? 'solid' : 'outline'"
            color="blue"
            size="lg"
            :icon="agent.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'"
          >
            {{ agent.videoEnabled ? 'Agent Video On' : 'Agent Video Off' }}
          </UButton>
          
          <UButton 
            @click="toggleAgentAudio"
            :variant="agent.audioEnabled ? 'solid' : 'outline'"
            color="blue"
            size="lg"
            :icon="agent.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'"
          >
            {{ agent.audioEnabled ? 'Agent Audio On' : 'Agent Audio Off' }}
          </UButton>
          
          <UButton 
            @click="toggleCustomerVideo"
            :variant="customer.videoEnabled ? 'solid' : 'outline'"
            color="green"
            size="lg"
            :icon="customer.videoEnabled ? 'i-heroicons-video-camera' : 'i-heroicons-video-camera-slash'"
          >
            {{ customer.videoEnabled ? 'Customer Video On' : 'Customer Video Off' }}
          </UButton>
          
          <UButton 
            @click="toggleCustomerAudio"
            :variant="customer.audioEnabled ? 'solid' : 'outline'"
            color="green"
            size="lg"
            :icon="customer.audioEnabled ? 'i-heroicons-microphone' : 'i-heroicons-microphone-slash'"
          >
            {{ customer.audioEnabled ? 'Customer Audio On' : 'Customer Audio Off' }}
          </UButton>
          
          <UButton 
            @click="endAllCalls"
            color="red"
            size="lg"
            icon="i-heroicons-phone-x-mark"
          >
            End All Calls
          </UButton>
        </div>
      </div>

      <!-- Logs & Debug -->
      <div class="bg-gray-900 rounded-xl shadow-lg p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-xl font-bold text-white flex items-center gap-2">
            <span>📊</span> Connection Logs
          </h2>
          <div class="flex gap-2">
            <UButton @click="clearLogs" size="sm" variant="outline" color="white">
              Clear Logs
            </UButton>
            <UButton @click="testAudio" size="sm" variant="outline" color="green">
              Test Audio
            </UButton>
          </div>
        </div>
        
        <div class="space-y-2 max-h-64 overflow-y-auto font-mono text-sm">
          <div 
            v-for="(log, idx) in logs" 
            :key="idx"
            class="p-3 rounded-lg"
            :class="{
              'bg-blue-900/30 text-blue-300': log.type === 'info',
              'bg-green-900/30 text-green-300': log.type === 'success',
              'bg-yellow-900/30 text-yellow-300': log.type === 'warning',
              'bg-red-900/30 text-red-300': log.type === 'error'
            }"
          >
            <div class="flex items-start gap-3">
              <span class="text-xs opacity-50 whitespace-nowrap">{{ log.time }}</span>
              <span class="flex-1">{{ log.message }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { Room } from 'livekit-client'

// LiveKit Configuration
const LIVEKIT_WS_URL = "wss://test-project-s1z07f4y.livekit.cloud"
const ROOM_NAME = "video-call-room"

// Agent State
const agent = ref({
  name: 'Agent',
  room: null,
  connected: false,
  connecting: false,
  videoEnabled: true,
  audioEnabled: true,
  speaking: false
})

// Customer State
const customer = ref({
  name: 'Customer',
  room: null,
  connected: false,
  connecting: false,
  videoEnabled: true,
  audioEnabled: true,
  speaking: false
})

// Video Refs
const agentLocalVideo = ref(null)
const agentRemoteVideo = ref(null)
const customerLocalVideo = ref(null)
const customerRemoteVideo = ref(null)

// State
const logs = ref([])
const agentParticipants = ref([])
const customerParticipants = ref([])
const roomName = ref(ROOM_NAME)

// Computed
const showVideoRoom = computed(() => 
  agent.value.connected || customer.value.connected
)

const showRemoteVideoForAgent = computed(() => 
  agent.value.connected && customer.value.connected && customer.value.videoEnabled
)

const showRemoteVideoForCustomer = computed(() => 
  customer.value.connected && agent.value.connected && agent.value.videoEnabled
)

const totalParticipants = computed(() => {
  let count = 0
  if (agent.value.connected) count += agentParticipants.value.length
  if (customer.value.connected) count += customerParticipants.value.length
  return count
})

// Logging
const addLog = (message, type = 'info') => {
  const logEntry = {
    time: new Date().toLocaleTimeString(),
    message,
    type
  }
  logs.value.unshift(logEntry)
  console.log(`[${type.toUpperCase()}]`, message)
}

const clearLogs = () => {
  logs.value = []
}

// Token Generation
const generateToken = async (identity) => {
  try {
    const response = await fetch('/api/livekit/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        identity, 
        roomName: ROOM_NAME 
      })
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }

    const data = await response.json()
    
    if (!data.success || !data.token) {
      throw new Error(data.error || 'Invalid token response')
    }
    
    return data.token
    
  } catch (error) {
    addLog(`Token generation failed: ${error.message}`, 'error')
    throw error
  }
}

// Room Setup with Full Media
const setupRoomWithMedia = async (userType) => {
  const user = userType === 'agent' ? agent.value : customer.value
  const videoElement = userType === 'agent' ? agentLocalVideo.value : customerLocalVideo.value
  
  try {
    // Generate token
    const token = await generateToken(user.name)
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Token received`, 'success')
    
    // Create room with media settings
    user.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      videoCaptureDefaults: {
        resolution: {
          width: 1280,
          height: 720,
          frameRate: 30
        }
      },
      audioCaptureDefaults: {
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true
      }
    })
    
    // Setup event handlers
    setupRoomEvents(user.room, userType)
    
    // Connect to room
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Connecting...`, 'info')
    await user.room.connect(LIVEKIT_WS_URL, token)
    
    user.connected = true
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Connected successfully!`, 'success')
    
    // Enable camera and microphone
    try {
      await user.room.localParticipant.enableCameraAndMicrophone()
      
      // Attach local video
      const videoPublications = Array.from(user.room.localParticipant.videoTrackPublications.values())
      if (videoPublications.length > 0 && videoPublications[0].track) {
        videoPublications[0].track.attach(videoElement)
        addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Camera attached`, 'success')
      }
      
      // Update participants list
      updateParticipantsList(userType)
      
      // Start speaking detection
      startSpeakingDetection(user.room, userType)
      
    } catch (mediaError) {
      addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Media error: ${mediaError.message}`, 'warning')
    }
    
  } catch (error) {
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} - Connection failed: ${error.message}`, 'error')
    user.room = null
    throw error
  }
}

const setupRoomEvents = (room, userType) => {
  const user = userType === 'agent' ? agent.value : customer.value
  const remoteVideoElement = userType === 'agent' ? agentRemoteVideo.value : customerRemoteVideo.value
  
  room.on('participantConnected', (participant) => {
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} sees: ${participant.identity} joined`, 'success')
    updateParticipantsList(userType)
    
    // Listen for tracks from new participant
    participant.on('trackSubscribed', (track, publication) => {
      if (track.kind === 'video') {
        addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} received video from ${participant.identity}`, 'info')
        
        // Attach remote video
        if (remoteVideoElement && track) {
          track.attach(remoteVideoElement)
        }
      } else if (track.kind === 'audio') {
        addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} received audio from ${participant.identity}`, 'info')
        // Audio plays automatically
      }
    })
    
    participant.on('trackUnsubscribed', (track, publication) => {
      addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} lost ${track.kind} from ${participant.identity}`, 'warning')
    })
  })
  
  room.on('participantDisconnected', (participant) => {
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} sees: ${participant.identity} left`, 'warning')
    updateParticipantsList(userType)
  })
  
  room.on('trackSubscribed', (track, publication, participant) => {
    if (track.kind === 'video') {
      addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} subscribed to ${participant.identity}'s video`, 'info')
      
      // Attach remote video
      if (remoteVideoElement && track) {
        track.attach(remoteVideoElement)
      }
    }
  })
  
  room.on('localTrackPublished', (publication) => {
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} published ${publication.kind}`, 'info')
  })
  
  room.on('disconnected', () => {
    addLog(`${userType === 'agent' ? '👨‍💼' : '👤'} ${user.name} disconnected`, 'warning')
    if (userType === 'agent') {
      agent.value.connected = false
      agentParticipants.value = []
    } else {
      customer.value.connected = false
      customerParticipants.value = []
    }
  })
}

const updateParticipantsList = (userType) => {
  const room = userType === 'agent' ? agent.value.room : customer.value.room
  const participantsArray = userType === 'agent' ? agentParticipants : customerParticipants
  
  if (room && room.participants) {
    const participantsList = []
    for (const participant of room.participants.values()) {
      participantsList.push({
        identity: participant.identity,
        sid: participant.sid,
        isSpeaking: participant.isSpeaking
      })
    }
    participantsArray.value = participantsList
  }
}

const startSpeakingDetection = (room, userType) => {
  const user = userType === 'agent' ? agent.value : customer.value
  
  // Monitor local participant
  room.localParticipant.on('isSpeakingChanged', (speaking) => {
    user.speaking = speaking
  })
  
  // Monitor remote participants
  room.participants.forEach(participant => {
    participant.on('isSpeakingChanged', (speaking) => {
      updateParticipantsList(userType)
    })
  })
}

// Connection Functions
const connectAgent = async () => {
  if (agent.value.connecting || agent.value.connected) return
  
  agent.value.connecting = true
  try {
    await setupRoomWithMedia('agent')
  } catch (error) {
    // Error already logged
  } finally {
    agent.value.connecting = false
  }
}

const connectCustomer = async () => {
  if (customer.value.connecting || customer.value.connected) return
  
  customer.value.connecting = true
  try {
    await setupRoomWithMedia('customer')
  } catch (error) {
    // Error already logged
  } finally {
    customer.value.connecting = false
  }
}

// Media Controls
const toggleAgentVideo = async () => {
  if (!agent.value.room) return
  
  try {
    agent.value.videoEnabled = !agent.value.videoEnabled
    await agent.value.room.localParticipant.setCameraEnabled(agent.value.videoEnabled)
    
    addLog(`Agent video ${agent.value.videoEnabled ? 'enabled' : 'disabled'}`, 'info')
  } catch (error) {
    addLog(`Failed to toggle agent video: ${error.message}`, 'error')
  }
}

const toggleAgentAudio = async () => {
  if (!agent.value.room) return
  
  try {
    agent.value.audioEnabled = !agent.value.audioEnabled
    await agent.value.room.localParticipant.setMicrophoneEnabled(agent.value.audioEnabled)
    
    addLog(`Agent audio ${agent.value.audioEnabled ? 'enabled' : 'disabled'}`, 'info')
  } catch (error) {
    addLog(`Failed to toggle agent audio: ${error.message}`, 'error')
  }
}

const toggleCustomerVideo = async () => {
  if (!customer.value.room) return
  
  try {
    customer.value.videoEnabled = !customer.value.videoEnabled
    await customer.value.room.localParticipant.setCameraEnabled(customer.value.videoEnabled)
    
    addLog(`Customer video ${customer.value.videoEnabled ? 'enabled' : 'disabled'}`, 'info')
  } catch (error) {
    addLog(`Failed to toggle customer video: ${error.message}`, 'error')
  }
}

const toggleCustomerAudio = async () => {
  if (!customer.value.room) return
  
  try {
    customer.value.audioEnabled = !customer.value.audioEnabled
    await customer.value.room.localParticipant.setMicrophoneEnabled(customer.value.audioEnabled)
    
    addLog(`Customer audio ${customer.value.audioEnabled ? 'enabled' : 'disabled'}`, 'info')
  } catch (error) {
    addLog(`Failed to toggle customer audio: ${error.message}`, 'error')
  }
}

// Disconnect Functions
const disconnectAgent = () => {
  if (agent.value.room) {
    agent.value.room.disconnect()
    agent.value.room = null
    agent.value.connected = false
    agentParticipants.value = []
    addLog('Agent disconnected', 'warning')
  }
}

const disconnectCustomer = () => {
  if (customer.value.room) {
    customer.value.room.disconnect()
    customer.value.room = null
    customer.value.connected = false
    customerParticipants.value = []
    addLog('Customer disconnected', 'warning')
  }
}

const endAllCalls = () => {
  disconnectAgent()
  disconnectCustomer()
  addLog('All calls ended', 'info')
}

// Audio Test
const testAudio = () => {
  const audioContext = new (window.AudioContext || window.webkitAudioContext)()
  const oscillator = audioContext.createOscillator()
  const gainNode = audioContext.createGain()
  
  oscillator.connect(gainNode)
  gainNode.connect(audioContext.destination)
  
  oscillator.frequency.value = 440
  oscillator.type = 'sine'
  
  gainNode.gain.setValueAtTime(0.1, audioContext.currentTime)
  gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5)
  
  oscillator.start(audioContext.currentTime)
  oscillator.stop(audioContext.currentTime + 0.5)
  
  addLog('Audio test played (440Hz tone)', 'info')
}

// Cleanup
onUnmounted(() => {
  if (agent.value.room) agent.value.room.disconnect()
  if (customer.value.room) customer.value.room.disconnect()
})
</script>

<style scoped>
.aspect-video {
  aspect-ratio: 16 / 9;
}

/* Custom scrollbar */
::-webkit-scrollbar {
  width: 8px;
}

::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb {
  background: rgba(255, 255, 255, 0.3);
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: rgba(255, 255, 255, 0.5);
}

/* Animations */
.animate-pulse {
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>