import { NextResponse } from "next/server";

export async function GET() {
    return NextResponse.json({
        message: "Stager API System Online",
        timestamp: new Date().toISOString(),
        status: 200
    });
}
