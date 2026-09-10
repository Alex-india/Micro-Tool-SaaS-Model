export interface JWTDecoded {
  header: Record<string, any> | null;
  payload: Record<string, any> | null;
  signature: string;
  isExpired: boolean | null;
  expiresInText: string;
  error?: string;
}

export function decodeJWT(token: string): JWTDecoded {
  if (!token || !token.trim()) {
    return {
      header: null,
      payload: null,
      signature: "",
      isExpired: null,
      expiresInText: "",
    };
  }

  const parts = token.trim().split(".");
  if (parts.length !== 3) {
    return {
      header: null,
      payload: null,
      signature: "",
      isExpired: null,
      expiresInText: "",
      error: "Invalid JWT format. A valid token consists of 3 parts separated by dots.",
    };
  }

  try {
    const base64Decode = (str: string) => {
      let output = str.replace(/-/g, "+").replace(/_/g, "/");
      switch (output.length % 4) {
        case 0:
          break;
        case 2:
          output += "==";
          break;
        case 3:
          output += "=";
          break;
        default:
          throw new Error("Illegal base64url string!");
      }
      return decodeURIComponent(
        atob(output)
          .split("")
          .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
          .join("")
      );
    };

    const header = JSON.parse(base64Decode(parts[0]));
    const payload = JSON.parse(base64Decode(parts[1]));
    const signature = parts[2];

    let isExpired: boolean | null = null;
    let expiresInText = "";

    if (payload && payload.exp && typeof payload.exp === "number") {
      const nowSeconds = Math.floor(Date.now() / 1000);
      const diff = payload.exp - nowSeconds;
      if (diff <= 0) {
        isExpired = true;
        expiresInText = `Expired ${Math.abs(diff)} seconds ago`;
      } else {
        isExpired = false;
        const minutes = Math.floor(diff / 60);
        expiresInText = `Expires in ${minutes} min (${diff} sec)`;
      }
    }

    return {
      header,
      payload,
      signature,
      isExpired,
      expiresInText,
    };
  } catch (err: any) {
    return {
      header: null,
      payload: null,
      signature: "",
      isExpired: null,
      expiresInText: "",
      error: err?.message || "Failed to parse JWT token.",
    };
  }
}
