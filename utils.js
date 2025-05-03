const { faker } = require('@faker-js/faker');
const geohash = require('ngeohash');

function computeScore(user1, user2) {
  if (user1.blocked.has(user2.id) || user1.disliked.has(user2.id) || user1.matched.has(user2.id)) {
    return 0;
  }
  if (user1.lookingFor && user2.gender && user1.lookingFor !== user2.gender) {
    return 0;
  }
  if (user2.lookingFor && user1.gender && user2.lookingFor !== user1.gender) {
    return 0;
  }

  const ageDiff = Math.abs(user1.age - user2.age);
  const score = Math.max(0, 100 - ageDiff * 2); 

  return score;
}

function getTopMatches(matchIds, profiles, user) {
  const matches = matchIds
    .map(id => ({
      id,
      profile: profiles.get(id),
      score: computeScore(user, profiles.get(id))
    }))
    .filter(m => m.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  console.log(`Top matches for ${user.id}:`, matches);
  return matches.map(m => ({ id: m.id, score: m.score }));
}

function seedUsers(count, profiles, quadrantMap, matchCache) {
  console.log(`Seeding ${count} users...`);
  for (let i = 0; i < count; i++) {
    const id = faker.string.uuid();
    const lat = faker.location.latitude({ min: 34, max: 38 });
    const lon = faker.location.longitude({ min: -123, max: -118 });
    const geohashCode = geohash.encode(lat, lon, 5);

    const gender = faker.helpers.arrayElement(['M', 'F']);
    const lookingFor = faker.helpers.arrayElement(['M', 'F']);
    const age = faker.number.int({ min: 18, max: 60 });

    const profile = {
      id,
      name: faker.person.fullName(),
      age,
      gender,
      lookingFor,
      location: { lat, lon },
      geohash: geohashCode,
      blocked: new Set(),
      matched: new Set(),
      disliked: new Set()
    };

    profiles.set(id, profile);

    if (!quadrantMap.has(geohashCode)) {
      quadrantMap.set(geohashCode, new Set());
    }
    quadrantMap.get(geohashCode).add(id);

    if (i < 5) {
      console.log(`Seeded [${id}]: age=${age}, gender=${gender}, lookingFor=${lookingFor}, geo=${geohashCode}`);
    }
  }

  for (const [id, profile] of profiles) {
    const candidates = [...quadrantMap.get(profile.geohash)].filter(uid => uid !== id);
    const scoredMatches = [];

    for (const uid of candidates) {
      const candidate = profiles.get(uid);
      const score = computeScore(profile, candidate);
      if (score > 0) {
        scoredMatches.push({ id: uid, score });
      }
    }

    scoredMatches.sort((a, b) => b.score - a.score);
    matchCache.set(id, scoredMatches.map(m => m.id));
  }

  console.log('Seeding complete. Total users:', profiles.size);
}

function updateUserProfile(id, updates, profiles, quadrantMap, matchCache) {
  const profile = profiles.get(id);
  if (!profile) return { error: 'Profile not found' };

  console.log(`Updating user ${id}...`);

  if (updates.age) profile.age = updates.age;
  if (updates.gender) profile.gender = updates.gender;
  if (updates.lookingFor) profile.lookingFor = updates.lookingFor;
  if (updates.location) {
    const { lat, lon } = updates.location;
    const newHash = geohash.encode(lat, lon, 5);

    console.log(`Moving user ${id} to new location: ${lat}, ${lon} → geohash: ${newHash}`);
    quadrantMap.get(profile.geohash)?.delete(id);
    if (!quadrantMap.has(newHash)) quadrantMap.set(newHash, new Set());
    quadrantMap.get(newHash).add(id);

    profile.location = updates.location;
    profile.geohash = newHash;
  }
  const candidates = [...quadrantMap.get(profile.geohash)].filter(uid => uid !== id);
  const scoredMatches = [];

  for (const uid of candidates) {
    const candidate = profiles.get(uid);
    const score = computeScore(profile, candidate);
    if (score > 0) {
      scoredMatches.push({ id: uid, score });
    }
  }

  scoredMatches.sort((a, b) => b.score - a.score);
  matchCache.set(id, scoredMatches.map(m => m.id));

  console.log(`User ${id} updated. New match count: ${matchCache.get(id)?.length || 0}`);
  return { success: true };
}

module.exports = {
  computeScore,
  getTopMatches,
  seedUsers,
  updateUserProfile
};
