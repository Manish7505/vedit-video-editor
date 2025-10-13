import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase client instance
let supabaseClient: SupabaseClient | null = null

// Initialize Supabase client
export const initSupabase = (url: string, anonKey: string) => {
  supabaseClient = createClient(url, anonKey)
  return supabaseClient
}

export const getSupabaseClient = (): SupabaseClient => {
  if (!supabaseClient) {
    throw new Error('Supabase client not initialized. Please set your configuration.')
  }
  return supabaseClient
}

// Database types
export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  thumbnail?: string
  created_at: string
  updated_at: string
  duration: number
  tracks: any[]
  clips: any[]
}

export interface VideoClip {
  id: string
  project_id: string
  track_id: string
  name: string
  type: 'video' | 'audio' | 'image' | 'text'
  start_time: number
  end_time: number
  duration: number
  url?: string
  file_path?: string
  properties: any
  created_at: string
}

// Project Management
export const saveProject = async (projectData: Partial<Project>): Promise<Project | null> => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client
      .from('projects')
      .upsert(projectData)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Save project error:', error)
    return null
  }
}

export const getProject = async (projectId: string): Promise<Project | null> => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Get project error:', error)
    return null
  }
}

export const getUserProjects = async (userId: string): Promise<Project[]> => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client
      .from('projects')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Get user projects error:', error)
    return []
  }
}

export const deleteProject = async (projectId: string): Promise<boolean> => {
  try {
    const client = getSupabaseClient()
    
    const { error } = await client
      .from('projects')
      .delete()
      .eq('id', projectId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete project error:', error)
    return false
  }
}

// File Storage
export const uploadFile = async (
  file: File,
  path: string
): Promise<{ url: string; path: string } | null> => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client.storage
      .from('videos')
      .upload(path, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) throw error

    const { data: urlData } = client.storage
      .from('videos')
      .getPublicUrl(data.path)

    return {
      url: urlData.publicUrl,
      path: data.path
    }
  } catch (error) {
    console.error('Upload file error:', error)
    return null
  }
}

export const deleteFile = async (path: string): Promise<boolean> => {
  try {
    const client = getSupabaseClient()
    
    const { error } = await client.storage
      .from('videos')
      .remove([path])

    if (error) throw error
    return true
  } catch (error) {
    console.error('Delete file error:', error)
    return false
  }
}

// Authentication helpers
export const signUp = async (email: string, password: string) => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client.auth.signUp({
      email,
      password
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign up error:', error)
    throw error
  }
}

export const signIn = async (email: string, password: string) => {
  try {
    const client = getSupabaseClient()
    
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password
    })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Sign in error:', error)
    throw error
  }
}

export const signOut = async () => {
  try {
    const client = getSupabaseClient()
    
    const { error } = await client.auth.signOut()
    if (error) throw error
  } catch (error) {
    console.error('Sign out error:', error)
    throw error
  }
}

export const getCurrentUser = async () => {
  try {
    const client = getSupabaseClient()
    
    const { data: { user } } = await client.auth.getUser()
    return user
  } catch (error) {
    console.error('Get current user error:', error)
    return null
  }
}

// Real-time subscriptions
export const subscribeToProject = (
  projectId: string,
  callback: (payload: any) => void
) => {
  try {
    const client = getSupabaseClient()
    
    const subscription = client
      .channel(`project:${projectId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'projects',
          filter: `id=eq.${projectId}`
        },
        callback
      )
      .subscribe()

    return subscription
  } catch (error) {
    console.error('Subscribe to project error:', error)
    return null
  }
}


