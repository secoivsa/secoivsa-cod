# Reestructuración Total SECOIVSA 2026

Una transformación grande dividida en 4 fases ejecutables. Antes de empezar quiero confirmar el alcance para no desperdiciar iteraciones.

## Alcance

Rediseño completo del sitio público (`/`), header, footer, y **secciones COD públicas** (no el dashboard interno `/_authenticated/nexus/*`, que mantiene su lógica). Identidad visual nueva, animaciones cinematográficas, responsive perfecto, y páginas legales.

## Identidad final

- **Paleta**: bg `#030507`, azul tech `#00A3FF`, naranja industrial `#FF6B00`, acero `#7D8790`, blanco `#F4F7FA`
- **Tipografía pública**: Oswald SemiBold (títulos) + Inter (texto)
- **Tipografía COD**: Rajdhani SemiBold + Inter
- **Sistema**: tokens en `src/styles.css` (oklch), fuentes vía Google Fonts en `__root.tsx`

## Fase 1 — Fundaciones

1. Reescribir `src/styles.css`: nueva paleta oklch, tokens semánticos (`--industrial-blue`, `--industrial-orange`, `--steel`), gradientes, sombras, fuentes Oswald/Rajdhani/Inter
2. Cargar Google Fonts en `__root.tsx` (Oswald, Rajdhani, Inter)
3. Reducir spacing global (padding sección de `py-32` → `py-20`, densidad premium)
4. Eliminar restos de "Nexus" en texto público (sigue como ruta interna pero copy dice "COD")

## Fase 2 — Header + Hero

5. **Header**: logo más nítido con glow azul-naranja sutil, shrink suave al scroll, menú glassmorphism compacto, hover con underline glow, mobile drawer pulido
6. **Hero**: video drone intacto. Overlay cinematográfico con gradientes radiales azul+naranja, partículas/líneas técnicas SVG sutiles, parallax, reveal escalonado
7. Copy nuevo: "Construcción industrial impulsada por operación inteligente." + subtexto oficial
8. Botones con sweep glow + microinteracciones

## Fase 3 — Secciones públicas

9. **Compañía**: foto reducida con overlay, 4 KPIs (22+ años, 300+ proyectos, 40+ clientes, 100% operacional) en glass cards con counters animados (`useInView` + tween)
10. **Clientes**: grid premium glass cards con logos grayscale + hover glow, métricas live arriba. Eliminar marquee actual
11. **COD público (sección showcase)**: visual SCADA — HUD overlays, líneas de tracking SVG animadas, radar pulse, indicadores blinking, KPIs live (Producción activa, 0 incidentes, 12 frentes, HH live, sincronización, cumplimiento). Estilo Tesla Ops / Siemens
12. **Capacidades / Estructura / Estándares**: pulir spacing y reveal animations existentes
13. **Footer**: rediseño con accesos rápidos, mini-mapa SVG, QR WhatsApp RH (placeholder), redes, glow líneas, links legales

## Fase 4 — Legal + Polish

14. Crear rutas: `/aviso-privacidad`, `/terminos`, `/cookies`, `/cumplimiento` con plantilla legal sobria + head() SEO propio
15. Magnetic buttons + smooth scroll global (lenis-style con CSS `scroll-behavior` y motion)
16. QA responsive: 360/768/1024/1440/1920
17. QA navegación a `/login` y rutas legales

## Detalles técnicos

- Animaciones: `motion/react` (ya en uso), reveals con `useInView`, counters con `animate()` de motion
- Componente reusable `<Counter target={300} suffix="+" />` para KPIs
- HUD/SCADA: SVG inline con `<animate>` + motion para líneas de scan
- Logo: nuevo SVG/filter mejorado, `h-7 md:h-8` con `transition-all` al scroll
- No tocar: `src/integrations/supabase/*`, `_authenticated/nexus/*` (lógica interna), `routeTree.gen.ts` (auto)

## Archivos a tocar (estimado)

- `src/styles.css` (rewrite tokens)
- `src/routes/__root.tsx` (fonts)
- `src/routes/index.tsx` (rewrite secciones)
- `src/components/site/SiteHeader.tsx` (pulido)
- `src/components/site/SiteFooter.tsx` (rewrite)
- `src/components/site/Counter.tsx` (nuevo)
- `src/components/site/CODShowcase.tsx` (nuevo — sección SCADA)
- `src/components/site/ClientsGrid.tsx` (nuevo)
- `src/routes/aviso-privacidad.tsx`, `terminos.tsx`, `cookies.tsx`, `cumplimiento.tsx` (nuevos)

## Lo que NO incluye

- No rediseño del dashboard interno `/nexus/*` (solo cambio de nombre en copy público)
- No backend nuevo, no migraciones DB
- No logos reales de clientes (uso placeholders con nombres tipográficos hasta que me pases los SVG)
- QR WhatsApp RH como placeholder visual hasta que me confirmes el link/número

¿Procedo con las 4 fases en una sola tanda, o prefieres que entregue fase por fase para revisar?
