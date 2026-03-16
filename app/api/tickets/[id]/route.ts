import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

type Params = { params: Promise<{ id: string }> }

export async function GET(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { data, error } = await supabaseServer.from("tickets").select("*").eq("id", id).single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const { id } = await params

  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

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

  // Worker assignment changed
  if ("worker_id" in updateData && updateData.worker_id !== current.worker_id) {
    if (updateData.worker_id) {
      const { data: worker } = await supabaseServer
        .from("workers")
        .select("full_name")
        .eq("id", updateData.worker_id)
        .single()
      events.push({
        ticket_id: id,
        event_type: "ASSIGNED",
        actor: "Manager",
        note: `Assigned to ${worker?.full_name ?? "worker"}.`,
        created_at: now,
      })
    } else {
      events.push({
        ticket_id: id,
        event_type: "ASSIGNED",
        actor: "Manager",
        note: "Worker unassigned.",
        created_at: now,
      })
    }
  }

  // Status changed
  if (updateData.status && updateData.status !== current.status) {
    if (updateData.status === "IN_PROGRESS") {
      events.push({
        ticket_id: id,
        event_type: "STATUS_CHANGE",
        actor: "Worker",
        note: "Worker accepted the assignment and started working.",
        created_at: now,
      })
    } else if (updateData.status === "COMPLETED") {
      events.push({
        ticket_id: id,
        event_type: "COMPLETED",
        actor: "Worker",
        note: "Job completed by worker.",
        created_at: now,
      })
    } else {
      events.push({
        ticket_id: id,
        event_type: "STATUS_CHANGE",
        actor: "Manager",
        note: `Status changed from ${current.status} to ${updateData.status}.`,
        created_at: now,
      })
    }
  }

  let createdEvents: unknown[] = []
  if (events.length > 0) {
    const { data: inserted } = await supabaseServer
      .from("ticket_events")
      .insert(events)
      .select()
    createdEvents = inserted ?? []
  }

  return NextResponse.json({ ok: true, events: createdEvents })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { error } = await supabaseServer.from("tickets").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
