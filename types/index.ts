export type Urgency = "low" | "medium" | "high";
export type Status = "OPEN" | "ASSIGNED" | "IN_PROGRESS" | "COMPLETED";

export interface Attachment {
  id: string;
  url: string;
  file_type: "image" | "pdf" | "audio";
  label: string;
  uploaded_by: string;
  uploaded_at: string;
}

export interface Customer {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  property_ref: string;
  building_name: string;
  floor: string | null;
  unit_number: string;
  area: string;
  city: string;
  emergency_contact: string | null;
  contract_expiry: string;
  preferred_contact: "email" | "whatsapp" | "phone";
}

export interface Worker {
  id: string;
  full_name: string;
  email: string;
  skills: string[];
  phone: string;
  is_active: boolean;
  open_tickets: number;
}

export interface Ticket {
  id: string;
  ticket_ref: string;
  customer_email: string;
  worker_id: string | null;
  property: string;
  job_type: string;
  urgency: Urgency;
  status: Status;
  ai_summary: string;
  eta_description: string | null;
  location_notes: string | null;
  access_instructions: string | null;
  reported_via: "email" | "whatsapp" | "phone" | "manual";
  resolution_notes: string | null;
  attachments: Attachment[];
  completion_photos: Attachment[];
  assigned_at: string | null;
  in_progress_at: string | null;
  done_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface TicketEvent {
  id: string;
  ticket_id: string;
  ticket_ref?: string;
  event_type: "CREATED" | "ASSIGNED" | "STATUS_CHANGE" | "NOTE" | "COMPLETED";
  actor: string;
  note: string | null;
  created_at: string;
}
