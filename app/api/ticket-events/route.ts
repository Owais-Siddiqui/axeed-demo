import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET(req: NextRequest) {
  const ticket_id = req.nextUrl.searchParams.get("ticket_id")

  let query = supabaseServer.from("ticket_events").select("*").order("created_at")
  if (ticket_id) query = query.eq("ticket_id", ticket_id)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data })
}

export async function POST(req: NextRequest) {
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { error } = await supabaseServer.from("ticket_events").insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
