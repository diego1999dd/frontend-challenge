import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './styles/global.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <main className="mx-auto max-w-5xl p-8">
      <h1 className="text-2xl font-bold">Kurio — NFT Marketplace</h1>
      <p className="mt-4">Base React, TypeScript e Tailwind do desafio frontend.</p>
    </main>
  </StrictMode>,
)
