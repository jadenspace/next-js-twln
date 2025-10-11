import { lottoApi, type LottoApiData, type LottoDraw } from "@/features/lotto/api/lotto-api";
import { NextResponse } from "next/server";

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
            { message: "Database is empty. Please run the backfill process first." },
            { status: 400 }
        );
    }

    const nextDrawNo = latestSavedDrawNo + 1;

    // 2. Fetch the next draw's data from the external API
    const rawData = await lottoApi.fetchLottoDraw(nextDrawNo);

    // 3. If new data is available, save it
    if (rawData && rawData.returnValue === "success") {
      const drawData = transformData(rawData);
      await lottoApi.saveLottoDraw(drawData);

      return NextResponse.json({
        message: `Successfully updated with new draw.`,
        draw: drawData,
      });
    } else {
      return NextResponse.json({
        message: `No new draw data available yet for draw #${nextDrawNo}. It might not be announced. `,
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json(
      { message: "An error occurred during the cron job.", error: errorMessage },
      { status: 500 }
    );
  }
}
