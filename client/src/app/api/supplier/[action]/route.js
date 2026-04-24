export const runtime = 'nodejs';

import { executeQuery, StandardResponse } from '@/lib/db';
import { extractUser } from '@/lib/auth';

export async function GET(req, { params }) {
  const { action } = await params;
  let user;
  try {
    user = extractUser(req);
  } catch (e) {
    return StandardResponse("error", {}, e.message, 401);
  }

  if (action === 'get-all-suppliers') {
    const data = await executeQuery(`SELECT * FROM all_suppliers_by_warehouse_view`);
    return StandardResponse("success", { suppliers: data }, "Success");
  }

  if (action === 'count-suppliers') {
    const total = await executeQuery(`SELECT count(*) as count FROM suppliers`);
    return StandardResponse("success", parseInt(total[0].count), "Success");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}
