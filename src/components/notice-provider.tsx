import { createContext, useContext, useState, type ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { X } from 'lucide-react'
import { Button } from './ui/button'

const NoticeContext = createContext<(title: string, description?: string) => void>(() => {})

export function NoticeProvider({ children }: { children: ReactNode }) {
	const [notice, setNotice] = useState<{ title: string; description: string } | null>(null)
	return (
		<NoticeContext.Provider
			value={(
				title,
				description = 'Esta funcionalidade ainda está em desenvolvimento nesta demonstração.',
			) => setNotice({ title, description })}
		>
			{children}
			<Dialog.Root
				open={!!notice}
				onOpenChange={(open) => {
					if (!open) setNotice(null)
				}}
			>
				<Dialog.Portal>
					<Dialog.Overlay className="fixed inset-0 z-50 bg-background/80" />
					<Dialog.Content className="fixed top-1/2 left-1/2 z-50 w-[min(500px,calc(100%-32px))] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-stroke bg-surface p-8 shadow-xl">
						<Dialog.Title className="text-lg font-bold">{notice?.title}</Dialog.Title>
						<Dialog.Description className="mt-4 text-sm leading-6 text-text-secondary">
							{notice?.description}
						</Dialog.Description>
						<Dialog.Close asChild>
							<Button variant="outline" className="mt-6">
								Entendi
							</Button>
						</Dialog.Close>
						<Dialog.Close aria-label="Fechar" className="absolute top-3 right-3 text-primary">
							<X size={18} />
						</Dialog.Close>
					</Dialog.Content>
				</Dialog.Portal>
			</Dialog.Root>
		</NoticeContext.Provider>
	)
}

export function useNotice() {
	return useContext(NoticeContext)
}
