import { NextResponse } from "next/server";
import { ServiceError } from "@/lib/services/service-error";

export function routeErrorResponse(error: unknown, fallbackMessage: string, logContext: string) {
  if (error instanceof SyntaxError) {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 });
  }

  if (error instanceof ServiceError) {
    return NextResponse.json({ error: error.message }, { status: error.status });
  }

  console.error(logContext, error);
  return NextResponse.json({ error: fallbackMessage }, { status: 500 });
}
