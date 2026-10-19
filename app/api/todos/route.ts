import { createTodo, listTodos, updateTodo } from "@/lib/bee/client";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const todos = await listTodos();
    return NextResponse.json({ todos });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const { text, alarmAt } = (await req.json()) as {
      text: string;
      alarmAt?: string;
    };
    const trimmed = text?.trim();
    if (!trimmed) {
      return NextResponse.json({ error: "Todo text is required" }, { status: 400 });
    }
    const todo = await createTodo(trimmed, alarmAt);
    return NextResponse.json({ todo });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Create failed" },
      { status: 502 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, completed, text } = (await req.json()) as {
      id: string;
      completed?: boolean;
      text?: string;
    };
    const todo = await updateTodo(id, { completed, text });
    return NextResponse.json({ todo });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Update failed" },
      { status: 502 }
    );
  }
}
