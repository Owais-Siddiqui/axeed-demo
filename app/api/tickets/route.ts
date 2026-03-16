import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const id = searchParams.get("id")
  const customer_email = searchParams.get("customer_email")
  const worker_id = searchParams.get("worker_id")
  const status = searchParams.get("status")

  // Single ticket lookup by id
  if (id) {
    const { data, error } = await supabaseServer.from("tickets").select("*").eq("id", id).single()
    if (error) return NextResponse.json({ error: error.message }, { status: 404 })
    return NextResponse.json({ data })
  }

  let query = supabaseServer.from("tickets").select("*").order("created_at", { ascending: false })
  if (customer_email) query = query.eq("customer_email", customer_email)
  if (worker_id) query = query.eq("worker_id", worker_id)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest) {
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  // Accept id from query param or request body
  const id = (req.nextUrl.searchParams.get("id") ?? body.id ?? null) as string | null
  if (!id) return NextResponse.json({ error: "Missing id (provide as query param ?id= or in request body)" }, { status: 400 })

  // Fetch current ticket state to detect changes for activity events
  const { data: current, error: fetchError } = await supabaseServer
    .from("tickets")
    .select("status, worker_id")
    .eq("id", id)
    .single()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 404 })

  // Strip immutable fields that must not be written back to the DB
  const { id: _id, ticket_ref: _ref, created_at: _ca, ...updateData } = body

  // Auto-assign status when a worker is being set and status isn't explicitly provided
  if (updateData.worker_id && !updateData.status) {
    if (current.status === "OPEN") {
      updateData.status = "ASSIGNED"
      updateData.assigned_at = new Date().toISOString()
    }
  }

  const { error } = await supabaseServer.from("tickets").update(updateData).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Automatically create activity events based on what changed
  const now = new Date().toISOString()
  const events: Record<string, unknown>[] = []

  if ("worker_id" in updateData && updateData.worker_id !== current.worker_id) {
    if (updateData.worker_id) {
      const { data: worker } = await supabaseServer.from("workers").select("full_name").eq("id", updateData.worker_id).single()
      events.push({ ticket_id: id, event_type: "ASSIGNED", actor: "Manager", note: `Assigned to ${worker?.full_name ?? "worker"}.`, created_at: now })
    } else {
      events.push({ ticket_id: id, event_type: "ASSIGNED", actor: "Manager", note: "Worker unassigned.", created_at: now })
    }
  }

  if (updateData.status && updateData.status !== current.status) {
    if (updateData.status === "IN_PROGRESS") {
      events.push({ ticket_id: id, event_type: "STATUS_CHANGE", actor: "Worker", note: "Worker accepted the assignment and started working.", created_at: now })
    } else if (updateData.status === "COMPLETED") {
      events.push({ ticket_id: id, event_type: "COMPLETED", actor: "Worker", note: "Job completed by worker.", created_at: now })
    } else {
      events.push({ ticket_id: id, event_type: "STATUS_CHANGE", actor: "Manager", note: `Status changed from ${current.status} to ${updateData.status}.`, created_at: now })
    }
  }

  let createdEvents: unknown[] = []
  if (events.length > 0) {
    const { data: inserted } = await supabaseServer.from("ticket_events").insert(events).select()
    createdEvents = inserted ?? []
  }

  return NextResponse.json({ ok: true, events: createdEvents })
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
