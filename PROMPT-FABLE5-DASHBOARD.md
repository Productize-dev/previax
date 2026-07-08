# Prompt para Fable 5 (Cursor) — Previax Dashboard

> **Cómo usar este documento:** Pega en Cursor **una fase a la vez**, en orden. Espera a que Fable 5 termine cada fase, revisa/prueba, haz commit, y recién ahí pega la siguiente. No pegues todo junto: por fases el resultado es mucho más limpio y controlable.
>
> **Stack elegido:** Supabase (Auth + Postgres + Storage + RLS) · Capa de IA agnóstica de proveedor · Next.js 16 / React 19 / Tailwind 4 / shadcn (ya en el repo).

---

## Contexto del proyecto (pega esto UNA vez al inicio de la sesión en Cursor)

```
Estás trabajando en "Previax", una app web (Next.js 16 App Router, React 19,
Tailwind 4, shadcn, @base-ui/react) que ayuda a la gente a comprar casas de nueva
construcción, con una interfaz estilo Netflix (rows horizontales, hero con video,
tarjetas). El código ya existe y está bien estructurado. NO reescribas desde cero.
NO cambies el diseño Netflix ni el look & feel; solo extiéndelo.

IMPORTANTE sobre la versión: este Next.js tiene breaking changes respecto a lo que
conoces. Antes de escribir código, lee las guías en `node_modules/next/dist/docs/`
y respeta AGENTS.md.

Arquitectura de datos actual (clave):
- Toda la data pasa por una interfaz `SiteRepository` en
  `src/lib/data/repository.ts`.
- Hoy la implementa `src/lib/data/local-storage-repository.ts` (guarda en
  localStorage bajo la key "previax-data").
- `src/lib/data/index.ts` exporta `repository` y es el ÚNICO punto de intercambio.
- El estado de la app vive en `src/context/data-context.tsx` (admin/catálogo) y
  `src/context/buyer-context.tsx` (comprador: búsqueda, guardados, "sign in" falso).
- Los tipos están en `src/lib/types.ts`: Builder, Series, Community, Home, Lender,
  FeaturedItem, FeaturedCommunityRow, Top10CommunitySlot, AppData, etc.
- Ya existe importación por CSV: `src/lib/csv-catalog-import.ts` +
  `src/components/dashboard/csv-import-manager.tsx`.
- El dashboard vive en `src/app/dashboard/page.tsx` con
  `src/components/dashboard/dashboard-sidebar.tsx` y workspaces por sección
  (builders, communities, lenders, featured, featured-communities, top-10).

Regla de oro: respeta el patrón Repository. Cualquier backend nuevo debe
implementar `SiteRepository` sin romper los componentes que ya lo consumen.

Trabaja en ramas, haz cambios pequeños y verificables, y no borres data ni tipos
existentes sin migrarlos.
```

---

## FASE 1 — Backend real con Supabase (Auth + Postgres + Storage)

