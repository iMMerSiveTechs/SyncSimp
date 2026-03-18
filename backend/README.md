# Backend Server — Hono, Prisma, Better Auth (Bun)

This backend server powers the Frontend Expo app with a minimal, fast Hono server. It provides authentication via Better Auth, JSON REST endpoints via Hono, and persistence via Prisma+SQLite.

## Stack and key decisions

- Runtime: Bun with TypeScript
- Web framework: Hono 4 with `@hono/node-server`
  - Global middleware: request logger and permissive CORS
  - Health probe at `/health`
- API: Hono routes with Zod validation via `@hono/zod-validator`
- Auth: Better Auth with Expo plugin
  - Mounted at `/api/auth/*`
  - `trustedOrigins` includes the Expo/Vibecode scheme (`vibecode://`) and localhost for development
  - Email + password enabled by default
- Database: Prisma 6 with SQLite (file DB)
  - Schema in `prisma/schema.prisma`
  - Generated client in `generated/prisma`
  - Example models: `User`, `Session`, `Account`, `Profile`, `Verification`
- Validation: Zod for input and optional env validation

## Project layout

```
backend/
├── src/
│   ├── index.ts           # Main server setup (middleware, route mounting, server start)
│   ├── types.ts           # Shared TypeScript types (AppType for context)
│   ├── auth.ts            # Better Auth configuration (DB adapter, plugins, origins)
│   ├── db.ts              # Prisma client instance
│   ├── env.ts             # Zod schema for environment variables
│   └── routes/            # Route modules (organized by feature)
│       ├── sample.ts      # Sample routes (GET/POST examples, auth demo)
│       └── upload.ts      # Image upload routes (multipart handling)
├── prisma/
│   ├── schema.prisma      # Prisma schema (SQLite datasource)
│   ├── dev.db             # SQLite database file
│   └── migrations/        # Database migration history
├── uploads/               # User-uploaded images (served at /uploads/*)
├── package.json
└── README.md
```

## Runtime behavior

### Available Endpoints

**Auth endpoints** (`/api/auth/*`)
- Handled by Better Auth (see their docs for route list and flows)
- Includes sign-up, sign-in, sign-out, session management, etc.

**Sample endpoints** (`/api/sample/*`)
- `GET /api/sample` - Public endpoint, returns `{ message: "Hello, world!" }`
- `GET /api/sample/protected` - Protected endpoint (requires authentication)
- `POST /api/sample` - Validates request body, returns `{ message: "pong" }` when value is "ping"

**Upload endpoints** (`/api/upload/*`)
- `POST /api/upload/image` - Upload an image (multipart/form-data)
  - Field name: `image`
  - Allowed types: JPEG, PNG, GIF, WebP
  - Max size: 10MB
  - Returns: `{ success: true, url: "/uploads/...", filename: "..." }`

**Static files** (`/uploads/*`)
- Serves uploaded images from the `uploads/` directory

**Health check** (`/health`)
- Returns `{ status: "ok" }` for monitoring and load balancers

### Middleware Stack

1. **Request logger** - Logs all incoming requests with method, path, status, and response time
2. **CORS** - Enabled for all routes by default (customize in production)
3. **Auth middleware** - Extracts session from headers and attaches user/session to context

### Logging

The server includes comprehensive logging for debugging and monitoring:
- 🔧 Server initialization and configuration
- 🌐 Middleware setup (CORS, auth, etc.)
- 👤 Authentication events (session found/not found)
- 📤 Upload process (file validation, saving, errors)
- 📝 Route access (sample endpoints)
- 💚 Health checks

All logs use prefixes like `[Upload]`, `[Sample]` for easy filtering.

## Auth configuration

- `src/auth.ts` configures Better Auth with the Prisma adapter and the Expo plugin.
- `trustedOrigins` includes `vibecode://` for the Vibecode-hosted Expo app. If you change the app scheme in `app.json`, update this list.

## Database

- Default: SQLite file at `prisma/dev.db` via `DATABASE_URL=file:dev.db`
- Change the datasource in `prisma/schema.prisma` if you switch databases
- Common workflows:
  - Edit schema → `bunx prisma generate` → `bunx prisma migrate dev --name <migration-name>`

## How to Add New Routes

This template follows a modular route structure. Here's how to add new endpoints:

### 1. Create a new route file in `src/routes/`

```typescript
// src/routes/todos.ts
import { Hono } from "hono";
import { type AppType } from "../types";

const todosRouter = new Hono<AppType>();

todosRouter.get("/", (c) => {
  // Access user context if needed
  const user = c.get("user");
  
  console.log("📋 [Todos] Get all todos requested");
  // Your logic here
  return c.json({ todos: [] });
});

todosRouter.post("/", async (c) => {
  console.log("➕ [Todos] Create new todo requested");
  // Your logic here
  return c.json({ success: true });
});

export { todosRouter };
```

### 2. Mount the router in `src/index.ts`

```typescript
import { todosRouter } from "./routes/todos";

// ... in your app setup
console.log("📋 Mounting todos routes at /api/todos");
app.route("/api/todos", todosRouter);
```

### 3. Key Patterns

- **Use `AppType`** for type-safe context access (`c.get("user")`, `c.get("session")`)
- **Add console logs** with emoji prefixes for visibility (e.g., `[Todos]`)
- **Validate input** with Zod using `@hono/zod-validator`
- **Check auth** by verifying `c.get("user")` is not null
- **Follow naming** convention: `feature.ts` (not `feature.route.ts` or `featureRouter.ts`)

## Scripts

- `bun run dev`: start the backend server in development with hot reload. You don't have to do this since the Vibecode dev backend server will automatically restart the backend server when you make changes to the code.
- `bunx prisma generate`: generate Prisma client
- `bunx prisma migrate dev --name <migration-name>`: sync schema to the database and generate a new Prisma client
- `bun install` also generates the new Prisma client in its postinstall step

## Example: Testing the Upload Endpoint

Using cURL:
```bash
curl -X POST http://localhost:3000/api/upload/image \
  -F "image=@/path/to/your/image.jpg"
```

Using JavaScript:
```javascript
const formData = new FormData();
formData.append('image', imageFile);

const response = await fetch('http://localhost:3000/api/upload/image', {
  method: 'POST',
  body: formData,
});

const result = await response.json();
console.log(result.url); // /uploads/abc-123-def.jpg
```

---

This backend server is intentionally minimal and production-ready with clear seams for growth. The modular route structure makes it easy to add new features, enforce auth where needed, and evolve the schema with Prisma as your data model changes.
