<template>
  <div class="compose-card card" :class="{ executing: isExecuting }">
    <div class="card-header">
      <div class="file-info">
        <span class="file-icon">📄</span>
        <div class="file-details">
          <div class="file-name-row">
            <h3 class="file-name">{{ file.name }}</h3>
            <span 
              v-if="status" 
              :class="['status-badge', statusClass]"
              :title="`${status.summary.running}/${status.summary.total} containers running`"
            >
              <span class="status-dot"></span>
              {{ status.summary.running }}/{{ status.summary.total }}
            </span>
          </div>
          <p class="file-path">{{ file.directory }}</p>
        </div>
      </div>
      <router-link :to="`/details/${file.id}`" class="btn btn-ghost btn-sm">
        View Details
      </router-link>
    </div>

    <div class="card-body">
      <div class="file-meta">
        <span class="meta-item">
          <span class="meta-label">Size:</span>
          <span class="meta-value">{{ formatSize(file.size) }}</span>
        </span>
        <span class="meta-item">
          <span class="meta-label">Modified:</span>
          <span class="meta-value">{{ formatDate(file.modified) }}</span>
        </span>
      </div>
    </div>

    <div class="card-footer">
      <button 
        @click="executeCommand('up')" 
        :disabled="isExecuting"
        class="btn btn-success btn-sm"
      >
        <span v-if="executingCommand === 'up'" class="spinner"></span>
        <span v-else>▶</span>
        Up
      </button>
      <button 
        @click="executeCommand('down')" 
        :disabled="isExecuting"
        class="btn btn-danger btn-sm"
      >
        <span v-if="executingCommand === 'down'" class="spinner"></span>
        <span v-else>⏹</span>
        Down
      </button>
      <button 
        @click="executeCommand('build')" 
        :disabled="isExecuting"
        class="btn btn-warning btn-sm"
      >
        <span v-if="executingCommand === 'build'" class="spinner"></span>
        <span v-else>🔨</span>
        Build
      </button>
    </div>

    <!-- Command Output -->
    <div v-if="commandResult" class="command-output">
      <div class="output-header">
        <span :class="['status-dot', commandResult.success ? 'running' : 'error']"></span>
        <span class="output-title">{{ commandResult.command }}</span>
        <button @click="commandResult = null" class="close-btn">×</button>
      </div>
      <pre class="code-block">{{ commandResult.stdout || commandResult.stderr || 'No output' }}</pre>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { composeApi } from '../services/api'

const props = defineProps({
  file: {
    type: Object,
    required: true
  }
})

const isExecuting = ref(false)
const executingCommand = ref(null)
const commandResult = ref(null)
const status = ref(null)

const statusClass = computed(() => {
  if (!status.value) return ''
  const { running, total } = status.value.summary
  if (total === 0) return 'status-unknown'
  if (running === total) return 'status-running'
  if (running === 0) return 'status-stopped'
  return 'status-partial'
})

const formatSize = (bytes) => {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

const formatDate = (date) => {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const fetchStatus = async () => {
  try {
    const response = await composeApi.getStatus(props.file.id)
    status.value = response.data.status
  } catch (err) {
    // Status fetch failed, leave as null
  }
}

const executeCommand = async (command) => {
  isExecuting.value = true
  executingCommand.value = command
  commandResult.value = null

  try {
    const response = await composeApi.executeCommand(props.file.id, command)
    commandResult.value = response.data.result
    // Refresh status after command
    await fetchStatus()
  } catch (err) {
    commandResult.value = {
      success: false,
      command: `docker-compose ${command}`,
      stderr: err.response?.data?.error || err.message
    }
  } finally {
    isExecuting.value = false
    executingCommand.value = null
  }
}

onMounted(() => {
  fetchStatus()
})
</script>

<style scoped>
.compose-card {
  transition: all var(--transition-normal);
}

.compose-card.executing {
  border-color: var(--color-warning);
}

.file-info {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
}

.file-icon {
  font-size: 1.5rem;
}

.file-details {
  flex: 1;
  min-width: 0;
}

.file-name-row {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xs);
}

.file-name {
  font-size: var(--font-size-base);
  font-weight: 600;
  color: var(--text-primary);
}

.status-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  font-size: var(--font-size-xs);
  font-weight: 600;
}

.status-badge .status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-running {
  background: rgba(16, 185, 129, 0.15);
  color: #10b981;
}

.status-running .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.status-stopped {
  background: rgba(107, 114, 128, 0.15);
  color: #6b7280;
}

.status-stopped .status-dot {
  background: #6b7280;
}

.status-partial {
  background: rgba(245, 158, 11, 0.15);
  color: #f59e0b;
}

.status-partial .status-dot {
  background: #f59e0b;
}

.status-unknown {
  background: rgba(107, 114, 128, 0.1);
  color: #9ca3af;
}

.status-unknown .status-dot {
  background: #9ca3af;
}

.file-path {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  word-break: break-all;
}

.file-meta {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-lg);
}

.meta-item {
  display: flex;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
}

.meta-label {
  color: var(--text-muted);
}

.meta-value {
  color: var(--text-secondary);
}

.command-output {
  margin-top: var(--spacing-md);
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
  animation: fadeIn 0.3s ease;
}

.output-header {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm);
  margin-bottom: var(--spacing-sm);
}

.output-title {
  flex: 1;
  font-size: var(--font-size-sm);
  font-family: 'Fira Code', monospace;
  color: var(--text-secondary);
}

.close-btn {
  background: none;
  border: none;
  color: var(--text-muted);
  font-size: 1.25rem;
  cursor: pointer;
  padding: 0;
  line-height: 1;
}

.close-btn:hover {
  color: var(--text-primary);
}
</style>
