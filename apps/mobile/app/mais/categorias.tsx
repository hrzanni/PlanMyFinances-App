import { useState } from 'react'
import { Pressable, ScrollView, Text, View } from 'react-native'
import { trpc, type RouterOutputs } from '@/lib/trpc'
import { Button, Card, EmptyState, Input } from '@/components/ui'

type Category = RouterOutputs['categories']['list'][number]

function CategoryBlock({ category }: { category: Category }) {
  return (
    <Card className="mb-3">
      <Text className="mb-2 text-sm font-bold text-foreground dark:text-foreground-dark">
        {category.name}
      </Text>
      <View className="flex-row flex-wrap gap-1.5">
        {category.subcategories.map((sub: Category['subcategories'][number]) => (
          <View
            key={sub.id}
            className="rounded-full border border-line bg-background px-2.5 py-1 dark:border-line-dark dark:bg-background-dark"
          >
            <Text className="text-[11px] text-body dark:text-body-dark">{sub.name}</Text>
          </View>
        ))}
        {category.subcategories.length === 0 ? (
          <Text className="text-[11px] text-muted dark:text-muted-dark">sem subcategorias</Text>
        ) : null}
      </View>
    </Card>
  )
}

export default function CategoriesScreen() {
  const { data: categories } = trpc.categories.list.useQuery()
  const utils = trpc.useUtils()
  const [formOpen, setFormOpen] = useState(false)
  const [name, setName] = useState('')
  const [type, setType] = useState<'receita' | 'despesa'>('despesa')
  const [error, setError] = useState<string | null>(null)

  const create = trpc.categories.create.useMutation({
    onSuccess: () => {
      utils.categories.invalidate()
      setFormOpen(false)
      setName('')
    },
    onError: () => setError('Erro ao salvar. Tente novamente.'),
  })

  function submit() {
    setError(null)
    if (!name.trim()) return setError('Informe o nome')
    create.mutate({ name: name.trim(), type })
  }

  const expenses = (categories ?? []).filter((c) => c.type === 'despesa')
  const incomes = (categories ?? []).filter((c) => c.type === 'receita')

  return (
    <ScrollView className="flex-1 px-4 pt-3" keyboardShouldPersistTaps="handled">
      <Text className="mb-2 text-[10px] font-bold uppercase tracking-widest text-negative dark:text-negative-dark">
        Despesas
      </Text>
      {expenses.length > 0 ? (
        expenses.map((c) => <CategoryBlock key={c.id} category={c} />)
      ) : (
        <View className="mb-3">
          <EmptyState title="Nenhuma categoria de despesa" />
        </View>
      )}

      <Text className="mb-2 mt-3 text-[10px] font-bold uppercase tracking-widest text-positive dark:text-positive-dark">
        Receitas
      </Text>
      {incomes.length > 0 ? (
        incomes.map((c) => <CategoryBlock key={c.id} category={c} />)
      ) : (
        <EmptyState title="Nenhuma categoria de receita" />
      )}

      <View className="my-4">
        {formOpen ? (
          <Card>
            <Input label="Nome" value={name} onChangeText={setName} />
            <View className="mb-3 flex-row gap-2">
              {(['despesa', 'receita'] as const).map((t) => (
                <Pressable
                  key={t}
                  onPress={() => setType(t)}
                  className={`rounded-full border px-3 py-1.5 ${
                    type === t
                      ? 'border-foreground bg-foreground dark:border-foreground-dark dark:bg-foreground-dark'
                      : 'border-line dark:border-line-dark'
                  }`}
                >
                  <Text
                    className={`text-xs font-bold capitalize ${
                      type === t
                        ? 'text-background dark:text-background-dark'
                        : 'text-body dark:text-body-dark'
                    }`}
                  >
                    {t}
                  </Text>
                </Pressable>
              ))}
            </View>
            {error ? (
              <Text className="mb-2 text-xs font-bold text-negative dark:text-negative-dark">
                {error}
              </Text>
            ) : null}
            <Button
              title={create.isPending ? 'Salvando…' : 'Criar categoria'}
              onPress={submit}
              disabled={create.isPending}
            />
            <View className="h-2" />
            <Button title="Cancelar" variant="ghost" onPress={() => setFormOpen(false)} />
          </Card>
        ) : (
          <Button title="+ Nova categoria" onPress={() => setFormOpen(true)} />
        )}
      </View>
    </ScrollView>
  )
}
