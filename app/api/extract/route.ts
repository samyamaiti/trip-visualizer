import { NextRequest, NextResponse } from "next/server";
import mammoth from "mammoth";
import OpenAI from "openai";
import { EXTRACTION_SYSTEM_PROMPT, buildExtractionUserPrompt } from "@/lib/extraction-prompt";
import { parseTripPayload } from "@/lib/trip-utils";

type OpenAIErrorLike = {
  message?: string;
  code?: string;
  status?: number;
};

async function runExtractionWithFallbackModels(client: OpenAI, documentText: string) {
  const preferredModel = process.env.OPENAI_EXTRACT_MODEL?.trim();
  const candidateModels = [preferredModel, "gpt-4.1", "gpt-4.1-mini", "gpt-4o-mini"].filter(
    (model, index, all): model is string => Boolean(model) && all.indexOf(model) === index
  );

  let lastError: OpenAIErrorLike | null = null;

  for (const model of candidateModels) {
    try {
      const response = await client.responses.create({
        model,
        input: [
          { role: "system", content: EXTRACTION_SYSTEM_PROMPT },
          { role: "user", content: buildExtractionUserPrompt(documentText) }
        ]
      });

      return {
        model,
        outputText: response.output_text
      };
    } catch (error) {
      lastError = error as OpenAIErrorLike;
      continue;
    }
  }

  throw new Error(lastError?.message ?? "OpenAI extraction failed for all configured models.");
}

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

    if (!documentText.trim()) {
      return NextResponse.json({ error: "The DOCX appears empty or no readable text could be extracted." }, { status: 422 });
    }

    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: "OPENAI_API_KEY is not configured for DOCX extraction." }, { status: 503 });
    }

    const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const { outputText, model } = await runExtractionWithFallbackModels(client, documentText);
    const parsedTrip = parseTripPayload(outputText);

    if (!parsedTrip) {
      return NextResponse.json({ error: "The DOCX was extracted, but the itinerary response could not be parsed." }, { status: 422 });
    }

    return NextResponse.json({ trip: parsedTrip, raw: outputText, model });
  } catch (error) {
    console.error(error);
    const err = error as OpenAIErrorLike;
    return NextResponse.json(
      {
        error: err?.message || "Extraction failed",
        details: err?.code ? `code=${err.code}` : undefined
      },
      { status: err?.status && err.status >= 400 && err.status < 600 ? err.status : 500 }
    );
  }
}
