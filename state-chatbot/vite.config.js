import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import net from 'node:net'
import { join } from 'node:path'
import process from 'node:process'

function findPythonCommand() {
  const localAppData = process.env.LOCALAPPDATA
  const localPython = localAppData
    ? join(localAppData, 'Programs', 'Python', 'Python312', 'python.exe')
    : null

  if (localPython && existsSync(localPython)) {
    return localPython
  }

  return process.platform === 'win32' ? 'python.exe' : 'python3'
}

function startPythonApi() {
  let apiProcess

  return {
    name: 'beacon-python-api',
    async configureServer(server) {
      if (await isPortOpen(8000)) {
        server.config.logger.info('Beacon API is already running on http://127.0.0.1:8000')
        return
      }

      apiProcess = spawn(findPythonCommand(), ['backend/server.py'], {
        cwd: process.cwd(),
        stdio: 'inherit',
        windowsHide: true,
      })

      apiProcess.on('error', (error) => {
        server.config.logger.error(`Beacon API failed to start: ${error.message}`)
      })

      server.httpServer?.once('close', () => {
        apiProcess?.kill()
      })
    },
  }
}

function isPortOpen(port) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host: '127.0.0.1', port })

    socket.once('connect', () => {
      socket.end()
      resolve(true)
    })

    socket.once('error', () => {
      resolve(false)
    })
  })
}

// https://vite.dev/config/
export default defineConfig(({ command }) => ({
  base: '/beacon',
  plugins: command === 'serve' ? [react(), startPythonApi()] : [react()],
  server: {
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
}))
