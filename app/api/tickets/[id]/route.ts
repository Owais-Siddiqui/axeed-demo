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

  // Auto-assign status when a worker is being set and status isn't explicitly provided
  if (body.worker_id && !body.status) {
    const { data: current, error: fetchError } = await supabaseServer
      .from("tickets")
      .select("status")
      .eq("id", id)
      .single()

    if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })

    if (current.status === "PENDING") {
      body.status = "ASSIGNED"
      body.assigned_at = new Date().toISOString()
    }
  }

  const { error } = await supabaseServer.from("tickets").update(body).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const { id } = await params

  const { error } = await supabaseServer.from("tickets").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true })
}
