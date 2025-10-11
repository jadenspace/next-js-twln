import { lottoApi, transformLottoData } from "@/features/lotto/api/lotto-api";
import { type NextRequest } from "next/server";

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  const LATEST_DRAW_NO = 1192;
  const DELAY_MS = 500; // 0.5초 지연

  const searchParams = request.nextUrl.searchParams;
  const startFromQuery = searchParams.get("start_from");

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (data: string) =>
        controller.enqueue(encoder.encode(data));

      let startFrom = 1;

      // Determine the starting draw number
      if (startFromQuery) {
        const parsedStartFrom = parseInt(startFromQuery, 10);
        if (!isNaN(parsedStartFrom) && parsedStartFrom > 0) {
          startFrom = parsedStartFrom;
          enqueue(
            `Starting backfill from specified draw number: #${startFrom}...
`,
          );
        } else {
          enqueue(
            `[ERROR] Invalid 'start_from' parameter. It must be a positive number.
`,
          );
          controller.close();
          return;
        }
      } else {
        const latestSavedDrawNo = await lottoApi.getLatestDrawNo();
        startFrom = latestSavedDrawNo > 0 ? latestSavedDrawNo + 1 : 1;
        enqueue(
          `No 'start_from' parameter found. Starting from last saved draw + 1: #${startFrom}...
`,
        );
      }

      if (startFrom > LATEST_DRAW_NO) {
        enqueue(
          `Database is already up to date. All draws up to #${LATEST_DRAW_NO} are saved.
`,
        );
        controller.close();
        return;
      }

      enqueue(
        `Running backfill from draw #${startFrom} to #${LATEST_DRAW_NO}...
`,
      );
      enqueue(
        `A delay of ${DELAY_MS}ms is applied between requests to avoid rate limiting.

`,
      );

      for (let i = startFrom; i <= LATEST_DRAW_NO; i++) {
        try {
          // 1. Fetch data from external API
          const rawData = await lottoApi.fetchLottoDraw(i);

          if (rawData && rawData.returnValue === "success") {
            // 2. Transform data for our database
            const drawData = transformLottoData(rawData);

            // 3. Save to Supabase
            await lottoApi.saveLottoDraw(drawData);
            enqueue(`[SUCCESS] Draw #${i} saved successfully.
`);
          } else {
            enqueue(`[SKIPPED] No data or failed response for draw #${i}.
`);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";
          enqueue(`[ERROR] Failed to process draw #${i}: ${errorMessage}
`);
        }

        // 4. Wait before the next iteration
        await sleep(DELAY_MS);
      }

      enqueue(
        `
Backfill complete! All draws up to #${LATEST_DRAW_NO} have been processed.
`,
      );
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
