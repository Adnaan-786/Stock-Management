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

  if (action === 'recent-completed') {
    const query = `
      SELECT o.order_id, c.name as customer_name, SUM(poi.total_price) as total_order_value
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.customer_id
      LEFT JOIN order_items oi ON o.order_id = oi.order_id
      LEFT JOIN product_order_items poi ON oi.order_item_id = poi.order_item_id
      WHERE o.status = 'completed'
      GROUP BY o.order_id, c.name
      ORDER BY o.updated_time DESC
      LIMIT 10
    `;
    const orders = await executeQuery(query);
    return StandardResponse("success", orders, "Success");
  }

  if (action === 'get-all-orders') {
    const search = req.nextUrl.searchParams.get('search');
    let orders;
    if (search) {
      orders = await executeQuery(`SELECT * FROM order_summary_view WHERE CAST(order_id AS TEXT) ILIKE $1 OR customer_name ILIKE $1 ORDER BY order_date DESC`, [`%${search}%`]);
    } else {
      orders = await executeQuery(`SELECT * FROM order_summary_view ORDER BY order_date DESC`);
    }
    return StandardResponse("success", orders, "Success");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}

export async function POST(req, { params }) {
  const { action } = await params;
  let user;
  try {
    user = extractUser(req);
  } catch (e) {
    return StandardResponse("error", {}, e.message, 401);
  }

  if (action === 'create-order') {
    const { customer_id, items, status } = await req.json();
    
    // Arrays for postgres function
    const productIds = items.map(i => i.product_id);
    const quantities = items.map(i => i.quantity);
    const prices = items.map(i => i.price);
    
    // Call the postgres function create_order
    await executeQuery(`SELECT create_order($1, $2, $3, $4)`, [customer_id, productIds, quantities, prices]);
    
    return StandardResponse("success", {}, "Order created successfully");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}

