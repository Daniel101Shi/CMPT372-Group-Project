# Lopo

CMPT 372, Group 9.

| | |
|---|---|
| Repository | https://github.com/Daniel101Shi/CMPT372-Group-Project |
| Deployed app | http://35.247.26.149/ |
| GCP project ID | `andy-wang-372` |

Daniel Shi, Abdi, Andy Wang, Nico, Eshean.

## The problem

SFU students coordinate schedules by trading screenshots in group chats. Comparing five of
them by eye to find a free hour is tedious and goes stale the moment someone drops a course.

MySchedule already solves *building* a schedule. Nothing solves *sharing* one.

## What Lopo does

You enter your courses once a semester and mark when you're free on campus. Your friends can
then see your schedule without asking. Group friends into a "pack" and you get a single weekly
calendar overlaying everyone's availability, where darker tiles mean more people are busy, so
open time is obvious at a glance.

## Features

**Accounts and sessions.** Registration with unique usernames and bcrypt hashed passwords.
Sessions are cookie based and stored in Postgres, so a backend restart or redeploy doesn't log
everyone out. The app restores your session on load and clears it by itself if the account
behind it was deleted.

**Profiles.** Username, join date, friend count, pack count. Contact info is only visible to
you and to confirmed friends.

**Friends.** Search for students, send requests, and manage incoming and outgoing ones from a
dashboard. Accept, decline, cancel, or unfriend. Once you're friends you can open each other's
calendars.

**Packs.** Create a group from your friends for a given semester and year, then view a heatmap
of the whole group's availability. Click a slot to see exactly who is free. Packs are editable
and deletable by whoever made them.

**Schedule builder.** Pulls live course data from SFU's public Course Outlines API, so you pick
from courses actually offered that term. Save your courses and paint your free time on a weekly
grid.

**Schedule viewer.** Combines your saved courses with meeting times fetched from SFU and renders
them on a Monday to Friday calendar, 8am to 7pm, with a colourblind safe palette and a term
switcher. Works for your friends' schedules too. Prints or exports to PDF.

**Admin panel.** Admins can list every account, promote and demote users, and delete accounts.
Regular users hitting an admin route get a 403.

## Running it locally

You need Docker.

```bash
git clone https://github.com/Daniel101Shi/CMPT372-Group-Project
cd CMPT372-Group-Project
cp .env.example .env
```

Set `SESSION_SECRET` in `.env`. Compose refuses to start without it.

```bash
openssl rand -hex 32
```

Then:

```bash
docker compose up --build
docker compose exec backend npm run seed    # optional, adds demo accounts
```

Frontend on http://localhost:5173, backend on http://localhost:3001, Postgres on 5432.

If you already run Postgres locally on 5432, set `POSTGRES_PORT` in `.env` to something like
5433. That only changes the host side, the containers still reach each other on 5432.

### Demo accounts

Created by `npm run seed`. Password for all of them is `password123`.

| Username | Role | What they have |
|---|---|---|
| admin | admin | access to the admin panel |
| daniel | user | 3 courses, a pack, one friendship of every kind |
| priya | user | 2 courses, friends with daniel |
| ellie | user | 3 courses, friends with daniel, in his pack |
| marcus | user | 2 courses, pending request to daniel |

Log in as `daniel` for the fullest account, `admin` to see the admin panel, or `marcus` to see
a pending request from the other side.

### Schema changes

Postgres only runs `schema.sql` when the data directory is empty, so pulling a change to it
means dropping the volume:

```bash
docker compose down -v && docker compose up --build
docker compose exec backend npm run seed
```

## Tests

```bash
cd backend
npm test
```

115 tests on Vitest. Mostly unit tests over controllers, middleware and validators with the
database layer mocked, plus 6 integration tests that drive the real Express app over HTTP with
Supertest.

```bash
npm run test:watch           # reruns on save
npm test -- authController   # a single file
```

### Stack

React 19, Vite 8, React Router 7, TypeScript on the frontend. Express 5, TypeScript, Node 22 on
the backend. PostgreSQL 16 queried through `pg` with no ORM. Sessions via `express-session` and
`connect-pg-simple`, passwords via bcrypt.

## API

Base path `/api`. Authentication is a session cookie, so browser requests need
`credentials: "include"` and curl needs `-c`/`-b` to save and send a cookie jar.

