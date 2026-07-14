import { useState } from 'react'
import { Pressable, Text, TextInput, View } from 'react-native'
import { Ionicons } from '@expo/vector-icons'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { confirmDelete } from '@/lib/confirm'
import { Card } from './ui'

type Category = RouterOutputs['categories']['list'][number]

/** Card de categoria com CRUD de subcategorias (paridade com a web). */
export function CategoryBlock({ category }: { category: Category }) {
  const utils = trpc.useUtils()
  const invalidate = () => utils.categories.invalidate()
  const del = trpc.categories.delete.useMutation({ onSuccess: invalidate })
  const createSub = trpc.categories.createSub.useMutation({ onSuccess: invalidate })
  const delSub = trpc.categories.deleteSub.useMutation({ onSuccess: invalidate })

  const [adding, setAdding] = useState(false)
  const [subName, setSubName] = useState('')

  function submitSub() {
    const name = subName.trim()
    setSubName('')
    setAdding(false)
    if (name) createSub.mutate({ categoryId: category.id, name })
  }

  return (
    <Card className="mb-3">
      <View className="mb-2 flex-row items-center gap-2">
        <Text className="flex-1 text-sm font-bold text-foreground dark:text-foreground-dark">
          {category.name}
        </Text>
        {category.isSystem ? (
          <View className="rounded-full border border-line px-2 py-0.5 dark:border-line-dark">
            <Text className="text-[9px] font-bold uppercase text-muted dark:text-muted-dark">
              sistema
            </Text>
          </View>
        ) : (
          <Pressable
            accessibilityLabel={`Excluir categoria ${category.name}`}
            hitSlop={8}
            onPress={() =>
              confirmDelete(
                'Excluir categoria',
                `Excluir "${category.name}"? As subcategorias somem e as transações ficam sem categoria.`,
                () => del.mutate({ id: category.id }),
              )
            }
          >
            <Ionicons name="trash-outline" size={16} color="#9C9B9B" />
          </Pressable>
        )}
      </View>
      <View className="flex-row flex-wrap items-center gap-1.5">
        {category.subcategories.map((sub: Category['subcategories'][number]) => (
          <View
            key={sub.id}
            className="flex-row items-center gap-1 rounded-full border border-line bg-background px-2.5 py-1 dark:border-line-dark dark:bg-background-dark"
          >
            <Text className="text-[11px] text-body dark:text-body-dark">{sub.name}</Text>
            <Pressable
              accessibilityLabel={`Excluir subcategoria ${sub.name}`}
              hitSlop={8}
              onPress={() =>
                confirmDelete('Excluir subcategoria', `Excluir "${sub.name}"?`, () =>
                  delSub.mutate({ id: sub.id }),
                )
              }
            >
              <Ionicons name="close" size={12} color="#9C9B9B" />
            </Pressable>
          </View>
        ))}
        {category.isSystem ? null : adding ? (
          <TextInput
            autoFocus
            value={subName}
            onChangeText={setSubName}
            placeholder="nome"
            placeholderTextColor="#9C9B9B"
            returnKeyType="done"
            onSubmitEditing={submitSub}
            onBlur={() => {
              if (!subName.trim()) {
                setSubName('')
                setAdding(false)
              }
            }}
            className="w-28 rounded-full border border-info px-2.5 py-1 text-[11px] text-foreground dark:border-info-dark dark:text-foreground-dark"
          />
        ) : (
          <Pressable
            accessibilityLabel={`Nova subcategoria em ${category.name}`}
            onPress={() => setAdding(true)}
            className="rounded-full border border-dashed border-line px-2.5 py-1 dark:border-line-dark"
          >
            <Text className="text-[11px] text-muted dark:text-muted-dark">+ sub</Text>
          </Pressable>
        )}
      </View>
    </Card>
  )
}
