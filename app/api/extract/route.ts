import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import OpenAI from "openai";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "@/lib/extraction-prompt";
import { parseTripPayload } from "@/lib/trip-utils";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    let documentText = "";

    if (!file.name.toLowerCase().endsWith(".docx")) {
      return NextResponse.json({ error: "Only DOCX uploads are supported right now." }, { status: 400 });
    }

    const result = await mammoth.extractRawText({ buffer });
    documentText = result.value;

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured for DOCX extraction." }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await client.responses.create({
      model: "gpt-4.1",
      input: [
        { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
        { role: "user", content: buildExtractionUserPrompt(documentText) }
      ]
    });

    const outputText = response.output_text;
    const parsedTrip = parseTripPayload(outputText);

    if (!parsedTrip) {
      return NextResponse.json({ error: "The DOCX was extracted, but the itinerary response could not be parsed." }, { status: 422 });
    }

    return NextResponse.json({ trip: parsedTrip, raw: outputText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
