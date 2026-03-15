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
  let body: Record<string, unknown>
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { id: _id, ...insertData } = body
  const { data, error } = await supabaseServer.from("ticket_events").insert(insertData).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ data }, { status: 201 })
}
