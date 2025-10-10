export type ContactStatus = 'new' | 'read' | 'replied' | 'archived'

export interface ContactMessage {
  id: string
  name: string
  email: string
  subject: string
  message: string
  status: ContactStatus
  created_at: string
  updated_at?: string
}
