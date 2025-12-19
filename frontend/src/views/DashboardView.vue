<template>
  <div class="dashboard-page page">
    <div class="container">
      <header class="page-header">
        <div class="header-content">
          <h1 class="page-title">Docker Compose Files</h1>
          <p class="page-subtitle">
            Manage and control your Docker Compose configurations
          </p>
        </div>
        <button 
          @click="refreshFiles" 
          class="btn btn-primary"
          :disabled="loading"
        >
          <span v-if="loading" class="spinner"></span>
          <span v-else>🔄</span>
          Refresh
        </button>
      </header>

      <!-- Loading state -->
      <div v-if="loading && !files.length" class="loading-state">
        <div class="spinner" style="width: 40px; height: 40px;"></div>
        <p>Scanning for Docker Compose files...</p>
      </div>

      <!-- Error state -->
      <div v-else-if="error" class="alert alert-error">
        {{ error }}
        <button @click="fetchFiles" class="btn btn-ghost btn-sm" style="margin-left: auto;">
          Retry
        </button>
      </div>

      <!-- Empty state -->
      <div v-else-if="!loading && !files.length" class="empty-state">
        <div class="empty-state-icon">📁</div>
        <h3 class="empty-state-title">No Docker Compose Files Found</h3>
        <p class="empty-state-text">
          No docker-compose.yml files were found in the configured scan directories.
          <br>Check your backend configuration.
        </p>
      </div>

      <!-- Files grid -->
      <div v-else class="files-grid grid grid-cols-2">
        <ComposeCard
          v-for="file in files"
          :key="file.id"
          :file="file"
          class="fade-in"
        />
      </div>

      <!-- Stats bar -->
      <div v-if="files.length" class="stats-bar">
        <span class="stat">
          Found <strong>{{ files.length }}</strong> compose files
        </span>
        <span v-if="lastScan" class="stat text-muted">
          Last scan: {{ formatDate(lastScan) }}
        </span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { composeApi } from '../services/api'
import ComposeCard from '../components/ComposeCard.vue'

const files = ref([])
const loading = ref(false)
const error = ref('')
const lastScan = ref(null)

const fetchFiles = async (refresh = false) => {
  loading.value = true
  error.value = ''

  try {
    const response = await composeApi.getFiles(refresh)
    files.value = response.data.files
    lastScan.value = response.data.lastScan
  } catch (err) {
    error.value = err.response?.data?.error || 'Failed to fetch compose files'
  } finally {
    loading.value = false
  }
}

const refreshFiles = () => {
  fetchFiles(true)
}

const formatDate = (timestamp) => {
  return new Date(timestamp).toLocaleString()
}

onMounted(() => {
  fetchFiles()
})
</script>

<style scoped>
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--spacing-lg);
  flex-wrap: wrap;
}

.header-content {
  flex: 1;
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

.files-grid {
  margin-bottom: var(--spacing-xl);
}

.stats-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--spacing-md);
  background: var(--bg-card);
  border-radius: var(--radius-md);
  border: 1px solid var(--border-color);
  font-size: var(--font-size-sm);
}

.stat strong {
  color: var(--color-primary);
}

@media (max-width: 640px) {
  .page-header {
    flex-direction: column;
  }

  .stats-bar {
    flex-direction: column;
    gap: var(--spacing-sm);
    text-align: center;
  }
}
</style>
