import { Alert } from 'react-native'

/** Confirmação destrutiva padrão (equivalente ao window.confirm da web). */
export function confirmDelete(title: string, message: string, onConfirm: () => void) {
  Alert.alert(title, message, [
    { text: 'Cancelar', style: 'cancel' },
    { text: 'Excluir', style: 'destructive', onPress: onConfirm },
  ])
}
