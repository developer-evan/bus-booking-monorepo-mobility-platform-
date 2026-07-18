# Bus Booking Backend

NestJS REST API for a bus ticket booking platform. Operators schedule trips on routes using a fleet of buses; customers search trips and book seats. Authentication is JWT-based with role-based access control.

## Tech Stack


| Layer      | Technology                                                   |
| ---------- | ------------------------------------------------------------ |
| Framework  | [NestJS 11](https://nestjs.com/)                             |
| Database   | [MongoDB](https://www.mongodb.com/)                          |
| ODM        | [Mongoose 9](https://mongoosejs.com/) via `@nestjs/mongoose` |
| Auth       | JWT + Passport (`passport-jwt`, `bcrypt`)                    |
| Validation | `class-validator` + `class-transformer`                      |
| API Docs   | Swagger (`@nestjs/swagger`)                                  |
| Monorepo   | [Nx](https://nx.dev/)                                        |


---



## Architecture

High-level view of how a request moves through the system:

```mermaid
flowchart TB
  Client["Client / Frontend"]
  Swagger["Swagger UI<br/>/docs"]
  Nest["NestJS App<br/>global prefix: /api"]
  Guards["Global Guards<br/>JwtAuthGuard → RolesGuard"]
  Controllers["Feature Controllers<br/>auth · users · buses · routes · trips · bookings"]
  Services["Domain Services<br/>business logic"]
  Mongoose["Mongoose ODM"]
  MongoDB[("MongoDB")]

  Client --> Nest
  Swagger --> Nest
  Nest --> Guards
  Guards --> Controllers
  Controllers --> Services
  Services --> Mongoose
  Mongoose --> MongoDB
```





### Module layout

Each domain is a self-contained NestJS feature module:

```
src/
├── main.ts                 # Bootstrap, ValidationPipe, Swagger
├── app/                    # Root module + health check
├── config/                 # Env config + Joi validation
├── database/               # Mongoose connection
├── common/                 # Shared guards, decorators, interfaces
└── modules/
    ├── auth/               # Register, login, JWT strategy
    ├── users/              # User CRUD (admin)
    ├── buses/              # Fleet management
    ├── routes/             # Origin → destination templates
    ├── trips/              # Scheduled departures
    ├── bookings/           # Seat reservations
    └── payments/           # Schema only (not wired yet)
```

```mermaid
flowchart LR
  subgraph app [AppModule]
    Auth[AuthModule]
    Users[UsersModule]
    Buses[BusesModule]
    Routes[RoutesModule]
    Trips[TripsModule]
    Bookings[BookingsModule]
    DB[DatabaseModule]
    Config[ConfigModule]
  end

  Auth --> Users
  Trips --> Buses
  Trips --> Routes
  Bookings --> Trips
  Bookings --> Users
  DB --> Config
```



---



## Domain Model

Entities and how they relate:

```mermaid
erDiagram
  User ||--o{ Booking : makes
  Route ||--o{ Trip : "scheduled on"
  Bus ||--o{ Trip : "assigned to"
  Trip ||--o{ Booking : "has"
  Booking ||--o| Payment : "paid via (planned)"

  User {
    string fullName
    string email
    string password
    string phone
    enum role "customer | operator | admin"
    boolean isActive
  }

  Route {
    string origin
    string destination
    string originStation
    string destinationStation
    number distanceKm
    number estimatedDurationMinutes
    boolean isActive
  }

  Bus {
    string plateNumber
    string model
    number seatCapacity
    enum busType
    enum status
  }

  Trip {
    ObjectId route
    ObjectId bus
    datetime departureTime
    datetime arrivalTime
    number pricePerSeat
    number availableSeats
    enum status
  }

  Booking {
    ObjectId user
    ObjectId trip
    string[] seatNumbers
    number passengerCount
    number totalPrice
    string bookingReference
    enum status
  }
```



**Key design decisions**

- **Route vs Trip** — A route is a reusable template (e.g. Nairobi → Mombasa). A trip is one scheduled run on a specific date with a specific bus.
- **Seat inventory on Trip** — `availableSeats` lives on the trip document and decrements on booking, so concurrent reservations don't lock the bus document.
- **Booking reference** — Human-readable code (`BB-XXXXXX`) separate from MongoDB `_id`, for support and confirmations.
- **Payments** — Schema exists under `modules/payments/` but is not registered in `AppModule` yet. Bookings are auto-confirmed without payment for now.

---



## Design Flows



### 1. Authentication flow

```mermaid
sequenceDiagram
  participant C as Client
  participant A as AuthController
  participant S as AuthService
  participant U as UsersService
  participant DB as MongoDB

  C->>A: POST /api/auth/register
  A->>S: register(dto)
  S->>U: create(user, role=customer)
  U->>DB: hash password + save
  S-->>C: { accessToken, user }

  C->>A: POST /api/auth/login
  A->>S: login(dto)
  S->>U: findByEmailWithPassword
  S->>S: bcrypt.compare
  S-->>C: { accessToken, user }

  C->>A: GET /api/auth/me (Bearer token)
  A->>S: getProfile(userId)
  S-->>C: user (no password)
```



Every protected request passes through global guards:

1. `JwtAuthGuard` — Validates Bearer token unless route is marked `@Public()`.
2. `RolesGuard` — Checks `@Roles(...)` metadata against the user's role.



### 2. Operator setup flow

Operators and admins prepare inventory before customers can book:

```mermaid
flowchart TD
  A[Create Route<br/>POST /api/routes] --> B[Create Bus<br/>POST /api/buses]
  B --> C[Schedule Trip<br/>POST /api/trips]
  C --> D[Trip available<br/>GET /api/trips]
```



When a trip is created:

- Route and bus must exist; bus must be `active`.
- `availableSeats` defaults to the bus `seatCapacity`.
- `arrivalTime` must be after `departureTime`.



### 3. Customer booking flow

```mermaid
sequenceDiagram
  participant C as Customer
  participant T as TripsController
  participant B as BookingsController
  participant BS as BookingsService
  participant TS as TripsService
  participant DB as MongoDB

  C->>T: GET /api/trips?origin=Nairobi&destination=Mombasa
  T-->>C: available trips (public)

  C->>B: POST /api/bookings { trip, seatNumbers }
  B->>BS: create(userId, dto)
  BS->>DB: check seat conflicts
  BS->>TS: reserveSeats(count)
  BS->>DB: save booking (status=confirmed)
  BS-->>C: booking + reference
```



On cancellation (`PATCH /api/bookings/:id/status` → `cancelled`):

- Seats are released back to the trip via `releaseSeats`.
- Only active bookings (`pending` / `confirmed`) restore inventory.

---



## Roles & Permissions


| Action                             | Public | Customer   | Operator | Admin |
| ---------------------------------- | ------ | ---------- | -------- | ----- |
| Register / Login                   | ✓      |            |          |       |
| Health check `GET /api`            | ✓      |            |          |       |
| Browse buses, routes, trips        | ✓      | ✓          | ✓        | ✓     |
| Create/update buses, routes, trips |        |            | ✓        | ✓     |
| Delete buses, routes, trips        |        |            |          | ✓     |
| Book seats                         |        | ✓          |          |       |
| View own bookings                  |        | ✓          |          |       |
| View all bookings                  |        |            | ✓        | ✓     |
| Update booking status              |        | cancel own | ✓        | ✓     |
| User management                    |        |            |          | ✓     |


**Bootstrap first admin** — Register via `/api/auth/register`, then promote in MongoDB:

```js
db.users.updateOne(
  { email: "you@example.com" },
  { $set: { role: "a dmin" } }
)
```

---



## API Reference

Base URL: `http://localhost:3000/api`  
Interactive docs: `http://localhost:3000/docs`

### Auth


| Method | Path             | Auth   | Description             |
| ------ | ---------------- | ------ | ----------------------- |
| POST   | `/auth/register` | Public | Create customer account |
| POST   | `/auth/login`    | Public | Get JWT                 |
| GET    | `/auth/me`       | JWT    | Current profile         |




### Users


| Method | Path         | Auth         | Description            |
| ------ | ------------ | ------------ | ---------------------- |
| POST   | `/users`     | Admin        | Create user (any role) |
| GET    | `/users`     | Admin        | List users             |
| GET    | `/users/:id` | Admin / self | Get user               |
| PATCH  | `/users/:id` | Admin / self | Update user            |
| DELETE | `/users/:id` | Admin        | Delete user            |




### Buses


| Method | Path         | Auth      | Description |
| ------ | ------------ | --------- | ----------- |
| GET    | `/buses`     | Public    | List buses  |
| GET    | `/buses/:id` | Public    | Get bus     |
| POST   | `/buses`     | Operator+ | Create bus  |
| PATCH  | `/buses/:id` | Operator+ | Update bus  |
| DELETE | `/buses/:id` | Admin     | Delete bus  |




### Routes


| Method | Path          | Auth      | Description                                |
| ------ | ------------- | --------- | ------------------------------------------ |
| GET    | `/routes`     | Public    | List routes (filter by origin/destination) |
| GET    | `/routes/:id` | Public    | Get route                                  |
| POST   | `/routes`     | Operator+ | Create route                               |
| PATCH  | `/routes/:id` | Operator+ | Update route                               |
| DELETE | `/routes/:id` | Admin     | Delete route                               |




### Trips


| Method | Path         | Auth      | Description                      |
| ------ | ------------ | --------- | -------------------------------- |
| GET    | `/trips`     | Public    | Search trips                     |
| GET    | `/trips/:id` | Public    | Get trip (populated route + bus) |
| POST   | `/trips`     | Operator+ | Schedule trip                    |
| PATCH  | `/trips/:id` | Operator+ | Update trip                      |
| DELETE | `/trips/:id` | Admin     | Delete trip                      |




### Bookings


| Method | Path                   | Auth     | Description    |
| ------ | ---------------------- | -------- | -------------- |
| POST   | `/bookings`            | Customer | Book seats     |
| GET    | `/bookings`            | JWT      | List bookings  |
| GET    | `/bookings/:id`        | JWT      | Get booking    |
| PATCH  | `/bookings/:id/status` | JWT      | Update status  |
| DELETE | `/bookings/:id`        | Admin    | Delete booking |


---



## Getting Started



### Prerequisites

- Node.js 20+
- MongoDB running locally or a MongoDB Atlas URI



### Environment

Copy the example env file:

```bash
cp apps/backend/.env.example apps/backend/.env
```


| Variable         | Required | Description                           |
| ---------------- | -------- | ------------------------------------- |
| `NODE_ENV`       | No       | `development` / `production` / `test` |
| `PORT`           | No       | Server port (default `3000`)          |
| `MONGODB_URI`    | Yes      | MongoDB connection string             |
| `JWT_SECRET`     | Yes      | Secret for signing JWTs               |
| `JWT_EXPIRES_IN` | No       | Token lifetime (default `1d`)         |




### Run

From the monorepo root:

```bash
# Install dependencies
npm install

# Start dev server
npx nx serve backend
```

Other tasks:

```bash
npx nx run @org/backend:build
npx nx run @org/backend:test
npx nx run @org/backend:lint
```



### Quick test via Swagger

1. Open [http://localhost:3000/docs](http://localhost:3000/docs)
2. `POST /api/auth/register` — create a customer
3. Copy `accessToken` from the response
4. Click **Authorize** → paste `Bearer <token>`
5. Try protected endpoints

---



## Project Conventions

- **DTOs** — Request validation with `class-validator`; Swagger decorators on the same classes.
- **Schemas** — Mongoose classes in `modules/*/schemas/` using `@nestjs/mongoose` decorators.
- **Guards** — Applied globally; opt out with `@Public()`, restrict with `@Roles()`.
- **Passwords** — Hashed with bcrypt (10 rounds); excluded from queries via `select: false`.
- **Errors** — Standard NestJS exceptions (`NotFoundException`, `ConflictException`, etc.).

---



## Roadmap

- [ ] **Payments module** — Wire schema, link to bookings, payment status webhooks
- [ ] **Seed script** — Sample routes, buses, trips for development
- [ ] **Pagination** — List endpoints currently return full result sets
- [ ] **E2E tests** — API integration tests against a test database