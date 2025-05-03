# Matchmaking Engine (Node.js)

Hey there — here's a quick overview of the Take home assignment I received, including what the project does, why I did what I did and what I'd do differently in Production. 

---

## What This Project Does

- Allows users to register and update their profile with age, gender, location, and interests.
- Groups users into location-based quadrants using geohash (precision 5).
- Computes and caches compatible matches when a user is added or updated.
- Supports seeding random users for testing using Faker.
- Exposes API endpoints that are testable through Swagger.

---

## Architecture Decisions

- I kept everything in memory using JavaScript Maps so the logic remains fast and easy to debug.
- Used geohashing — it’s efficient and scalable for this type of prototype.
- Caching is done per user using their ID to reduce recalculation.

---

## Precomputation Design

When a user is created or updated, the App:
1. Identifies their geohash zone.
2. Finds other users in the same zone.
3. Filters out users they've blocked, disliked, or already matched with.
4. Calculates a match score based on age and interests.
5. Caches the top matches so that `/match/:id` is just a read from memory.

---

## Example Use

Register a user like this:

```json
{
  "id": "user123",
  "age": 29,
  "gender": "F",
  "lookingFor": "M",
  "location": { "lat": 36.5, "lon": -120.0 },
  "interests": ["reading", "tech", "travel"]
}
```

Then call `/match/user123` to get their top matches.

---

## What I'd Do Differently for Production

- Store profiles and cached matches in a persistent database like Postgres.
- Recompute matches asynchronously by probably using a job queue.
- Replace geohash-only filtering with actual geo-distance filtering.
- Add proper schema validation and rate limiting.
- Add JWT-based auth and access control for each profile.
- Support match fallback: if no matches in same zone, expand to nearby ones.
- Add more fields and in turn make the matching more in depth by filtering by things like height, orientation, religion etc.
- Add way more tests, was in a time crunch and did not get the time to add more tests. 
---


Swagger docs are available at `http://localhost:3000/api-docs`.

---

## Seeding for Testing

Run `/seed?count=1000` to create fake users.

Then register your own user and test `/match/:id`.