```
Objetivo: reemplazar la persistencia en localStorage por Supabase, SIN cambiar la
interfaz pública `SiteRepository` ni los componentes que la consumen.

1. Instala y configura Supabase:
   - `@supabase/supabase-js` y `@supabase/ssr` para Next.js App Router (cliente de
     servidor y de navegador con cookies).
   - Crea `src/lib/supabase/client.ts` (browser) y `src/lib/supabase/server.ts`
     (server components / route handlers), siguiendo el patrón oficial de @supabase/ssr.
   - Variables en `.env.local` (y documenta en `.env.example`):
     NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, y
     SUPABASE_SERVICE_ROLE_KEY (solo servidor).

2. Esquema Postgres: YA existe una migración completa lista en
   `supabase/migrations/0001_init.sql` (tablas, enums, RLS por rol, triggers,
   trigger de creación de perfil, pgvector, bucket de storage). Úsala como base:
   revísala, aplícala, y ajústala si tu mapeo lo requiere. Debe cubrir estas tablas:
   - profiles (id = auth.users.id, role: 'buyer'|'builder'|'lender'|'admin',
     full_name, company_name, avatar_url, created_at)
   - builders, series, communities, homes, lenders, featured_items,
     featured_communities, top10_communities, community_tag_labels
   - Relaciones FK reales (homes.series_id -> series.id, series.builder_id ->
     builders.id, communities.builder_id -> builders.id, etc.).
   - Campos de propiedad: builders.owner_id -> profiles.id,
     lenders.owner_id -> profiles.id (para saber qué cuenta gestiona qué).
   - Guarda arrays/objetos complejos (rooms, reviews, mediaGallery, schools,
     nearbyPlaces, amenities, tags) como columnas jsonb o tablas hijas — elige y
     justifica; prioriza jsonb para las listas embebidas que hoy viven dentro de
     Home/Community para no romper los tipos.

3. Crea `src/lib/data/supabase-repository.ts` que implemente TODA la interfaz
   `SiteRepository` contra Supabase (mapeando snake_case de la DB a los tipos
   camelCase de TS). Cambia SOLO `src/lib/data/index.ts` para exportar el nuevo
   repositorio. Deja el localStorage repo en el archivo por si hace falta fallback.

4. Storage de imágenes: crea un bucket `media` en Supabase Storage. Actualiza
   `src/components/dashboard/image-input.tsx` y `multi-image-input.tsx` para subir
   a Supabase Storage y guardar la URL pública, en vez de data URLs / URLs manuales.

5. Seed: crea un script `scripts/seed.ts` que cargue en Supabase la misma data de
   ejemplo que hoy generan `src/lib/seed-*.ts`, para que el sitio no arranque vacío.

6. Migración de datos: como hoy la data vive en localStorage del navegador, agrega
   un botón temporal en el dashboard "Importar datos locales a la nube" que lea la
   key "previax-data" y los suba vía el repositorio nuevo (one-shot).

Entrega: la app debe compilar y funcionar leyendo/escribiendo desde Supabase, con
el sitio público y el dashboard intactos visualmente. Reporta qué tablas creaste y
cómo correr las migraciones.
```

---

## FASE 2 — Autenticación y roles (buyer / builder / lender / admin)

