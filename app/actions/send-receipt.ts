"use server";

import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

// 👇 UPDATE: Accept cartItems as the 3rd argument
export async function sendReceiptEmail(
  email: string,
  order: any,
  cartItems: any[]
) {
  try {
    // 1. Format Data
    const total = (Number(order.totalMoney?.amount || 0) / 100).toFixed(2);
    const date = new Date(order.createdAt).toLocaleDateString();

    const tender = order.tenders?.[0];
    const cardBrand = tender?.cardDetails?.card?.cardBrand || "Card";
    const last4 = tender?.cardDetails?.card?.last4 || "****";

    // 2. Build HTML
    const emailHtml = `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e5e7eb; border-radius: 8px; color: #333;">
                <div style="text-align: center; border-bottom: 2px solid #333; padding-bottom: 20px; margin-bottom: 20px;">
                    <h1 style="color: #111; margin: 0;">Down South Corals</h1>
                    <p style="color: #666; margin: 5px 0;">Order Confirmation</p>
                </div>
                
                <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; font-size: 14px;">
                    <table style="width: 100%;">
                        <tr>
                            <td><strong>Order ID:</strong> #${order.id.slice(0, 8)}</td>
                            <td style="text-align: right;"><strong>Date:</strong> ${date}</td>
                        </tr>
                        <tr>
                            <td><strong>Payment:</strong> ${cardBrand} •••• ${last4}</td>
                            <td style="text-align: right;"><strong>Status:</strong> Paid</td>
                        </tr>
                    </table>
                </div>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <tr style="border-bottom: 1px solid #ddd; text-align: left;">
                        <th style="padding: 10px 0; width: 60px;"></th> <th style="padding: 10px 0;">Item</th>
                        <th style="padding: 10px 0; text-align: right;">Price</th>
                    </tr>
                    ${order.lineItems
                      .map((item: any) => {
                        // 👇 FIND THE IMAGE from the cartItems array
                        const originalItem = cartItems.find(
                          (c: any) => c.name === item.name
                        );
                        const imageUrl = originalItem?.imageUrl;

                        return `
                        <tr style="border-bottom: 1px solid #eee;">
                            <td style="padding: 10px 0; vertical-align: middle;">
                                ${
                                  imageUrl
                                    ? `
                                    <img src="${imageUrl}" alt="${item.name}" style="width: 50px; height: 50px; object-fit: cover; border-radius: 6px; display: block;" />
                                `
                                    : ""
                                }
                            </td>
                            <td style="padding: 10px 0; vertical-align: middle;">
                                <div style="font-weight: bold; margin-left: 10px;">${item.name}</div>
                                <div style="font-size: 12px; color: #666; margin-left: 10px;">Qty: ${item.quantity}</div>
                            </td>
                            <td style="padding: 10px 0; text-align: right; vertical-align: middle;">
                                $${(Number(item.basePriceMoney.amount) / 100).toFixed(2)}
                            </td>
                        </tr>
                        `;
                      })
                      .join("")}
                </table>

                <div style="text-align: right; margin-bottom: 30px;">
                    <p style="margin: 5px 0;">Subtotal: $${total}</p>
                    <p style="margin: 5px 0; font-size: 18px; font-weight: bold;">Total: $${total}</p>
                </div>

                <div style="text-align: center; font-size: 12px; color: #888; border-top: 1px solid #eee; padding-top: 20px;">
                    <p>Thank you for shopping with us!</p>
                    <p>Down South Corals<br/>(205) 719-7314</p>
                    <p><a href="https://downsouthcorals.com" style="color: #2563eb;">downsouthcorals.com</a></p>
                </div>
            </div>
        `;

    // 3. Send the Email
    const data = await resend.emails.send({
      from: "Down South Corals <receipts@downsouthcorals.com>",
      to: [email],
      subject: `Receipt for Order #${order.id.slice(0, 8)}`,
      html: emailHtml,
    });

    if (data.error) throw new Error(data.error.message);
    return { success: true };
  } catch (error: any) {
    console.error("Email Error:", error);
    return { success: false, error: error.message };
  }
}
