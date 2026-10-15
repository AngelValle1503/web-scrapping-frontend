import type { CapacitorConfig } from '@capacitor/cli'

const config: CapacitorConfig = {
  appId: 'com.angelvalle1503.webscrapping',
  appName: 'Web Scrapping',
  webDir: 'dist',
  server: {
    // Mantiene un origen HTTPS para que las solicitudes a la API remota funcionen
    // igual que en la versión web publicada.
    androidScheme: 'https',
  },
}

export default config
