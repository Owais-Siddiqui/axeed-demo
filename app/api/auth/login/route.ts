import { NextRequest, NextResponse } from "next/server"
import { supabaseServer } from "@/lib/supabase-server"
import { AuthSession } from "@/types/index"

export async function POST(req: NextRequest) {
  const { email, password } = await req.json()

  if (!email || !password) {
    return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
  }

  // Look up user account
  const { data: account, error } = await supabaseServer
    .from("user_accounts")
    .select("*")
    .eq("email", email.toLowerCase().trim())
    .eq("password", password)
    .single()

  if (error || !account) {
    return NextResponse.json({ error: "Invalid email or password" }, { status: 401 })
  }

  // Get the display name
  let name = "Admin"
  if (account.role === "customer" && account.linked_id) {
    const { data: customer } = await supabaseServer
      .from("customers")
      .select("full_name")
      .eq("id", account.linked_id)
      .single()
    if (customer) name = customer.full_name
  } else if (account.role === "worker" && account.linked_id) {
    const { data: worker } = await supabaseServer
      .from("workers")
      .select("full_name")
      .eq("id", account.linked_id)
      .single()
    if (worker) name = worker.full_name
  }

  const session: AuthSession = {
    id: account.id,
    email: account.email,
    role: account.role,
    linkedId: account.linked_id,
    name,
  }

  return NextResponse.json({ session })
}
