import { lottoApi, transformLottoData } from "@/features/lotto/api/lotto-api";
import { NextResponse } from "next/server";

/**
 * This is a cron job handler to update the latest lotto draw results.
 * It fetches the latest draw number from the database, calculates the next one,
 * fetches the new data from the lottery API, and saves it to the database.
 */
export async function GET() {
  try {
    // 1. Get the latest draw number we have in our database
    const latestSavedDrawNo = await lottoApi.getLatestDrawNo();

    if (latestSavedDrawNo === 0) {
      return NextResponse.json(
        {
          message: "Database is empty. Please run the backfill process first.",
        },
        { status: 400 },
      );
    }

    let currentDrawToFetch = latestSavedDrawNo + 1;
    let savedCount = 0;
    const maxDrawsPerRun = 5; // 한 번에 최대 5회차까지 업데이트

    while (savedCount < maxDrawsPerRun) {
      // 2. Fetch the next draw's data from the external API
      const rawData = await lottoApi.fetchLottoDraw(currentDrawToFetch);

      // 3. If new data is available, save it
      if (rawData) {
        const drawData = transformLottoData(rawData);
        await lottoApi.saveLottoDraw(drawData);
        savedCount++;
        currentDrawToFetch++;
      } else {
        // 더 이상 최신 데이터가 없으면 중단
        break;
      }
    }

    if (savedCount > 0) {
      return NextResponse.json({
        message: `Successfully updated ${savedCount} new draws.`,
        latestDrawFetched: currentDrawToFetch - 1,
      });
    } else {
      return NextResponse.json({
        message: `No new draw data available yet for draw #${currentDrawToFetch}.`,
      });
    }
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      {
        message: "An error occurred during the cron job.",
        error: errorMessage,
      },
      { status: 500 },
    );
  }
}
