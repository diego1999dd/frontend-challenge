import type { ReactNode } from 'react'
import { Dialog } from 'radix-ui'
import { Button } from '@/components/ui/button'
import { useMobile } from '@/lib/use-mobile'

export function CollectorPanel({
	children,
	open,
	onOpenChange,
}: {
	children: ReactNode
	open: boolean
	onOpenChange: (open: boolean) => void
}) {
	const mobile = useMobile()
	if (!mobile) return children
	return (
		<Dialog.Root open={open} onOpenChange={onOpenChange}>
			<Dialog.Trigger asChild>
				<Button type="button" variant="link" className="collector-mobile-trigger">
					Dados do colecionador
				</Button>
			</Dialog.Trigger>
			<Dialog.Portal>
				<Dialog.Overlay className="flow-overlay" />
				<Dialog.Content className="flow-dialog collector-mobile-dialog">
					<Dialog.Title>Dados do colecionador</Dialog.Title>
					<Dialog.Description>Confira o nome e o e-mail para o recibo simulado.</Dialog.Description>
					{children}
					<Dialog.Close>Voltar ao pagamento</Dialog.Close>
				</Dialog.Content>
			</Dialog.Portal>
		</Dialog.Root>
	)
}