Unless stated otherwise, endpoints require a login and return `401 UNAUTHORIZED` without one.

### Error format

```json
{ "error": { "code": "FORBIDDEN", "message": "You do not have permission to perform this action." } }
```

Validation errors add a `field` naming the offending input:

```json
{ "error": { "code": "INVALID_INPUT", "message": "Password must be at least 8 characters long.", "field": "password" } }
```

`userController` and `friendshipController` still return the older `{"error": "a string"}`
shape. The frontend handles both through `frontend/src/utils/apiError.ts`. Unifying them is on
the list.

---

### Auth

#### `POST /api/auth/register`
No login required. Creates the account and logs you straight in.

```json
{ "username": "danielshi", "password": "password123", "contactInfo": "daniel@sfu.ca" }
```

`contactInfo` is optional. Username is 3 to 50 characters, letters, numbers and `. _ -` only.
Password is 8 to 72 bytes (bcrypt ignores anything past 72). Unexpected fields are rejected, so
you cannot set your own `role`.

`201` → `{ "message": "...", "user": { "user_id": 7, "username": "danielshi", "contact_info": null, "role": "user" } }`

Errors: `400 INVALID_INPUT` (with `field`), `400 MALFORMED_BODY` if the request isn't JSON,
`409 USERNAME_TAKEN`.

#### `POST /api/auth/login`
No login required. Body `{ "username", "password" }`.

`200` → `{ "message": "...", "user": {...} }`, never including `password_hash`.

`401 INVALID_CREDENTIALS` for both a wrong password and a username that doesn't exist. The two
responses are byte identical on purpose, so nobody can use it to work out which accounts are
real.

#### `POST /api/auth/logout`
Destroys the session and clears the cookie. `200`.

#### `GET /api/auth/me`
No login required. Returns `{ "user": {...} }` or `{ "user": null }` with a `200` either way.
Being logged out is a normal answer here, not an error, because the frontend calls this on
every page load. If the session points at a deleted account it clears itself.

---

### Users and friends

#### `GET /api/users/search?query=`
`200` → `{ "users": [ { "user_id", "username", "packCount", "isOwnProfile" } ] }`

#### `GET /api/users/:userId/profile`
`200` → `{ "profile": { "user_id", "username", "contact_info", "created_at", "packCount", "friendsCount", "isOwnProfile", "relationshipStatus", "canViewContactInfo" } }`

`relationshipStatus` is one of `self`, `none`, `friends`, `incoming_request`,
`outgoing_request`. `contact_info` comes back `null` unless it's your own profile or you are
confirmed friends.

Errors: `400` for a non numeric id, `404` if no such user.

#### `GET /api/friendships`
`200` → `{ "currentFriends": [...], "incomingPendingRequests": [...], "outgoingPendingRequests": [...] }`

#### `POST /api/friendship/request`
Body `{ "requesterId": 7, "recipientId": 12 }`. `201` on success.

Errors: `400` if the ids aren't integers or are the same user, `404` if either doesn't exist,
`409` if a request or friendship already exists.

#### `PATCH /api/friendships/accept`
Body `{ "requesterId", "recipientId" }`. `200`.
Errors: `404` if there's no pending request, `409` if already friends.

#### `DELETE /api/friendships`
Body `{ "requesterId", "recipientId" }`. `200`. Used for declining, cancelling and unfriending,
since all three are the same operation on the row. `404` if no such friendship.

---

### Schedules

#### `GET /api/schedule/:year/:semester`
`semester` is `spring`, `summer` or `fall`.

`200` → `{ "taking": [ { "department", "course_number", "section" } ], "campus_schedule": "0101..." }`

`campus_schedule` is 336 characters of `0` and `1`, 7 days of 48 half hour slots, indexed day
major (`day * 48 + slot`).

#### `POST /api/schedule/:year/:semester`
Replaces both your courses and your availability for that term.

```json
{ "courses": [ { "department": "CMPT", "course_number": "354", "section": "D100" } ],
  "availability": "0101... (336 chars)" }
```

`201` → the same shape as the GET. Runs in a transaction, so a bad request changes nothing.
`400` for an invalid year or semester, or availability that isn't 336 characters.

#### `GET /api/getcourse/:term`
Your saved courses joined with live meeting times from the SFU API.

