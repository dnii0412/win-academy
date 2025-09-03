// Admin authentication helper utilities

export interface AdminTokenInfo {
  hasToken: boolean
  tokenLength: number
  tokenStart: string
  tokenEnd: string
  isValid: boolean
}

export const getAdminTokenInfo = (): AdminTokenInfo => {
  const adminToken = localStorage.getItem("adminToken")
  
  return {
    hasToken: !!adminToken,
    tokenLength: adminToken?.length || 0,
    tokenStart: adminToken ? adminToken.substring(0, 20) + "..." : "",
    tokenEnd: adminToken ? "..." + adminToken.substring(adminToken.length - 10) : "",
    isValid: false // Will be set by verification
  }
}

export const getAdminToken = (): string | null => {
  return localStorage.getItem("adminToken")
}

export const setAdminToken = (token: string): void => {
  localStorage.setItem("adminToken", token)
}

export const removeAdminToken = (): void => {
  localStorage.removeItem("adminToken")
}

export const verifyAdminToken = async (): Promise<boolean> => {
  const adminToken = getAdminToken()
  
  if (!adminToken) {
    console.log("❌ No admin token found")
    return false
  }

  try {
    console.log("🔍 Verifying admin token...")
    const response = await fetch("/api/admin/verify", {
      headers: {
        Authorization: `Bearer ${adminToken}`,
      },
    })
    
    console.log("🔍 Token verification response:", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok
    })
    
    if (!response.ok) {
      console.log("❌ Token verification failed")
      removeAdminToken()
      return false
    }
    
    console.log("✅ Token verification successful")
    return true
  } catch (error) {
    console.error("❌ Token verification error:", error)
    removeAdminToken()
    return false
  }
}

export const ensureAdminAuth = async (): Promise<boolean> => {
  const tokenInfo = getAdminTokenInfo()
  console.log("🔐 Admin auth check:", tokenInfo)
  
  if (!tokenInfo.hasToken) {
    console.log("❌ No admin token found")
    return false
  }
  
  return await verifyAdminToken()
}
