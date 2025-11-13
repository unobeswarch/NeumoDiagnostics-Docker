import https from "https"

// Agent para desarrollo que acepta certificados auto-firmados
export const httpsAgent = new https.Agent({
  rejectUnauthorized: false
})

// URL base para las peticiones al backend
export const API_BASE_URL = "https://reverse-proxy"

