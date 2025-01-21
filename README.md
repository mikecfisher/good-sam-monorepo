# Good Sam Monorepo

A modern, full-stack monorepo built with Next.js, Expo, PayloadCMS, and tRPC.

## Architecture Overview

This monorepo is structured using a modern, modular architecture that separates concerns while maintaining type safety and code reusability across platforms.

### Core Technologies

- **Next.js**: Powers the web application and admin interface
- **Expo**: Mobile application development
- **PayloadCMS**: Headless CMS for content management
- **tRPC**: End-to-end typesafe API layer with direct server access
- **Turborepo**: Monorepo build system
- **pnpm**: Package management
- **AWS SQS**: Message queue for asynchronous processing
- **Vercel**: Hosting and serverless functions

### Directory Structure

```
├── apps/
│   ├── nextjs/          # Next.js web application
│   ├── expo/            # Mobile application
│   └── auth-proxy/      # Authentication proxy service for Oauth specific to mobile app
├── packages/
│   ├── api/            # Shared API layer and tRPC routes
│   ├── auth/           # Authentication utilities
│   ├── db/             # Database schemas and utilities
│   ├── ui/             # Shared component library
│   └── validators/     # Shared validation schemas
```

### Key Components

#### Web Application (apps/nextjs)

- Built with Next.js App Router
- Integrates PayloadCMS for content management
- Custom admin interface
- Server-side rendering capabilities

#### Mobile Application (apps/expo)

- Cross-platform mobile app using Expo
- Shares components with web via the UI package
- Consistent user experience across platforms

#### Component Library (packages/ui)

- Shared UI components
- Platform-agnostic design system
- Reusable across web and mobile

#### API Layer (packages/api)

- tRPC for type-safe client-server communication
- Shared business logic
- API route definitions

#### Authentication (packages/auth)

- Centralized authentication logic
- Secure session management
- Cross-platform auth utilities

#### Database Layer (packages/db)

- Database schema definitions
- Migration utilities
- Shared data access patterns

### Client-Server Communication

- tRPC provides end-to-end type safety
- PayloadCMS REST API for content management
- Type definitions shared across all applications
- Secure authentication via auth-proxy

### Development Workflow

- Turborepo manages the build pipeline
- Shared ESLint and TypeScript configurations
- Hot module reloading across all applications
- Unified package management with pnpm

### Vercel Deployment Architecture

The application is hosted on Vercel's edge network, utilizing several key features:

#### Components Running on Vercel

1. **Next.js Application**

   - Runs as serverless functions and edge functions
   - Server-side rendering (SSR) at the edge
   - API routes deployed as serverless functions
   - Static assets served from Vercel's CDN

2. **PayloadCMS Admin**

   - Admin interface served through Next.js routes
   - CMS operations run as serverless functions
   - Media uploads handled through Vercel's serverless functions

3. **tRPC Endpoints**

   - API routes deployed as serverless functions
   - Automatic scaling based on demand
   - Edge function support for low-latency responses

4. **Auth Proxy**
   - OAuth handling for mobile app authentication
   - Runs as edge functions for global low-latency

#### Deployment Configuration

- Automatic deployments from main branch
- Preview deployments for pull requests
- Environment variable management through Vercel dashboard
- Automatic SSL/TLS certificate management
- Global CDN for static assets
- Edge caching for improved performance

### AWS SQS Integration

The application uses AWS SQS for reliable asynchronous message processing:

#### Queue Architecture

1. **Message Producers**

   - Vercel serverless functions send messages to SQS
   - Messages are sent using AWS SDK v3
   - Structured payloads with type safety
   - Automatic retries on failure

2. **Message Consumers**
   - Long-polling consumers for efficient message retrieval
   - Dead letter queues (DLQ) for failed message handling
   - Automatic scaling based on queue depth
   - Message visibility timeout management

#### Implementation Details

- AWS SDK configuration in serverless functions
- Queue URL and credentials managed via environment variables
- Message batching for improved performance
- Error handling and monitoring
- TypeScript types for message payloads

```typescript
// Example SQS message structure
interface SQSMessage {
  type: "EVENT_TYPE";
  payload: {
    // Type-safe payload structure
    id: string;
    data: unknown;
  };
  metadata: {
    timestamp: number;
    source: string;
  };
}
```

### Environment Setup

See `.env.example` for required environment variables.

## Getting Started

1. Install dependencies:

```bash
pnpm install
```

2. Start development servers:

```bash
pnpm dev
```

This will start all applications in development mode.

For web only:

```bash
pnpm dev:next
```

## Build

```bash
pnpm build
```

Builds all applications and packages.

### tRPC Architecture

The application uses tRPC for type-safe API communication between the client and server, with additional special integration for Next.js Server Components.

