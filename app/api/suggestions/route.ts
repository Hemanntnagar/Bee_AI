import {
  acceptTodoSuggestion,
  dismissTodoSuggestion,
  listTodoSuggestions,
} from "@/lib/bee/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const suggestions = await listTodoSuggestions();
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { id, action } = (await req.json()) as {
      id: string;
      action: "accept" | "dismiss";
    };
    if (action === "accept") await acceptTodoSuggestion(id);
    else await dismissTodoSuggestion(id);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Action failed" },
      { status: 502 }
    );
  }
}
