import { createAdminClient } from "@/lib/supabase/admin";
import { MP } from "./types";

/**
 * Fetches all current Members of Parliament (MPs) from the Sejm API
 * and upserts them into the 'politicians' database table.
 */
export async function syncMPs() {
  const supabase = createAdminClient();
  const res = await fetch("https://api.sejm.gov.pl/sejm/term10/MP");
  if (!res.ok) throw new Error("Failed to fetch MPs from Sejm API");
  
  const mps: MP[] = await res.json();
  
  const insertPayload = mps.map((mp) => ({
    sejm_id: mp.id,
    first_name: mp.firstName,
    last_name: mp.lastName,
    club: mp.club,
    active: mp.active,
  }));

  // Perform bulk upsert
  const { error } = await supabase.from("politicians").upsert(
    insertPayload,
    { onConflict: "sejm_id" }
  );
  
  if (error) {
    throw new Error(`Failed to upsert MPs to the database: ${error.message}`);
  }

  return mps.length;
}