#### Overview

tRPC enables end-to-end typesafe APIs by sharing type definitions between the client and server. This means:

- No manual API documentation needed
- Automatic type inference for API calls
- Compile-time error checking for API usage
- Autocomplete in your IDE for API endpoints

#### Implementation Layers

1. **Server Procedures**

   - Defined in the `packages/api` directory
   - Type-safe input validation using Zod
   - Strongly typed request handlers
   - Middleware support for authentication and validation

2. **Client Integration**

   - Type-safe API client generation
   - Automatic request batching
   - Built-in error handling
   - React Query integration for data fetching

3. **Next.js Server Components**
   - Direct server-to-server communication
   - No HTTP requests for server components
   - Improved performance by eliminating network overhead
   - Shared types between client and server

#### Example Usage

```typescript
// Server procedure definition
const userRouter = router({
  getUser: publicProcedure
    .input(z.string())
    .query(async ({ input }) => {
      return await db.user.findUnique({ where: { id: input } });
    })
});

// Client component usage
function UserProfile({ userId }: { userId: string }) {
  const { data } = api.user.getUser.useQuery(userId);
  return <div>{data?.name}</div>;
}

// Server Component usage
async function UserServer({ userId }: { userId: string }) {
  // Direct server access - no API request
  const user = await serverApi.user.getUser(userId);
  return <div>{user.name}</div>;
}
```

#### Benefits

1. **Type Safety**

   - Full type inference from backend to frontend
   - Catch errors at compile time
   - Autocompletion for API endpoints
   - No runtime type checking needed

2. **Developer Experience**

   - Single source of truth for API types
   - Automatic API documentation
   - IDE support with TypeScript
   - Simplified refactoring

3. **Performance**

   - Request batching
   - Direct server access in Server Components
   - Optimized data fetching with React Query
   - Minimal bundle size

4. **Server Components Integration**
   - Zero-API-call data fetching
   - Reduced client-side JavaScript
   - Improved initial page load
   - Better SEO with server-side rendering

#### Architecture Patterns

1. **Route Definition**

   - Centralized router configuration
   - Modular procedure organization
   - Reusable middleware
   - Input validation with Zod

2. **Data Flow**

   ```
   Client Component → tRPC Client → HTTP → tRPC Server → Database
   Server Component → Direct tRPC Server Access → Database
   ```

3. **Error Handling**

   - Type-safe error responses
   - Custom error classes
   - Client-side error handling
   - Automatic retry logic

4. **Security**
   - Authentication middleware
   - Input sanitization
   - CSRF protection
   - Rate limiting

#### HTTP API Compatibility

The tRPC implementation is designed with future compatibility in mind, allowing for potential migration to standard HTTP endpoints. This is achieved through a modular architecture that separates core business logic from the tRPC transport layer.

1. **Current Structure**

   ```
   packages/api/
   ├── src/
   │   ├── router/           # Domain-specific routers
   │   │   ├── auth.ts       # Authentication routes
   │   │   ├── post.ts       # Post management routes
   │   │   └── notification.ts # Notification routes
   │   ├── trpc.ts          # tRPC configuration
   │   └── root.ts          # Root router assembly
   ```

2. **Migration Path to HTTP**

   - Business logic is isolated in router files
   - Input validation using Zod is transport-agnostic
   - Response types are clearly defined
   - Middleware can be reused for HTTP endpoints

3. **HTTP Endpoint Creation**

   ```typescript
   // Current tRPC procedure
   export const postRouter = createTRPCRouter({
     create: protectedProcedure
       .input(PostSchema)
       .mutation(async ({ input, ctx }) => {
         return await createPost(input, ctx.user);
       }),
   });

   // Future HTTP endpoint
   export async function handlePostCreate(req: Request, res: Response) {
     const input = await PostSchema.parseAsync(req.body);
     const user = await validateAuth(req);
     const result = await createPost(input, user);
     return res.json(result);
   }
   ```

4. **Shared Components**

   - Input validation schemas
   - Business logic functions
   - Type definitions
   - Authentication middleware
   - Error handling

5. **Benefits of This Approach**

   - Gradual migration possibility
   - Can run both tRPC and HTTP in parallel
   - Preserve type safety during transition
   - Reuse existing business logic

6. **HTTP API Generation**
   - OpenAPI schema generation from types
   - Automatic documentation
   - Client SDK generation
   - API versioning support

This architecture ensures that while we benefit from tRPC's excellent developer experience and type safety, we're not locked into the framework. The business logic and validation layers can be exposed through traditional HTTP endpoints when needed, such as for:

- Third-party integrations requiring REST APIs
- Public API access
- Legacy system compatibility
- Alternative client implementations
