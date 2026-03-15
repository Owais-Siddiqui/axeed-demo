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
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 })
  }

  const { error } = await supabaseServer.from("tickets").insert(body)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ ok: true }, { status: 201 })
}
