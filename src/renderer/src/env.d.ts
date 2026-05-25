/// <reference types="vite/client" />

interface DesktopInfo {
  platform: string
}

interface Window {
  desktopInfo: DesktopInfo
}