`200` → `{ "courses": [ { "department", "courseNumber", "section", "title", "schedule": [...] } ] }`

`title` and `schedule` come back empty if SFU has no outline for that offering, which happens
for courses not actually running that term.

#### `GET /api/getfriendscourse/:term`
The same, for every confirmed friend.

---

### Packs

#### `GET /api/packs/get-packs/:owner_id`
Packs you own. The path parameter is ignored, the session decides.
`200` → `{ "packs": [ { "pack_id", "owner_id", "group_name", "semester", "year" } ] }`

#### `GET /api/packs/get-pack-data/:owner_id/:pack_id`
Everyone in the pack with their availability, which is what the heatmap draws.
`200` → `{ "pack_data": [ { "user_id", "username", "contact_info", "campus_schedule", "created_at" } ] }`
`400` if you don't own the pack, `404` if it doesn't exist.

#### `GET /api/packs/get-pack-members/:pack_id`
`200` → `{ "members": [ { "pack_id", "user_id" } ] }`

#### `POST /api/packs/create-pack`
```json
{ "new_pack": { "group_name": "Study Crew", "semester": "fall", "year": 2026 },
  "friends": [12, 15] }
```

`201` → `{ "pack": {...} }`

Every id in `friends` has to be a confirmed friend. Anyone else gets `403 NOT_FRIENDS`.
Without that check you could name any user id and read their contact info and schedule back out
of `get-pack-data`. Duplicate ids are collapsed.

Errors: `400 NEW_PACK_REQUIRED`, `400 FRIENDS_REQUIRED`, `400 INVALID_USER_IDS`,
`400 INVALID_PACK_CREATION_INPUT`.

#### `PATCH /api/packs/edit-pack`
Body `{ "edited_pack": { "pack_id", "group_name", "semester", "year" } }`. Owner only.

#### `DELETE /api/packs/delete-pack`
Body `{ "pack_id": 3 }`. Owner only. Members cascade.

---

### Admin

All of these require `role = 'admin'`. A logged in non admin gets `403 FORBIDDEN`, and someone
logged out gets `401 UNAUTHORIZED`.

#### `GET /api/admin/users`
`200` → `{ "users": [ { "user_id", "username", "contact_info", "role", "created_at", "pack_count", "friend_count" } ] }`

`password_hash` is never selected.

#### `PATCH /api/admin/users/:userId/role`
Body `{ "role": "admin" }` or `{ "role": "user" }`.

`409 LAST_ADMIN` if it would leave nobody with the admin role, since there is no way to promote
someone back afterwards. `400 INVALID_ROLE` for anything outside the two values, `404` for an
unknown user.

#### `DELETE /api/admin/users/:userId`
`409 CANNOT_DELETE_SELF` if you aim it at your own account. Deleting cascades to the user's
friendships, packs and saved courses.

---

## Database

Seven tables, defined in `schema.sql`.

- `users` is the root. Everything else cascades from it.
- `friendships` is a self referencing many to many, one row per pair, with a `pending` flag
  separating a sent request from an accepted friendship. `user_id_1` is the requester.
- `course_collections` is a weak entity keyed on (user, semester, year), joined to
  `saved_courses` through `course_collection_items`.
- `saved_courses` is shared, so two people in CMPT 354 point at the same row.
- `packs` and `pack_members` are a many to many between users and packs.

There is also a `session` table not present in `schema.sql`, because `connect-pg-simple`
creates and owns it.

ER diagram is at `docs/ER.drawio`.

## Auth and permissions

Passwords are bcrypt hashed at cost 10. Sessions are `httpOnly` cookies backed by Postgres.

Two roles. Regular users can only reach their own data. Admins can additionally list all users,
change roles, and delete accounts. `requireRole` reads the role from the database on every
request rather than trusting whatever the session says, so demoting an admin takes effect on
their very next request instead of whenever their session expires, which could be a week.

## Layout

```
backend/src
  app.ts             express app with no listener, so tests can import it
  index.ts           starts the server
  controllers/       one per feature area, plus validation/
  routes/            route definitions and middleware/
  db/                connection pool and query helpers
  error_messages/    structured error responses
  types/
  seed.ts

frontend/src
  App.tsx            routes and the three route guards
  context/           AuthContext, holds the current user
  components/        auth, profile, packs, schedule-builder, schedule-viewer, admin
  utils/
```
