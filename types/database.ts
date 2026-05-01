export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      clients: {
        Row: {
          id: string
          owner_id: string
          name: string
          company_name: string | null
          email: string | null
          phone: string | null
          instagram: string | null
          notes: string | null
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          company_name?: string | null
          email?: string | null
          phone?: string | null
          instagram?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          owner_id?: string
          name?: string
          company_name?: string | null
          email?: string | null
          phone?: string | null
          instagram?: string | null
          notes?: string | null
          status?: string
          created_at?: string
          updated_at?: string
        }
      }
      // Outras tabelas omitidas para brevidade, 
      // mas devem ser expandidas conforme o schema.
    }
  }
}
