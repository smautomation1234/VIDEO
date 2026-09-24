import { NextResponse } from "next/server";
import { getSessionUserId, getLinkedInToken } from "@/lib/social-tokens";

export async function GET() {
  const userId = await getSessionUserId();
  if (!userId) {
    return NextResponse.json({ error: "not_authenticated" }, { status: 401 });
  }

  try {
    // 1. Get the LinkedIn token
    const token = await getLinkedInToken(userId);

    if (!token) {
       return NextResponse.json({ error: "linkedin_token_missing" }, { status: 400 });
    }

    // 2. Fetch LinkedIn Organization ACLs (Pages the user manages)
    const aclsRes = await fetch(`https://api.linkedin.com/v2/organizationAcls?q=roleAssignee`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'X-Restli-Protocol-Version': '2.0.0'
        }
    });
    
    const aclsData = await aclsRes.json();

    if (aclsData.status && aclsData.status >= 400) {
       console.error("LinkedIn API Error:", aclsData);
       return NextResponse.json({ error: "failed_to_fetch_acls", details: aclsData.message }, { status: 500 });
    }

    const acls = aclsData.elements || [];
    const linkedinPages = [];

    // 3. For each ACL, fetch the Organization details
    for (const acl of acls) {
       const urn = acl.organization;
       if (!urn) continue;
       
       const orgId = urn.replace("urn:li:organization:", "");
       
       const orgRes = await fetch(`https://api.linkedin.com/v2/organizations/${orgId}`, {
           headers: {
               'Authorization': `Bearer ${token}`,
               'X-Restli-Protocol-Version': '2.0.0'
           }
       });
       const orgData = await orgRes.json();

       if (!orgData.status || orgData.status < 400) {
           linkedinPages.push({
               id: orgId,
               urn: urn,
               name: orgData.localizedName || "Unknown Page",
               // LinkedIn logo resolution is complex, but we fallback if needed.
               profilePicture: null 
           });
       }
    }

    return NextResponse.json({ pages: linkedinPages });
  } catch (error: any) {
    console.error("Error fetching LinkedIn pages:", error);
    if (error.message === "linkedin_not_connected" || error.message === "linkedin_token_expired") {
        return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "internal_error", details: error.message }, { status: 500 });
  }
}
