import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'node:child_process'

const formatBrasiliaDateTime = (dateValue) =>
  new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).format(dateValue)

const getLastUpdateBrasilia = () => {
  try {
    const lastCommitIso = execSync('git log -1 --format=%cI', { encoding: 'utf8' }).trim()
    return formatBrasiliaDateTime(new Date(lastCommitIso))
  } catch {
    return formatBrasiliaDateTime(new Date())
  }
}

const LAST_UPDATE_BRASILIA = getLastUpdateBrasilia()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/escala-de-plantao/',
  define: {
    'import.meta.env.VITE_LAST_UPDATE_BRASILIA': JSON.stringify(LAST_UPDATE_BRASILIA),
  },
})