```
Objetivo: login real con Supabase Auth y control de acceso por rol. Hoy el "sign in"
del comprador (src/components/buyer/sign-in-dialog.tsx + buyer-context.tsx) es falso.

1. Auth con Supabase (email/password + magic link, y opcionalmente Google OAuth).
   - Páginas: `src/app/(auth)/login`, `/signup`, `/logout`, y callback de OAuth.
   - En signup pide el rol deseado. 'buyer' se aprueba solo; 'builder' y 'lender'
     quedan como pending hasta aprobación de un admin (campo profiles.status:
     'active'|'pending'). 'admin' NUNCA por signup público.
   - Reemplaza el sign-in falso del comprador por Supabase Auth real, manteniendo
     la misma UX/estética del diálogo actual.

2. Middleware de sesión: `middleware.ts` con @supabase/ssr para refrescar sesión y
   proteger rutas. Reglas:
   - `/dashboard/**` requiere sesión con rol builder, lender o admin.
   - Cada rol ve SOLO su workspace (ver Fase 3).
   - Usuarios buyer no entran al dashboard.

3. Seguridad a nivel de datos (RLS) en Supabase — esto es crítico:
   - builders/communities/series/homes: un builder solo puede INSERT/UPDATE/DELETE
     los registros cuyo owner_id sea su profile; lectura pública (SELECT) abierta
     para el sitio.
   - lenders: un lender solo edita su(s) propio(s) perfil(es)/ofertas.
   - admin: acceso total (usa una policy basada en profiles.role = 'admin').
   - featured/featured_communities/top10: solo admin escribe.
   Escribe las policies como SQL en `supabase/migrations/`.

4. Helper `getCurrentProfile()` server-side y un hook `useProfile()` client-side que
   expongan { id, role, status }. Úsalos para renderizar navegación condicional.

Entrega: puedo crear cuentas builder/lender (quedan pending), un admin las aprueba,
y cada quien entra a su panel. Explica cómo creo el primer admin (script o SQL).
```

---

## FASE 3 — Dashboard multi-rol profesional

```
Objetivo: convertir el dashboard de un panel único en tres experiencias por rol,
manteniendo el sidebar y los workspaces existentes como base. NO rehagas los
formularios que ya existen (builder-form, community-form, home-form, lender-form,
csv-import-manager); reутilízalos y solo filtra por propiedad.

1. BUILDER (rol builder):
   - Ve solo SUS builders, comunidades, series y modelos de casa.
   - Puede crear/editar comunidades y subir modelos de casa (ya existe la UI;
     conéctala al repo con scope por owner_id).
   - Vista de sus estadísticas básicas (nº de comunidades, nº de modelos, cuáles
     están en Top 10 / Featured).

2. LENDER (rol lender):
   - Panel para gestionar su perfil de lender (ya existe lender-form/lender-list).
   - NUEVO: puede publicar OFERTAS asociadas a comunidades específicas. Crea el
     tipo `LenderOffer` (id, lenderId, communityId, title, rate/APR, terms,
     description, validUntil, imageUrl) + tabla + métodos en `SiteRepository`
     (getLenderOffers, addLenderOffer, updateLenderOffer, deleteLenderOffer).
   - Muestra estas ofertas en la página de la comunidad (integra con
     `src/components/communities/builder-offers.tsx` o crea una sección "Ofertas de
     financiamiento" análoga) y opcionalmente en la row de lenders del home
     (`netflix-lenders-row.tsx`).

3. ADMIN (rol admin):
   - Ve y edita TODO (todos los builders, comunidades, lenders, ofertas).
   - Aprueba/rechaza cuentas builder y lender pending (tabla de usuarios con acción
     de aprobar).
   - Gestiona Featured Carousel, Featured Communities y Top 10 (ya existen).
   - NUEVO "Top 10 de la semana / del mes": extiende el Top 10 con un selector de
     periodo (semana/mes) o hazlo automático (ver Fase 4).
   - Panel de métricas: totales de comunidades, modelos, builders, lenders,
     ofertas activas, y cuentas pendientes de aprobación.

4. Navegación: en `dashboard-sidebar.tsx` renderiza los grupos según rol
   (builder no ve secciones de admin, etc.). Mantén el estilo actual.

Entrega: tres roles con permisos claros, cada formulario existente reutilizado y
con scope de propiedad correcto. Todo con el look actual del dashboard.
```

---

## FASE 4 — Buscador inteligente con IA + personalización (estilo Netflix)

```
Objetivo: que el comprador escriba en lenguaje natural (ej: "casa de 3 recámaras
bajo 400k cerca de buenas escuelas con patio en Austin") y la IA devuelva resultados
filtrados y personalizados, presentados en el formato Netflix ya existente.

1. Capa de IA AGNÓSTICA de proveedor:
   - Crea `src/lib/ai/provider.ts` con una interfaz `AiProvider` (métodos:
     `parseSearch(query, context)` y `embed(text)`), y una implementación por
     defecto seleccionable con env var AI_PROVIDER (openai | anthropic). Todas las
     llamadas a IA pasan por route handlers del servidor (`src/app/api/ai/**`),
     NUNCA exponiendo API keys al cliente.

2. Búsqueda por lenguaje natural (NL -> filtros estructurados):
   - Route handler `POST /api/ai/search`: recibe el texto libre + el perfil del
     usuario y devuelve un JSON de filtros tipado (ciudad, precio min/max, recámaras,
     baños, tags como move-in-ready/single-story/zero-down, escuelas, etc.,
     alineado con HomeTag/CommunityTag/HomeListingCategory de types.ts).
   - Aplica esos filtros sobre el catálogo (idealmente en Postgres). Conecta el
     resultado al `buyer-context.tsx` (searchQuery/cityFilter/offersOnly) y a la
     `hero-search.tsx` / `netflix-hero.tsx` existentes.

3. Búsqueda semántica (recomendado): guarda embeddings de cada comunidad/modelo en
   una columna `vector` (extensión pgvector de Supabase) y ordena por similitud
   además de por filtros exactos, para tolerar sinónimos y descripciones vagas.

4. Personalización estilo Netflix:
   - Usa la actividad del comprador (guardados en buyer-context, ciudades vistas,
     el quiz de `src/components/buyer/guidance-quiz.tsx`/`guidance-form.tsx`) para
     generar rows personalizadas en el home: "Para ti", "Porque guardaste X",
     "En tu presupuesto", "Cerca de buenas escuelas".
   - Crea un endpoint `/api/ai/recommendations` que ordene y arme estas rows, y
     renderízalas con los componentes de row ya existentes
     (`netflix-community-row.tsx`, `netflix-home-row.tsx`).

5. Estados de carga y fallback: si la IA falla o no hay key, cae de forma elegante a
   la búsqueda por filtros actual. Muestra skeletons estilo Netflix mientras carga.

Entrega: barra de búsqueda que entiende lenguaje natural, resultados personalizados
en rows Netflix, y toda la IA detrás de la API del servidor con proveedor
intercambiable.
```

---

## FASE 5 — Automatizar la carga de catálogo (comunidades, casas, modelos)

```
Objetivo: reducir drásticamente el tiempo de dar de alta comunidades y modelos.
Ya existe importación CSV (`csv-catalog-import.ts` + `csv-import-manager.tsx`);
extiéndela y súmale asistencia de IA.

1. Import CSV mejorado: valida, muestra un preview con errores por fila antes de
   confirmar, permite mapear columnas, y soporta actualizar (upsert) además de crear.

2. Carga asistida por IA ("pega y autocompleta"):
   - Un modal donde el builder pega texto libre (brochure, descripción, listado) o
     una URL de la comunidad/modelo, y un endpoint `/api/ai/extract-listing` devuelve
     un borrador estructurado de Community/Home (con tags, highlights, rooms, etc.)
     que precarga el formulario existente para que el builder solo revise y guarde.

3. Generación de contenido: botones "Generar descripción", "Sugerir highlights",
   "Sugerir tags" en community-form/home-form que llamen a la IA con los datos ya
   ingresados. Siempre editable por el usuario.

4. Imágenes: al subir varias fotos, autollenar la galería y sugerir cuál es la
   principal. Opcional: derivar thumbnail desde la URL de YouTube (ya existe
   `src/lib/youtube.ts`).

5. Duplicados: al crear, avisar si ya existe una comunidad/modelo muy similar
   (por nombre/ciudad o por embedding) para evitar repetidos.

Entrega: dar de alta una comunidad con varios modelos debe pasar de muchos minutos
a poco, con CSV masivo o con "pegar y autocompletar" por IA.
```

---

## FASE 6 — Pulido profesional y automatización del dashboard

```
Objetivo: que todo el dashboard se sienta profesional, grande y fácil de manejar,
sin romper el estilo Netflix.

1. Top 10 automático: calcula el ranking (semana/mes) a partir de señales reales
   (vistas, guardados, clics en ofertas). Crea un endpoint/cron (Supabase scheduled
   function o route handler + cron de Vercel) que recompute el Top 10 periódicamente,
   dejando además la opción de override manual del admin.

2. Métricas y overview: mejora `dashboard-overview.tsx` con tarjetas de KPIs y
   mini-gráficas (comunidades activas, modelos, ofertas, cuentas pendientes,
   comunidades más vistas de la semana).

3. Notificaciones/actividad: registra eventos (nueva comunidad, oferta publicada,
   cuenta aprobada) y muéstralos en un feed en el overview del admin.

4. UX del dashboard: estados de carga (skeletons), validación de formularios con
   mensajes claros, confirmaciones de borrado, toasts de éxito/error, tablas con
   búsqueda y orden. Reutiliza los componentes shadcn ya presentes.

5. Calidad: corre `npm run lint` y `npm run build`, arregla errores de tipos, y deja
   el proyecto listo para deploy en Vercel. Documenta variables de entorno en un
   README de setup (Supabase, IA, storage).

Entrega: dashboard profesional, con Top 10 automatizable, KPIs, buena UX y build
limpio para producción.
```

---

## Notas finales para ti (Manuel)

- **Orden importa**: Fase 1 y 2 son la base (sin backend y auth, lo demás no se sostiene). La 4 (IA) y la 5 (automatización) son las que más te ahorran tiempo día a día.
- **Antes de empezar en Cursor**: crea un proyecto en Supabase y ten a la mano las 3 llaves (URL, anon, service_role). Fable las pedirá en la Fase 1.
- **Commit por fase**: haz commit al terminar cada fase para poder volver atrás si algo se rompe.
- Si quieres, en una siguiente iteración te preparo el esquema SQL completo ya escrito, o un prompt extra para tests.
