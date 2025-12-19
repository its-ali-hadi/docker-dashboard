<template>
  <div class="service-card">
    <div class="service-header">
      <div class="service-icon">
        <span v-if="service.image">🐳</span>
        <span v-else>🔨</span>
      </div>
      <div class="service-info">
        <h4 class="service-name">{{ service.name }}</h4>
        <p class="service-image" v-if="service.image">{{ service.image }}</p>
        <p class="service-build" v-else-if="service.build">
          Build: {{ typeof service.build === 'string' ? service.build : service.build.context }}
        </p>
      </div>
    </div>

    <div class="service-details">
      <!-- Ports -->
      <div v-if="service.ports?.length" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">🔌</span> Ports
        </h5>
        <div class="badge-list">
          <span v-for="port in service.ports" :key="port" class="badge badge-primary">
            {{ port }}
          </span>
        </div>
      </div>

      <!-- Volumes -->
      <div v-if="service.volumes?.length" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">💾</span> Volumes
        </h5>
        <ul class="volume-list">
          <li v-for="volume in service.volumes" :key="volume" class="volume-item">
            {{ volume }}
          </li>
        </ul>
      </div>

      <!-- Environment -->
      <div v-if="service.environment?.length" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">⚙️</span> Environment
        </h5>
        <ul class="env-list">
          <li v-for="env in displayEnv" :key="env" class="env-item">
            <code>{{ env }}</code>
          </li>
        </ul>
        <button 
          v-if="service.environment.length > 3" 
          @click="showAllEnv = !showAllEnv"
          class="expand-btn"
        >
          {{ showAllEnv ? 'Show Less' : `Show ${service.environment.length - 3} More` }}
        </button>
      </div>

      <!-- Dependencies -->
      <div v-if="service.depends_on?.length" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">🔗</span> Depends On
        </h5>
        <div class="badge-list">
          <span v-for="dep in service.depends_on" :key="dep" class="badge">
            {{ typeof dep === 'string' ? dep : Object.keys(dep)[0] }}
          </span>
        </div>
      </div>

      <!-- Command -->
      <div v-if="service.command" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">💻</span> Command
        </h5>
        <code class="code">{{ formatCommand(service.command) }}</code>
      </div>

      <!-- Restart Policy -->
      <div v-if="service.restart" class="detail-section">
        <h5 class="detail-title">
          <span class="detail-icon">🔄</span> Restart
        </h5>
        <span class="badge">{{ service.restart }}</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'

const props = defineProps({
  service: {
    type: Object,
    required: true
  }
})

const showAllEnv = ref(false)

const displayEnv = computed(() => {
  if (showAllEnv.value || props.service.environment?.length <= 3) {
    return props.service.environment || []
  }
  return props.service.environment?.slice(0, 3) || []
})

const formatCommand = (cmd) => {
  if (Array.isArray(cmd)) {
    return cmd.join(' ')
  }
  return cmd
}
</script>

<style scoped>
.service-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  transition: all var(--transition-normal);
}

.service-card:hover {
  border-color: var(--color-primary);
  box-shadow: var(--shadow-glow);
}

.service-header {
  display: flex;
  align-items: flex-start;
  gap: var(--spacing-md);
  margin-bottom: var(--spacing-lg);
  padding-bottom: var(--spacing-md);
  border-bottom: 1px solid var(--border-light);
}

.service-icon {
  font-size: 1.5rem;
}

.service-info {
  flex: 1;
  min-width: 0;
}

.service-name {
  font-size: var(--font-size-lg);
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: var(--spacing-xs);
}

.service-image,
.service-build {
  font-size: var(--font-size-sm);
  color: var(--color-primary);
  font-family: 'Fira Code', monospace;
  word-break: break-all;
}

.service-details {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.detail-section {
  padding: var(--spacing-sm) 0;
}

.detail-title {
  display: flex;
  align-items: center;
  gap: var(--spacing-xs);
  font-size: var(--font-size-sm);
  font-weight: 500;
  color: var(--text-secondary);
  margin-bottom: var(--spacing-sm);
}

.detail-icon {
  font-size: 0.875rem;
}

.badge-list {
  display: flex;
  flex-wrap: wrap;
  gap: var(--spacing-xs);
}

.volume-list,
.env-list {
  list-style: none;
  font-size: var(--font-size-sm);
}

.volume-item,
.env-item {
  padding: var(--spacing-xs) 0;
  color: var(--text-secondary);
  word-break: break-all;
}

.volume-item::before {
  content: '→ ';
  color: var(--text-muted);
}

.env-item code {
  font-size: var(--font-size-xs);
  background: var(--bg-input);
  padding: var(--spacing-xs) var(--spacing-sm);
  border-radius: var(--radius-sm);
  display: inline-block;
}

.expand-btn {
  background: none;
  border: none;
  color: var(--color-primary);
  font-size: var(--font-size-sm);
  cursor: pointer;
  padding: var(--spacing-xs) 0;
  margin-top: var(--spacing-xs);
}

.expand-btn:hover {
  text-decoration: underline;
}
</style>
