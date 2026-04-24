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

  if (action === 'get-all-products') {
    const search = req.nextUrl.searchParams.get('search');
    const limit = parseInt(req.nextUrl.searchParams.get('limit')) || 50;
    const offset = parseInt(req.nextUrl.searchParams.get('offset')) || 0;
    let products;
    
    if (search) {
      products = await executeQuery(`SELECT * FROM product_summary WHERE name ILIKE $1 OR category_name ILIKE $1 OR supplier_name ILIKE $1 LIMIT $2 OFFSET $3`, [`%${search}%`, limit, offset]);
    } else {
      products = await executeQuery(`SELECT * FROM product_summary LIMIT $1 OFFSET $2`, [limit, offset]);
    }
    return StandardResponse("success", { products: products }, "Success");
  }

  if (action === 'categories') {
    const categories = await executeQuery(`SELECT * FROM categories`);
    return StandardResponse("success", categories, "Success");
  }

  if (action === 'count-total-products') {
    const total = await executeQuery(`SELECT count(*) as count FROM products`);
    return StandardResponse("success", parseInt(total[0].count), "Success");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}
