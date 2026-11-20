import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/fonts.css'
import './index.css'
import App from './App.tsx'

const root = createRoot(document.getElementById('root')!)
/** Dev only: `?reel=<concept id>` renders a single logo reel for scripts/export-reels.mjs. */
const reelId = import.meta.env.DEV ? new URLSearchParams(location.search).get('reel') : null

if (reelId) {
  import('./kit/reel/ReelExport').then(({ ReelExport }) => root.render(<ReelExport id={reelId} />))
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
}
