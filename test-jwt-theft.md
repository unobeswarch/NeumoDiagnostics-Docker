# 🔓 Prueba de Robo de JWT (Token Theft)

## ✅ Método 1: Robo de Cookie desde DevTools

### Paso 1: Inicia sesión normalmente
1. Abre https://localhost/login
2. Inicia sesión con usuario válido
3. Abre DevTools (F12) → Application → Cookies
4. Copia el valor de la cookie `auth-token`

**Ejemplo:**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJlbWFpbCI6InBhY2llbnRlQGV4YW1wbGUuY29tIiwiZXhwIjoxNzYwNDczMjAwLCJpZF91c3VhcmlvIjoxLCJub21icmVfY29tcGxldG8iOiJKdWFuIFDDqXJleiIsInJvbCI6InBhY2llbnRlIn0.Xyz123...
```

### Paso 2: Simula el ataque en otra máquina/navegador
1. Abre un navegador NUEVO o en modo incógnito
2. Abre DevTools (F12) → Application → Cookies
3. Crea manualmente la cookie:
   - Name: `auth-token`
   - Value: (pega el token robado)
   - Domain: `localhost`
   - Path: `/`
4. Ve a https://localhost/patient/dashboard

**Resultado esperado:** ✅ Acceso exitoso SIN credenciales

---

## ✅ Método 2: Usar curl para probar el token

```bash
# Token robado
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...."

# Hacer request con el token
curl -k https://localhost/userInfo \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
```

**Resultado esperado:** ✅ Devuelve info del usuario

---

## ✅ Método 3: Editar cookie con JavaScript

En la página de login (antes de autenticar), abre la consola:

```javascript
// Establece el token robado
document.cookie = "auth-token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...; path=/";
document.cookie = "user-role=paciente; path=/";
document.cookie = "user-id=1; path=/";

// Recarga la página
location.href = "/patient/dashboard";
```

**Resultado esperado:** ✅ Acceso directo al dashboard

---

## ❌ Por qué falló tu intento

### Error común 1: No copiaste la cookie completa
```javascript
// Verifica en consola
console.log(document.cookie);
// Debe mostrar: "auth-token=eyJh...; user-role=paciente; user-id=1"
```

### Error común 2: Token expirado
```javascript
// Decodifica el payload del JWT (parte del medio)
const payload = atob("eyJlbWFpbCI6InBhY2llbnRlQGV4YW1wbGUuY29tIiwiZXhwIjoxNzYwNDczMjAwLCJpZF91c3VhcmlvIjoxLCJub21icmVfY29tcGxldG8iOiJKdWFuIFDDqXJleiIsInJvbCI6InBhY2llbnRlIn0");
const decoded = JSON.parse(payload);
console.log("Expira:", new Date(decoded.exp * 1000));
console.log("Ahora:", new Date());
```

### Error común 3: Formato incorrecto
El middleware espera exactamente:
- Cookie name: `auth-token` (no `authToken` o `auth_token`)
- Cookie value: token JWT completo
- Domain: `localhost` (no `https://localhost`)

---

## 🛡️ Cómo protegerse (TO-DO)

Actualmente el sistema es vulnerable porque:
- ❌ No valida IP del cliente
- ❌ No valida User-Agent
- ❌ No hay blacklist de tokens
- ❌ Cookies no tienen flag `httpOnly` (accesible desde JS)
- ❌ No detecta múltiples sesiones

Ver: [Recomendaciones de seguridad anteriores]
