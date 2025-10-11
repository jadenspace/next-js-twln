import { lottoApi, type LottoApiData, type LottoDraw } from "@/features/lotto/api/lotto-api";
import { NextResponse } from "next/server";

// Helper function to introduce a delay
const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Helper to transform API data to database format
const transformData = (apiData: LottoApiData): LottoDraw => ({
  drw_no: apiData.drwNo,
  drw_no_date: apiData.drwNoDate,
  tot_sell_amnt: apiData.totSellamnt,
  first_win_amnt: apiData.firstWinamnt,
  first_przwner_co: apiData.firstPrzwnerCo,
  drwt_no1: apiData.drwtNo1,
  drwt_no2: apiData.drwtNo2,
  drwt_no3: apiData.drwtNo3,
  drwt_no4: apiData.drwtNo4,
  drwt_no5: apiData.drwtNo5,
  drwt_no6: apiData.drwtNo6,
  bnus_no: apiData.bnusNo,
});

export async function GET() {
  const LATEST_DRAW_NO = 1192;
  const DELAY_MS = 500; // 0.5초 지연

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      const enqueue = (data: string) => controller.enqueue(encoder.encode(data));

      enqueue(`Starting backfill for draws 1 to ${LATEST_DRAW_NO}...\n`);
      enqueue(`A delay of ${DELAY_MS}ms is applied between requests to avoid rate limiting.\n\n`);

      for (let i = 1; i <= LATEST_DRAW_NO; i++) {
        try {
          // 1. Fetch data from external API
          // CORS 이슈로 인해 이 로직은 서버(Vercel) 환경에서만 정상 동작합니다.
          const rawData = await lottoApi.fetchLottoDraw(i);

          if (rawData && rawData.returnValue === "success") {
            // 2. Transform data for our database
            const drawData = transformData(rawData);

            // 3. Save to Supabase
            await lottoApi.saveLottoDraw(drawData);
            enqueue(`[SUCCESS] Draw #${i} saved successfully.\n`);
          } else {
            enqueue(`[SKIPPED] No data or failed response for draw #${i}.\n`);
          }
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : "Unknown error";
          enqueue(`[ERROR] Failed to process draw #${i}: ${errorMessage}\n`);
        }

        // 4. Wait before the next iteration
        await sleep(DELAY_MS);
      }

      enqueue(`\nBackfill complete! All draws up to ${LATEST_DRAW_NO} have been processed.\n`);
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      "Connection": "keep-alive",
    },
  });
}
