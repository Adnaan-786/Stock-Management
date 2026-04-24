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

  if (action === 'get-all-customers') {
    const data = await executeQuery(`SELECT * FROM customer_summary_view`);
    return StandardResponse("success", { customers: data }, "Success");
  }

  if (action === 'count-customers') {
    const total = await executeQuery(`SELECT count(*) as count FROM customers`);
    return StandardResponse("success", parseInt(total[0].count), "Success");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}
