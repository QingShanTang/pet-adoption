export type UserRole = 'user' | 'admin'

export interface Profile {
  id: string
  name: string | null
  phone: string | null
  role: UserRole
}

export type PetSpecies = 'cat' | 'dog' | 'other'
export type PetGender = 'male' | 'female'
export type PetStatus = 'available' | 'pending' | 'adopted'

export interface Pet {
  id: string
  name: string
  species: PetSpecies
  breed: string | null
  age: number | null
  gender: PetGender
  description: string | null
  status: PetStatus
  image_url: string | null
  created_at: string
}

export type ApplicationStatus = 'pending' | 'approved' | 'rejected'

export interface Application {
  id: string
  user_id: string
  pet_id: string
  status: ApplicationStatus
  message: string | null
  created_at: string
  pet?: Pet
  profile?: Profile
}
