import { NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"

export async function GET() {
  const [cusRes, wrkRes, tktRes, evtRes] = await Promise.all([
    supabaseServer.from("customers").select("*").order("full_name"),
    supabaseServer.from("workers").select("*").order("full_name"),
    supabaseServer.from("tickets").select("*").order("created_at", { ascending: false }),
    supabaseServer.from("ticket_events").select("*").order("created_at"),
  ])

  if (cusRes.error) return NextResponse.json({ error: cusRes.error.message }, { status: 500 })
  if (wrkRes.error) return NextResponse.json({ error: wrkRes.error.message }, { status: 500 })
  if (tktRes.error) return NextResponse.json({ error: tktRes.error.message }, { status: 500 })
  if (evtRes.error) return NextResponse.json({ error: evtRes.error.message }, { status: 500 })

  // Bridge: if DB still has old customer_id column, resolve to customer_email
  const emailById = new Map((cusRes.data as { id: string; email: string }[]).map(c => [c.id, c.email]))
  const tickets = (tktRes.data as Record<string, unknown>[]).map(t => {
    if (!t.customer_email && t.customer_id) {
      return { ...t, customer_email: emailById.get(t.customer_id as string) ?? null }
    }
    return t
  })

  return NextResponse.json({
    customers: cusRes.data,
    workers: wrkRes.data,
    tickets,
    ticketEvents: evtRes.data,
  })
}
