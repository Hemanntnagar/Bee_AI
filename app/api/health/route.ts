import { checkBeeHealth } from "@/lib/bee/client";
import { NextResponse } from "next/server";

export async function GET() {
  const health = await checkBeeHealth();
  return NextResponse.json(health);
}
