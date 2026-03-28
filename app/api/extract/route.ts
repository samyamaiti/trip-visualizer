import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import OpenAI from "openai";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "@/lib/extraction-prompt";
import { sampleTrip } from "@/lib/sample-trip";
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

    if (file.name.toLowerCase().endsWith(".docx")) {
      const result = await mammoth.extractRawText({ buffer });
      documentText = result.value;
    } else {
      return NextResponse.json({
        warning: "PDF extraction not yet implemented in this starter.",
        fallback: sampleTrip
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({
        warning: "OPENAI_API_KEY not configured. Returning sample payload.",
        preview: documentText.slice(0, 2000),
        fallback: sampleTrip
      });
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
      return NextResponse.json({
        warning: "The model response could not be parsed into trip JSON. Showing the sample trip instead.",
        raw: outputText,
        fallback: sampleTrip
      });
    }

    return NextResponse.json({ trip: parsedTrip, raw: outputText });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Extraction failed" }, { status: 500 });
  }
}
