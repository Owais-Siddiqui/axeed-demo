import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const customer_email = searchParams.get("customer_email")
  const worker_id = searchParams.get("worker_id")
  const status = searchParams.get("status")

  let query = supabaseServer.from("tickets").select("*").order("created_at", { ascending: false })
  if (customer_email) query = query.eq("customer_email", customer_email)
  if (worker_id) query = query.eq("worker_id", worker_id)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { data: existing } = await supabaseServer
    .from("tickets")
    .select("ticket_ref")
    .order("ticket_ref", { ascending: false })
    .limit(1)
    .single()

  const maxNum = existing
    ? parseInt((existing.ticket_ref as string).replace("TKT-", "") || "0")
    : 0
  const ticket_ref = `TKT-${String(maxNum + 1).padStart(4, "0")}`

  const { data: customer, error: customerError } = await supabaseServer
    .from("customers")
    .select("building_name")
    .eq("email", body.customer_email)
    .single()
  if (customerError || !customer)
    return NextResponse.json({ error: "Customer not found" }, { status: 404 })

  const property = customer.building_name

  const { id: _id, ticket_ref: _ref, property: _property, completion_photos: _cp, ...rest } = body
  const now = new Date().toISOString()
  const { data, error } = await supabaseServer
    .from("tickets")
    .insert({
      ...rest,
      ticket_ref,
      property,
      completion_photos: [],
      created_at: now,
      updated_at: now,
    })
    .select()
    .single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  const { data: eventData } = await supabaseServer
    .from("ticket_events")
    .insert({
      ticket_id: data.id,
      event_type: "CREATED",
      actor: "System",
      note: `Ticket created. Job type: ${data.job_type}, Urgency: ${data.urgency}.`,
      created_at: now,
    })
    .select()
    .single()

  return NextResponse.json({ data, event: eventData ?? null }, { status: 201 })
}
