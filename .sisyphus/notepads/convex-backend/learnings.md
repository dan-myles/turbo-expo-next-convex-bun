# Effect.ts Library Patterns for Convex Backend

## 1. Effect.fn - Function Definition with Tracing
**Purpose**: Wraps functions with automatic tracing/telemetry support

**Evidence** ([unionlabs/union](https://github.com/unionlabs/union/blob/main/ts-sdk-evm/src/Evm.ts#L74)):
```typescript
export const channelBalance = Effect.fn("Evm.channelBalance")((path: bigint, token: Hex) =>
  pipe(
    ChannelDestination,
    Effect.andThen((config) =>
      readContract({
        address: config.ucs03address,
        // ...
      })
    )
  )
)
```

**Pattern**: `Effect.fn(traceName)(implementation)` - Creates a traced function
**Use in Convex**: Wrap Convex query/mutation handlers for observability

---

## 2. Effect.gen - Generator-Based Effects
**Purpose**: Write async/effectful code with generator syntax (like async/await)

**Evidence** ([Effect docs](https://effect.website/docs/getting-started/using-generators)):
```typescript
const program = Effect.gen(function*() {
  const transactionAmount = yield* fetchTransactionAmount
  const discountRate = yield* fetchDiscountRate
  const discountedAmount = yield* applyDiscount(transactionAmount, discountRate)
  const finalAmount = addServiceCharge(discountedAmount)
  return `Final amount to charge: ${finalAmount}`
})
```

**Pattern**: Use `yield*` to unwrap Effects, return final value
**Use in Convex**: Main pattern for query/mutation bodies with multiple async operations

---

## 3. Effect.tryPromise - Wrapping Async Operations
**Purpose**: Convert Promise-based APIs to Effect with error handling

**Evidence** ([unionlabs/union](https://github.com/unionlabs/union/blob/main/ts-sdk/src/sui/sui_coin.ts#L23-L37)):
```typescript
const coins = yield* Effect.tryPromise({
  try: async () => {
    const result = await client.getCoins(params)
    return result.data
  },
  catch: err => new ReadCoinError({ cause: err })
})
```

**Pattern**: `Effect.tryPromise({ try: async () => ..., catch: (err) => new CustomError() })`
**Use in Convex**: Wrap Convex database calls, external API calls

---

## 4. Effect.provide - Dependency Injection
**Purpose**: Supply dependencies/services to Effects

**Evidence** ([Effect source](https://github.com/Effect-TS/effect/blob/7b8165f45779380fea8ac8e09badef898b63eb41/packages/effect/src/Effect.ts#L7530)):
```typescript
const runnable = Effect.provide(program, DatabaseLive)
```

**Pattern**: `Effect.provide(effect, layer)` - Injects dependencies
**Use in Convex**: Provide database context, configuration to handlers

---

## 5. Effect.runPromise - Running Effects
**Purpose**: Execute an Effect and get a Promise result

**Evidence** ([Effect docs](https://effect.website/docs/getting-started/using-generators)):
```typescript
Effect.runPromise(program).then(console.log)
```

**Pattern**: `Effect.runPromise(effect)` - Returns Promise<A>
**Use in Convex**: Execute Effect-based handlers in Convex mutation/query wrappers

---

## 6. Context.Tag - Service Definition
**Purpose**: Define typed service dependencies

**Evidence** ([unionlabs/union](https://github.com/unionlabs/union/blob/main/ts-sdk-cosmos/src/Cosmos.ts#L84-L91)):
```typescript
export class ChannelDestination extends Context.Tag("@unionlabs/sdk/Cosmos/ChannelDestination")<
  ChannelDestination,
  Cosmos.Channel
>() {
  static Live = flow(
    ChannelDestination.of,
    Layer.succeed(this),
  )
}
```

**Pattern**: `class ServiceName extends Context.Tag(id)<ServiceName, ServiceType>() {}`
**Use in Convex**: Define database, auth, config services

---

## 7. Layer.succeed - Creating Layers
**Purpose**: Create a Layer that provides a service implementation

**Evidence** ([Effect source](https://github.com/Effect-TS/effect/blob/7b8165f45779380fea8ac8e09badef898b63eb41/packages/rpc/src/RpcSerialization.ts#L397)):
```typescript
export const layerJson: Layer.Layer<RpcSerialization> = Layer.succeed(RpcSerialization, json)
```

**Pattern**: `Layer.succeed(Tag, implementation)` - Creates a layer
**Use in Convex**: Create layers for Convex database client, auth context

---

## 8. Data.TaggedError - Typed Errors
**Purpose**: Define discriminated union error types

**Evidence** ([unionlabs/union](https://github.com/unionlabs/union/blob/main/app2/src/lib/dashboard/errors.ts#L10-L20)):
```typescript
export class SupabaseClientError extends Data.TaggedError("SupabaseClientError")<BaseErrorArgs> {}
export class ChainError extends Data.TaggedError("ChainError")<BaseErrorArgs> {}
export class CategoryError extends Data.TaggedError("CategoryError")<BaseErrorArgs> {}
```

**Pattern**: `class ErrorName extends Data.TaggedError(tag)<ErrorFields> {}`
**Use in Convex**: Define domain-specific errors (ValidationError, NotFoundError, etc.)

---

## Convex Integration Pattern

**Recommended Structure**:
```typescript
// services.ts - Define services
export class ConvexDB extends Context.Tag("ConvexDB")<ConvexDB, DatabaseReader> {}

// errors.ts - Define errors
export class NotFoundError extends Data.TaggedError("NotFoundError")<{ id: string }> {}

// queries.ts - Use Effect.gen
export const getUser = Effect.fn("queries.getUser")((userId: string) =>
  Effect.gen(function*() {
    const db = yield* ConvexDB
    const user = yield* Effect.tryPromise({
      try: () => db.get(userId),
      catch: () => new NotFoundError({ id: userId })
    })
    return user
  })
)

// convex/users.ts - Convex handler wrapper
export const get = query({
  args: { userId: v.string() },
  handler: async (ctx, args) => {
    const program = getUser(args.userId).pipe(
      Effect.provide(Layer.succeed(ConvexDB, ctx.db))
    )
    return Effect.runPromise(program)
  }
})
```

**Key Benefits**:
- Type-safe error handling
- Testable business logic (separate from Convex runtime)
- Composable effects
- Built-in tracing/observability
- Dependency injection for testing
