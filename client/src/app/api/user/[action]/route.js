import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { executeQueryArrayMode, executeQuery, StandardResponse } from '@/lib/db';
import { signToken, extractUser } from '@/lib/auth';

export async function POST(req, { params }) {
  const { action } = await params;
  
  if (action === 'register') {
    const { username, email, password } = await req.json();
    const existing = await executeQueryArrayMode(`SELECT email FROM users WHERE email = $1`, [email]);
    if (existing && existing.length > 0) return StandardResponse("error", {}, "Email already exists", 400);

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);
    await executeQuery(`INSERT INTO users (username, email, password_hash, is_active) VALUES ($1, $2, $3, TRUE)`, [username, email, hash]);
    return StandardResponse("success", {}, "User registered successfully");
  }

  if (action === 'login') {
    const { email, password } = await req.json();
    const users = await executeQueryArrayMode(`SELECT user_id, username, email, password_hash, role_name, image_url, warehouse_id, is_active FROM users WHERE email = $1`, [email]);
    if (!users || users.length === 0) return StandardResponse("error", {}, "Invalid credentials", 401);
    
    const userRow = users[0];
    if (!await bcrypt.compare(password, userRow[3])) return StandardResponse("error", {}, "Invalid credentials", 401);
    if (!userRow[7]) return StandardResponse("error", {}, "Account inactive", 403);
    
    const refreshToken = crypto.randomBytes(32).toString('hex');
    const clientIp = req.headers.get('x-forwarded-for') || '127.0.0.1';
    const userAgent = req.headers.get('user-agent') || 'Unknown';
    await executeQuery(`INSERT INTO login_logs (user_id, refresh_token, ip_address, user_agent) VALUES ($1, $2, $3, $4)`, [userRow[0], refreshToken, clientIp, userAgent]);

    const jwtPayload = { user_id: userRow[0], role_name: userRow[4], warehouse_id: userRow[6], email: userRow[2] };
    return StandardResponse("success", { access_token: signToken(jwtPayload), refresh_token: refreshToken, user: jwtPayload }, "Login successful");
  }

  if (action === 'get-new-access-token') {
    const { refresh_token } = await req.json();
    const logs = await executeQueryArrayMode(`SELECT user_id FROM login_logs WHERE refresh_token = $1 ORDER BY created_time DESC LIMIT 1`, [refresh_token]);
    if (!logs || logs.length === 0) return StandardResponse("error", {}, "Invalid refresh token", 401);
    
    const users = await executeQueryArrayMode(`SELECT user_id, role_name, warehouse_id, email FROM users WHERE user_id = $1`, [logs[0][0]]);
    const userRow = users[0];
    const jwtPayload = { user_id: userRow[0], role_name: userRow[1], warehouse_id: userRow[2], email: userRow[3] };
    return StandardResponse("success", { access_token: signToken(jwtPayload), refresh_token: refresh_token }, "Token refreshed");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}

export async function GET(req, { params }) {
  const { action } = await params;
  let user;
  try {
    user = extractUser(req);
  } catch (e) {
    return StandardResponse("error", {}, e.message, 401);
  }

  if (action === 'dashboard-stats') {
    // simplified stats for demo
    const revenue = await executeQuery(`SELECT COALESCE(SUM(total_price), 0) as total FROM product_order_items`);
    const products = await executeQuery(`SELECT count(*) as total FROM products`);
    const orders = await executeQuery(`SELECT count(*) as total FROM orders`);
    const customers = await executeQuery(`SELECT count(*) as total FROM customers`);
    
    return StandardResponse("success", {
      revenue: { total: revenue[0].total, month_over_month_change: 0 },
      products: { total: parseInt(products[0].total), month_over_month_change: 0 },
      orders: { total: parseInt(orders[0].total), month_over_month_change: 0 },
      customers: { total: parseInt(customers[0].total), month_over_month_change: 0 }
    }, "Success");
  }

  if (action === 'monthly-sales') {
    const salesConfigQuery = `
      SELECT to_char(date_trunc('month', order_date), 'YYYY-MM') as month,
             SUM(poi.total_price) as total_sales
      FROM orders o
      JOIN order_items oi ON o.order_id = oi.order_id
      JOIN product_order_items poi ON oi.order_item_id = poi.order_item_id
      WHERE o.status = 'completed'
      GROUP BY 1 ORDER BY 1 DESC LIMIT 6
    `;
    const monthly_data = await executeQuery(salesConfigQuery);
    return StandardResponse("success", { monthly_data: monthly_data.reverse(), total_sales: 0, average_monthly_sales: 0 }, "Success");
  }

  if (action === 'get-user-detail') {
    const users = await executeQueryArrayMode(`SELECT user_id, username, email, role_name, image_url, warehouse_id FROM users WHERE user_id = $1`, [user.user_id]);
    const u = users[0];
    return StandardResponse("success", { user_id: u[0], username: u[1], email: u[2], role_name: u[3], image_url: u[4], warehouse_id: u[5] }, "Success");
  }

  return StandardResponse("error", {}, "Endpoint not found", 404);
}
