import { beforeEach, describe, expect, it } from 'vitest'
import type { DrizzleDB } from '../db/client'
import { createTestDb, seedTestUsers } from '../test/test-db'
import { getUser, updateUserName, updateUserProfile } from './users'

let db: DrizzleDB
let userA: string

beforeEach(async () => {
  db = await createTestDb()
  const seeded = await seedTestUsers(db)
  userA = seeded.userA
})

describe('users service — perfil', () => {
  it('getUser expõe os dados públicos, incluindo os campos novos vazios', async () => {
    const user = await getUser(db, userA)
    expect(user).toMatchObject({
      id: userA,
      name: 'Usuário A',
      email: 'a@test.dev',
      birthDate: null,
      gender: null,
      phone: null,
    })
  })

  it('updateUserProfile salva nascimento, gênero e telefone junto com o nome', async () => {
    const updated = await updateUserProfile(db, userA, {
      name: 'Usuário A Editado',
      birthDate: '1990-05-20',
      gender: 'masculino',
      phone: '+55 11 91234-5678',
    })
    expect(updated).toMatchObject({
      name: 'Usuário A Editado',
      birthDate: '1990-05-20',
      gender: 'masculino',
      phone: '+55 11 91234-5678',
    })
    expect(await getUser(db, userA)).toMatchObject({ birthDate: '1990-05-20' })
  })

  it('updateUserProfile aceita limpar campos opcionais com null', async () => {
    await updateUserProfile(db, userA, {
      name: 'Usuário A',
      birthDate: '1990-05-20',
      gender: 'masculino',
      phone: '+55 11 91234-5678',
    })
    const cleared = await updateUserProfile(db, userA, {
      name: 'Usuário A',
      birthDate: null,
      gender: null,
      phone: null,
    })
    expect(cleared).toMatchObject({ birthDate: null, gender: null, phone: null })
  })

  it('campo omitido no update não sobrescreve o valor salvo', async () => {
    await updateUserProfile(db, userA, {
      name: 'Usuário A',
      birthDate: '1990-05-20',
      gender: 'masculino',
      phone: '+55 11 91234-5678',
    })
    const updated = await updateUserProfile(db, userA, { name: 'Só o nome' })
    expect(updated).toMatchObject({
      name: 'Só o nome',
      birthDate: '1990-05-20',
      gender: 'masculino',
      phone: '+55 11 91234-5678',
    })
  })

  it('updateUserProfile devolve null para usuário inexistente', async () => {
    expect(await updateUserProfile(db, 'nao-existe', { name: 'X' })).toBeNull()
  })

  it('updateUserName segue funcionando (compatibilidade com clientes antigos)', async () => {
    const updated = await updateUserName(db, userA, 'Novo Nome')
    expect(updated).toMatchObject({ name: 'Novo Nome' })
  })
})
