import { Alert } from 'react-native'

/** Confirmação destrutiva padrão (equivalente ao window.confirm da web). */
export function confirmDelete(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ])
}

/**
 * Remover um fixo: "Encerrar" (padrão, preserva histórico) vs "Excluir definitivamente"
 * (destrutivo, com uma segunda confirmação por remover todo o histórico junto).
 */
export function confirmEndOrDelete(name: string, onEnd: () => void, onDelete: () => void) {
  Alert.alert(`Remover "${name}"`, 'Encerrar mantém todo o histórico e só para de gerar o fixo dali em diante. Excluir definitivamente apaga tudo.', [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir definitivamente', style: 'destructive', onPress: () => confirmHardDelete(name, onDelete) },
    { text: 'Encerrar', onPress: onEnd },
  ])
}

function confirmHardDelete(name: string, onConfirm: () => void) {
  Alert.alert(
    'Excluir definitivamente?',
    `Isso remove "${name}" e todo o histórico de valores e pagamentos junto. Não pode ser desfeito.`,
    [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir definitivamente', style: 'destructive', onPress: onConfirm },
    ],
  )
}
