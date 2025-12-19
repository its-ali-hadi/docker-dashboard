<template>
  <div class="details-page page">
    <div class="container">
      <!-- Back button -->
      <router-link to="/" class="back-link">
        ← Back to Dashboard
      </router-link>

      <!-- Loading state -->
      <div v-if="loading" class="loading-state">
        <div class="spinner" style="width: 40px; height: 40px;"></div>
        <p>Loading file details...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-error">
        {{ error }}
        <router-link to="/" class="btn btn-ghost btn-sm" style="margin-left: auto;">
          Go Back
        </router-link>
      </div>

      <!-- File details -->
      <template v-else-if="fileData">
        <header class="page-header">
          <div class="header-content">
            <h1 class="page-title">{{ fileData.file.name }}</h1>
            <p class="page-subtitle file-path">{{ fileData.file.path }}</p>
          </div>
          <div class="header-actions">
            <button 
              @click="executeCommand('up')" 
              :disabled="executing"
              class="btn btn-success"
            >
              <span v-if="executingCommand === 'up'" class="spinner"></span>
              ▶ Up
            </button>
            <button 
              @click="executeCommand('down')" 
              :disabled="executing"
              class="btn btn-danger"
            >
              <span v-if="executingCommand === 'down'" class="spinner"></span>
              ⏹ Down
            </button>
            <button 
              @click="executeCommand('build')" 
              :disabled="executing"
              class="btn btn-warning"
            >
              <span v-if="executingCommand === 'build'" class="spinner"></span>
              🔨 Build
            </button>
          </div>
        </header>

        <!-- Command output -->
        <div v-if="commandResult" class="command-result card">
          <div class="card-header">
            <span :class="['status-dot', commandResult.success ? 'running' : 'error']"></span>
            <span class="card-title">Command Output</span>
            <button @click="commandResult = null" class="btn btn-ghost btn-sm">
              Close
            </button>
          </div>
          <pre class="code-block">{{ commandResult.stdout || commandResult.stderr || 'No output' }}</pre>
        </div>

        <!-- Overview cards -->
        <div class="overview-cards grid grid-cols-3">
          <div class="overview-card card">
            <div class="overview-value">{{ fileData.details.services.length }}</div>
            <div class="overview-label">Services</div>
          </div>
          <div class="overview-card card">
            <div class="overview-value">{{ fileData.details.networks.length }}</div>
            <div class="overview-label">Networks</div>
          </div>
          <div class="overview-card card">
            <div class="overview-value">{{ fileData.details.volumes.length }}</div>
            <div class="overview-label">Volumes</div>
          </div>
        </div>

        <!-- Services section -->
        <section class="services-section">
          <div class="section-header">
            <h2 class="section-title">Services</h2>
            <button @click="refreshStatus" :disabled="refreshingStatus" class="btn btn-ghost btn-sm">
              <span v-if="refreshingStatus" class="spinner"></span>
              🔄 Refresh Status
            </button>
          </div>
          <div class="services-grid grid grid-cols-2">
            <ServiceDetails
              v-for="service in fileData.details.services"
              :key="service.name"
              :service="service"
              :status="getServiceStatus(service.name)"
              class="fade-in"
            />
          </div>
        </section>

        <!-- Networks section -->
        <section v-if="fileData.details.networks.length" class="networks-section">
          <h2 class="section-title">Networks</h2>
          <div class="badge-list">
            <span v-for="network in fileData.details.networks" :key="network" class="badge badge-primary">
              {{ network }}
            </span>
          </div>
        </section>

        <!-- Volumes section -->
        <section v-if="fileData.details.volumes.length" class="volumes-section">
          <h2 class="section-title">Named Volumes</h2>
          <div class="badge-list">
            <span v-for="volume in fileData.details.volumes" :key="volume" class="badge">
              {{ volume }}
            </span>
          </div>
        </section>

        <!-- Raw YAML section -->
        <section class="raw-section">
          <div class="section-header">
            <h2 class="section-title">Raw YAML</h2>
            <button @click="showRaw = !showRaw" class="btn btn-ghost btn-sm">
              {{ showRaw ? 'Hide' : 'Show' }}
            </button>
          </div>
          <pre v-if="showRaw" class="code-block raw-yaml">{{ fileData.details.raw }}</pre>
        </section>
      </template>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { composeApi } from '../services/api'
import ServiceDetails from '../components/ServiceDetails.vue'

const route = useRoute()

const fileData = ref(null)
const statusData = ref(null)
const loading = ref(false)
const error = ref('')
const showRaw = ref(false)

const executing = ref(false)
const executingCommand = ref(null)
const commandResult = ref(null)
const refreshingStatus = ref(false)

const fetchDetails = async () => {
  loading.value = true
  error.value = ''

  try {
    const response = await composeApi.getFileDetails(route.params.id)
    fileData.value = response.data
    statusData.value = response.data.status || null
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to load file details'
  } finally {
    loading.value = false
  }
}

const executeCommand = async (command) => {
  executing.value = true
  executingCommand.value = command
  commandResult.value = null

  try {
    const response = await composeApi.executeCommand(route.params.id, command)
    commandResult.value = response.data.result
    // Refresh status after command execution
    await refreshStatus()
  } catch (err) {
    commandResult.value = {
      success: false,
      command: `docker-compose ${command}`,
      stderr: err.response?.data?.error || err.message
    }
  } finally {
    executing.value = false
    executingCommand.value = null
  }
}

const refreshStatus = async () => {
  refreshingStatus.value = true
  try {
    const response = await composeApi.getStatus(route.params.id)
    statusData.value = response.data.status
  } catch (err) {
    console.error('Failed to refresh status:', err)
  } finally {
    refreshingStatus.value = false
  }
}

const getServiceStatus = (serviceName) => {
  if (!statusData.value?.services) return null
  return statusData.value.services[serviceName] || null
}

onMounted(() => {
  fetchDetails()
})
</script>

<style scoped>
.back-link {
  display: inline-flex;
  align-items: center;
  gap: var(--spacing-xs);
  margin-bottom: var(--spacing-lg);
  color: var(--text-secondary);
  font-size: var(--font-size-sm);
  transition: color var(--transition-fast);
}

.back-link:hover {
  color: var(--color-primary);
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-2xl);
  gap: var(--spacing-md);
  color: var(--text-muted);
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
  margin-bottom: var(--spacing-xl);
}

.file-path {
  font-family: 'Fira Code', monospace;
  word-break: break-all;
}

.header-actions {
  display: flex;
  gap: var(--spacing-sm);
  flex-wrap: wrap;
}

.command-result {
  margin-bottom: var(--spacing-xl);
}

.overview-cards {
  margin-bottom: var(--spacing-xl);
}

.overview-card {
  text-align: center;
  padding: var(--spacing-lg);
}

.overview-value {
  font-size: var(--font-size-3xl);
  font-weight: 700;
  color: var(--color-primary);
  margin-bottom: var(--spacing-xs);
}

.overview-label {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.section-title {
  font-size: var(--font-size-xl);
  font-weight: 600;
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.services-section,
.networks-section,
.volumes-section,
.raw-section {
  margin-bottom: var(--spacing-xl);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-lg);
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-sm);
}

.raw-yaml {
  max-height: 400px;
}

@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
  }

  .header-actions {
    width: 100%;
  }

  .header-actions .btn {
    flex: 1;
  }
}
</style>
