import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailPayload {
    to: string;
    consultantName: string;
    status: 'approved' | 'rejected';
    amount: number;
    currency: string;
    category: string;
    projectName: string;
    adminNotes?: string;
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload: EmailPayload = await req.json()

        // Create Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseKey)

        // Generate email content
        const subject = `Reimbursement Request ${payload.status === 'approved' ? 'Approved' : 'Rejected'}`

        const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${subject}</title>
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Travel Booking Portal</h1>
        </div>
        
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; margin-bottom: 20px;">Hi ${payload.consultantName},</p>
          
          <div style="background: ${payload.status === 'approved' ? '#d1fae5' : '#fee2e2'}; border-left: 4px solid ${payload.status === 'approved' ? '#10b981' : '#ef4444'}; padding: 15px; margin: 20px 0; border-radius: 4px;">
            <p style="margin: 0; font-weight: 600; color: ${payload.status === 'approved' ? '#065f46' : '#991b1b'};">
              Your reimbursement request has been ${payload.status}.
            </p>
          </div>
          
          <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151; font-size: 16px;">Request Details</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Project:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payload.projectName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Category:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payload.category.charAt(0).toUpperCase() + payload.category.slice(1)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-size: 14px;">Amount:</td>
                <td style="padding: 8px 0; font-weight: 600; text-align: right;">${payload.currency} ${payload.amount.toFixed(2)}</td>
              </tr>
            </table>
          </div>
          
          ${payload.status === 'rejected' && payload.adminNotes ? `
            <div style="background: #fef3c7; border: 1px solid #fbbf24; padding: 15px; border-radius: 8px; margin: 20px 0;">
              <h4 style="margin-top: 0; color: #92400e; font-size: 14px;">Admin Notes:</h4>
              <p style="margin: 0; color: #78350f; font-size: 14px;">${payload.adminNotes}</p>
            </div>
          ` : ''}
          
          <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
            ${payload.status === 'approved'
                ? 'The approved amount will be processed according to your company\'s reimbursement schedule.'
                : 'If you have questions about this decision, please contact your administrator.'}
          </p>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${supabaseUrl}" style="display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; font-weight: 600;">
              View Dashboard
            </a>
          </div>
        </div>
        
        <div style="text-align: center; margin-top: 20px; padding: 20px; color: #9ca3af; font-size: 12px;">
          <p style="margin: 0;">This is an automated message from the Travel Booking Portal.</p>
          <p style="margin: 5px 0 0 0;">Please do not reply to this email.</p>
        </div>
      </body>
      </html>
    `

        const textContent = `
Hi ${payload.consultantName},

Your reimbursement request has been ${payload.status}.

Request Details:
- Project: ${payload.projectName}
- Category: ${payload.category.charAt(0).toUpperCase() + payload.category.slice(1)}
- Amount: ${payload.currency} ${payload.amount.toFixed(2)}

${payload.status === 'rejected' && payload.adminNotes ? `Admin Notes: ${payload.adminNotes}\n` : ''}

${payload.status === 'approved'
                ? 'The approved amount will be processed according to your company\'s reimbursement schedule.'
                : 'If you have questions about this decision, please contact your administrator.'}

---
This is an automated message from the Travel Booking Portal.
    `.trim()

        // Send email using Supabase's built-in email service (if configured)
        // Note: In production, you'd integrate with SendGrid, Resend, or similar
        console.log('Email would be sent to:', payload.to)
        console.log('Subject:', subject)
        console.log('HTML Content:', htmlContent)

        // For now, we'll just log and return success
        // In production, integrate with your email service:
        /*
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${Deno.env.get('RESEND_API_KEY')}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Travel Portal <noreply@yourcompany.com>',
            to: [payload.to],
            subject: subject,
            html: htmlContent,
            text: textContent,
          }),
        })
        */

        return new Response(
            JSON.stringify({
                success: true,
                message: 'Email notification queued',
                preview: { subject, to: payload.to }
            }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error) {
        console.error('Error:', error)
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        )
    }
})
