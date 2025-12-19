<template>
  <div class="login-page">
    <div class="login-container">
      <div class="login-card">
        <div class="login-header">
          <span class="login-icon">🐳</span>
          <h1 class="login-title">Docker Dashboard</h1>
          <p class="login-subtitle">Sign in to manage your Docker Compose files</p>
        </div>

        <form @submit.prevent="handleLogin" class="login-form">
          <div v-if="error" class="alert alert-error">
            {{ error }}
          </div>

          <div class="form-group">
            <label for="username" class="form-label">Username</label>
            <input
              type="text"
              id="username"
              v-model="username"
              class="form-input"
              placeholder="Enter your username"
              required
              autocomplete="username"
            />
          </div>

          <div class="form-group">
            <label for="password" class="form-label">Password</label>
            <input
              type="password"
              id="password"
              v-model="password"
              class="form-input"
              placeholder="Enter your password"
              required
              autocomplete="current-password"
            />
          </div>

          <button 
            type="submit" 
            class="btn btn-primary btn-lg login-btn"
            :disabled="loading"
          >
            <span v-if="loading" class="spinner"></span>
            <span v-else>Sign In</span>
          </button>
        </form>

        <div class="login-footer">
          <p class="hint">
            Default credentials: <code>admin</code> / <code>admin123</code>
          </p>
        </div>
      </div>
    </div>

    <!-- Background decoration -->
    <div class="bg-decoration">
      <div class="circle circle-1"></div>
      <div class="circle circle-2"></div>
      <div class="circle circle-3"></div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '../stores/auth'

const router = useRouter()
const authStore = useAuthStore()

const username = ref('')
const password = ref('')
const loading = ref(false)
const error = ref('')

const handleLogin = async () => {
  error.value = ''
  loading.value = true

  const success = await authStore.login(username.value, password.value)

  if (success) {
    router.push('/')
  } else {
    error.value = authStore.error || 'Login failed. Please try again.'
  }

  loading.value = false
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
  padding: var(--spacing-lg);
}

.login-container {
  position: relative;
  z-index: 10;
  width: 100%;
  max-width: 420px;
}

.login-card {
  background: var(--bg-card);
  border: 1px solid var(--border-color);
  border-radius: var(--radius-xl);
  padding: var(--spacing-2xl);
  box-shadow: var(--shadow-lg);
  backdrop-filter: blur(20px);
}

.login-header {
  text-align: center;
  margin-bottom: var(--spacing-xl);
}

.login-icon {
  font-size: 3rem;
  display: block;
  margin-bottom: var(--spacing-md);
}

.login-title {
  font-size: var(--font-size-2xl);
  font-weight: 700;
  background: linear-gradient(135deg, var(--text-primary), var(--color-primary));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
}

.login-subtitle {
  font-size: var(--font-size-sm);
  color: var(--text-muted);
}

.login-form {
  margin-bottom: var(--spacing-lg);
}

.login-btn {
  width: 100%;
  margin-top: var(--spacing-md);
}

.login-footer {
  text-align: center;
  padding-top: var(--spacing-md);
  border-top: 1px solid var(--border-light);
}

.hint {
  font-size: var(--font-size-xs);
  color: var(--text-muted);
}

.hint code {
  background: var(--bg-input);
  padding: 2px 6px;
  border-radius: var(--radius-sm);
  color: var(--color-primary);
}

/* Background decoration */
.bg-decoration {
  position: fixed;
  inset: 0;
  pointer-events: none;
  overflow: hidden;
}

.circle {
  position: absolute;
  border-radius: 50%;
  opacity: 0.1;
}

.circle-1 {
  width: 600px;
  height: 600px;
  background: var(--color-primary);
  top: -200px;
  right: -200px;
  animation: float 15s ease-in-out infinite;
}

.circle-2 {
  width: 400px;
  height: 400px;
  background: var(--color-secondary);
  bottom: -100px;
  left: -100px;
  animation: float 20s ease-in-out infinite reverse;
}

.circle-3 {
  width: 200px;
  height: 200px;
  background: var(--color-primary);
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  animation: pulse 5s ease-in-out infinite;
}

@keyframes float {
  0%, 100% {
    transform: translate(0, 0);
  }
  50% {
    transform: translate(-30px, 30px);
  }
}
</style>
