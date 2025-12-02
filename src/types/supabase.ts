// Supabase Database Types
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
      rooms: {
        Row: {
          id: string
          room_code: string
          meeting_title: string
          password: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          room_code: string
          meeting_title: string
          password?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          room_code?: string
          meeting_title?: string
          password?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      participants: {
        Row: {
          id: string
          room_id: string
          name: string
          start_location: Json
          transport_mode: 'car' | 'transit'
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          name: string
          start_location: Json
          transport_mode: 'car' | 'transit'
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          name?: string
          start_location?: Json
          transport_mode?: 'car' | 'transit'
          created_at?: string
        }
      }
      candidate_locations: {
        Row: {
          id: string
          room_id: string
          location_id: string
          name: string
          address: string
          coordinates: Json
          travel_times: Json
          created_at: string
        }
        Insert: {
          id?: string
          room_id: string
          location_id: string
          name: string
          address: string
          coordinates: Json
          travel_times: Json
          created_at?: string
        }
        Update: {
          id?: string
          room_id?: string
          location_id?: string
          name?: string
          address?: string
          coordinates?: Json
          travel_times?: Json
          created_at?: string
        }
      }
      meetings: {
        Row: {
          id: string
          title: string
          participants: Json
          candidates: Json
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          participants: Json
          candidates: Json
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          participants?: Json
          candidates?: Json
          created_at?: string
        }
      }
    }
  }
}
