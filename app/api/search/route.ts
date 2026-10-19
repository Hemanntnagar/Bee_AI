import { searchConversations } from "@/lib/bee/client";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q") ?? searchParams.get("query") ?? "";
    const limit = Number(searchParams.get("limit") ?? "20");
    const modeParam = searchParams.get("mode");
    const mode =
      modeParam === "neural" ? ("neural" as const) : ("keyword" as const);

    if (!query.trim()) {
      return NextResponse.json({ hits: [], query: "" });
    }

    const result = await searchConversations({
      query,
      limit: Number.isFinite(limit) ? limit : 20,
      mode,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      query?: string;
      q?: string;
      limit?: number;
      mode?: "keyword" | "neural";
    };
    const query = (body.query ?? body.q ?? "").trim();
    if (!query) {
      return NextResponse.json({ hits: [], query: "" });
    }
    const result = await searchConversations({
      query,
      limit: body.limit ?? 20,
      mode: body.mode ?? "keyword",
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Search failed" },
      { status: 502 }
    );
  }
}
