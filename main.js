
const express = require('express');
const bodyParser = require('body-parser');
const geohash = require('ngeohash');
const { faker } = require('@faker-js/faker');
const { computeScore, getTopMatches, seedUsers, updateUserProfile } = require('./utils');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger'); 

const app = express();
const PORT = 3000;


app.use(bodyParser.json());
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

const profiles = new Map(); 
const quadrantMap = new Map(); 
const matchCache = new Map(); 

app.post('/profiles', (req, res) => {
  const profile = req.body;
  const { id, location } = profile;

  if (!id || !location || !location.lat || !location.lon) {
    return res.status(400).json({ error: 'Invalid profile format' });
  }

  const hash = geohash.encode(location.lat, location.lon, 5);
  profile.geohash = hash;
  profile.blocked = new Set();
  profile.matched = new Set();
  profile.disliked = new Set();

  profiles.set(id, profile);

  if (!quadrantMap.has(hash)) quadrantMap.set(hash, new Set());
  quadrantMap.get(hash).add(id);

  console.log(`User ${id} created in geohash: ${hash}`);
  console.log(`Looking for: ${profile.lookingFor}, Gender: ${profile.gender}`);
  console.log(`Interests:`, profile.interests);

  const candidates = [...quadrantMap.get(hash)].filter(uid => uid !== id);
  console.log(`Candidates in quadrant ${hash}:`, candidates.length);

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

  console.log(`Cached matches for ${id}:`, matchCache.get(id));

  return res.status(201).json({ message: 'Profile registered successfully' });
});

app.get('/match/:id', (req, res) => {
  const id = req.params.id;
  const user = profiles.get(id);
  if (!user) return res.status(404).json({ error: 'User not found' });

  console.log(`Fetching matches for ${id}`);
  console.log(`User geohash: ${user.geohash}`);
  console.log(`Match cache:`, matchCache.get(id));

  const matches = matchCache.get(id) || [];
  const top5 = getTopMatches(matches, profiles, user);
  return res.status(200).json(top5);
});

app.get('/seed', (req, res) => {
  const count = parseInt(req.query.count) || 1000;
  seedUsers(count, profiles, quadrantMap, matchCache);
  return res.status(200).json({ message: `${count} users seeded.` });
});

app.put('/profiles/:id', (req, res) => {
  const id = req.params.id;
  const updates = req.body;
  const result = updateUserProfile(id, updates, profiles, quadrantMap, matchCache);
  if (result.error) return res.status(400).json({ error: result.error });
  return res.status(200).json({ message: 'Profile updated.' });
});

app.listen(PORT, () => console.log(`Matchmaking server running on port ${PORT}`));
