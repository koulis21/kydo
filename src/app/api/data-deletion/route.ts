import { NextResponse } from 'next/server'

// Facebook Data Deletion Callback endpoint
// Accepts both GET (instructions) and POST (callback from Facebook)
export async function GET() {
  return NextResponse.json({
    url: 'https://kydo.gr/data-deletion',
    instructions: 'To delete your data, email info@kydo.gr or visit kydo.gr/data-deletion',
  })
}

export async function POST() {
  // Facebook sends a signed_request when a user requests data deletion
  // We acknowledge receipt - actual deletion handled via email or account settings
  return NextResponse.json({
    url: 'https://kydo.gr/data-deletion',
    confirmation_code: 'deletion_request_received',
  })
}
