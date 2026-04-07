#!/usr/bin/env node
/**
 * Data validation test suite for the Staff+ Knowledge Base.
 * Zero dependencies — runs with plain Node.js.
 *
 * Usage: node tests/validate-data.js
 * Exit code: 0 = all pass, 1 = failures
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const DB_DIR = path.join(ROOT, 'db');

let passes = 0;
let failures = 0;
let currentSuite = '';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function suite(name) {
  currentSuite = name;
  console.log(`\n  ${name}`);
}

function assert(condition, message) {
  if (condition) {
    passes++;
    console.log(`    \x1b[32m✓\x1b[0m ${message}`);
  } else {
    failures++;
    console.error(`    \x1b[31m✗\x1b[0m ${message}`);
  }
}

function loadJSON(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  return JSON.parse(raw);
}

function isValidDate(str) {
  return /^\d{4}-\d{2}-\d{2}$/.test(str) && !isNaN(Date.parse(str));
}

function isValidURL(str) {
  return /^https?:\/\/.+/.test(str);
}

// ─── Schema definitions ──────────────────────────────────────────────────────

const VALID_TAGS = ['infra', 'ml', 'data', 'biz', 'scale'];
const VALID_DRILL_TAGS = [
  'api', 'timeout', 'circuit-breaker', 'memory', 'debugging', 'profiling',
  'validation', 'queue', 'security', 'rate-limiting', 'database', 'query',
  'indexing', 'disk', 'replication', 'cache', 'concurrency', 'transactions',
  'networking', 'dns', 'service-discovery', 'tls', 'operations', 'kubernetes',
  'containers', 'deployment', 'rollback', 'kafka', 'backpressure', 'redis',
  'distributed', 'consistency', 'microservices', 'retry', 'cascading-failure',
  'sli', 'prometheus', 'grafana', 'pipeline', 'model-serving', 'ml',
  'error-budget', 'slo', 'policy', 'alerting', 'burn-rate', 'incident',
  'quantification', 'business', 'load-testing', 'capacity', 'performance',
  'resilience', 'chaos', 'dependencies', 'canary', 'statistics',
  'synthetic', 'monitoring', 'testing-in-prod',
];
const VALID_LAYOUTS = ['table', 'cards', 'drills'];
const VALID_PHASES = [
  'Discovery', 'Planning', 'Execution', 'Launch',
  'Operate', 'Growth', 'Sunset', 'Cross-cutting'
];

const ITEM_SCHEMAS = {
  'system-design': {
    required: ['topic', 'concepts', 'tags', 'resources', 'added'],
    tagField: 'tags',
    identityField: 'topic',
  },
  'ml-systems': {
    required: ['topic', 'concepts', 'tags', 'resources', 'added'],
    tagField: 'tags',
    identityField: 'topic',
  },
  'business-problems': {
    required: ['problem', 'enterprise', 'market_fit', 'tam', 'tags', 'added'],
    tagField: 'tags',
    identityField: 'problem',
  },
  'impact-axes': {
    required: ['axis', 'example', 'level', 'added'],
    identityField: 'axis',
  },
  'org-decisions': {
    required: ['topic', 'considerations', 'phase', 'added'],
    identityField: 'topic',
    phaseField: 'phase',
  },
  'tech-talks': {
    required: ['title', 'url', 'speaker', 'venue', 'description', 'added'],
    identityField: 'title',
    urlField: 'url',
  },
  'production-drills': {
    required: ['drill', 'layer', 'difficulty', 'scenario', 'exercise', 'tags', 'added'],
    tagField: 'tags',
    identityField: 'drill',
  },
};

// ─── Test: JSON files parse ──────────────────────────────────────────────────

suite('JSON parsing');

// notifications.json has a different schema (entries, not sections) — validated separately
const EXCLUDED_FILES = ['notifications.json'];
const dbFiles = fs.readdirSync(DB_DIR).filter(f => f.endsWith('.json') && !EXCLUDED_FILES.includes(f));
assert(dbFiles.length > 0, 'db/ directory contains JSON files');

const loaded = {};
for (const file of dbFiles) {
  try {
    loaded[file] = loadJSON(path.join(DB_DIR, file));
    assert(true, `${file} parses as valid JSON`);
  } catch (e) {
    assert(false, `${file} fails to parse: ${e.message}`);
  }
}

// ─── Test: data.json structure ───────────────────────────────────────────────

suite('data.json structure');

let dataJson;
try {
  dataJson = loadJSON(path.join(ROOT, 'data.json'));
  assert(true, 'data.json parses as valid JSON');
} catch (e) {
  assert(false, `data.json fails to parse: ${e.message}`);
}

if (dataJson) {
  assert(typeof dataJson.profile === 'object', 'has profile object');
  assert(typeof dataJson.profile.name === 'string', 'profile.name is a string');
  assert(typeof dataJson.profile.currentLevel === 'string', 'profile.currentLevel is a string');
  assert(typeof dataJson.profile.targetLevel === 'string', 'profile.targetLevel is a string');
  assert(typeof dataJson.profile.passion === 'string', 'profile.passion is a string');
  assert(typeof dataJson.skillTrees === 'object', 'has skillTrees object');
  assert(Array.isArray(dataJson.drills), 'drills is an array');
  assert(dataJson.drills.length > 0, 'drills has at least one entry');
  assert(Array.isArray(dataJson.enterpriseWatchlist), 'enterpriseWatchlist is an array');
  assert(dataJson.enterpriseWatchlist.length > 0, 'enterpriseWatchlist has entries');
  assert(Array.isArray(dataJson.careerMilestones), 'careerMilestones is an array');

  // Validate each drill has required fields
  for (const drill of dataJson.drills) {
    assert(typeof drill.id === 'number', `drill "${drill.name}" has numeric id`);
    assert(typeof drill.name === 'string', `drill ${drill.id} has name`);
    assert(typeof drill.tree === 'string', `drill "${drill.name}" has tree`);
    assert(typeof drill.xp === 'number', `drill "${drill.name}" has numeric xp`);
  }

  // Validate watchlist entries
  for (const w of dataJson.enterpriseWatchlist) {
    assert(typeof w.name === 'string', `watchlist entry has name: ${w.name}`);
    assert(typeof w.domain === 'string', `${w.name} has domain`);
    assert(['hot', 'watch', 'stable'].includes(w.signal), `${w.name} has valid signal: ${w.signal}`);
  }
}

// ─── Test: metadata schema ───────────────────────────────────────────────────

suite('Metadata schema');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;

  const meta = data.metadata;
  assert(meta !== undefined, `${file} has metadata`);
  if (!meta) continue;

  assert(typeof meta.category === 'string', `${file} metadata.category is a string`);
  assert(typeof meta.display_name === 'string', `${file} metadata.display_name is a string`);
  assert(VALID_LAYOUTS.includes(meta.layout), `${file} metadata.layout is valid: ${meta.layout}`);
  assert(isValidDate(meta.last_updated), `${file} metadata.last_updated is valid date: ${meta.last_updated}`);
  assert(Array.isArray(data.sections), `${file} has sections array`);
}

// ─── Test: item schema per category ──────────────────────────────────────────

suite('Item schema validation');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data || !data.metadata) continue;

  const category = data.metadata.category;
  const schema = ITEM_SCHEMAS[category];
  if (!schema) {
    assert(false, `${file} has unknown category: ${category}`);
    continue;
  }

  let itemCount = 0;
  for (const section of data.sections) {
    assert(typeof section.title === 'string', `${file} section has title: "${section.title}"`);
    assert(Array.isArray(section.items), `${file} "${section.title}" has items array`);

    for (const item of section.items) {
      itemCount++;
      for (const field of schema.required) {
        assert(
          item[field] !== undefined && item[field] !== null,
          `${file} item "${item[schema.identityField] || '?'}" has required field: ${field}`
        );
      }
    }
  }
  assert(itemCount > 0, `${file} has at least one item (found ${itemCount})`);
}

// ─── Test: valid dates on all items ──────────────────────────────────────────

suite('Date validation');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;

  for (const section of data.sections) {
    for (const item of section.items) {
      if (item.added) {
        const schema = ITEM_SCHEMAS[data.metadata.category];
        const label = item[schema?.identityField] || JSON.stringify(item).slice(0, 40);
        assert(isValidDate(item.added), `${file} "${label}" has valid date: ${item.added}`);
      }
    }
  }
}

// ─── Test: tags use allowed taxonomy ─────────────────────────────────────────

suite('Tag taxonomy');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;

  const schema = ITEM_SCHEMAS[data.metadata.category];
  if (!schema || !schema.tagField) continue;

  const allowedTags = data.metadata.category === 'production-drills' ? VALID_DRILL_TAGS : VALID_TAGS;

  for (const section of data.sections) {
    for (const item of section.items) {
      const tags = item[schema.tagField];
      if (!Array.isArray(tags)) continue;
      for (const tag of tags) {
        assert(
          allowedTags.includes(tag),
          `${file} "${item[schema.identityField]}" tag "${tag}" is in allowed set`
        );
      }
    }
  }
}

// ─── Test: org-decisions phases are valid ────────────────────────────────────

suite('Org-decisions phase validation');

const orgData = loaded['org-decisions.json'];
if (orgData) {
  for (const section of orgData.sections) {
    for (const item of section.items) {
      assert(
        VALID_PHASES.includes(item.phase),
        `org-decisions "${item.topic}" has valid phase: ${item.phase}`
      );
    }
  }
}

// ─── Test: URL format validation ─────────────────────────────────────────────

suite('URL format validation');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;

  const schema = ITEM_SCHEMAS[data.metadata.category];
  if (!schema) continue;

  for (const section of data.sections) {
    for (const item of section.items) {
      // Direct URL field (tech-talks)
      if (schema.urlField && item[schema.urlField]) {
        assert(
          isValidURL(item[schema.urlField]),
          `${file} "${item[schema.identityField]}" URL is valid format`
        );
      }
      // Resources array (system-design, ml-systems)
      if (item.resources && Array.isArray(item.resources)) {
        for (const r of item.resources) {
          assert(typeof r.title === 'string', `${file} "${item[schema.identityField]}" resource has title`);
          assert(isValidURL(r.url), `${file} "${item[schema.identityField]}" resource URL "${r.title}" is valid`);
        }
      }
    }
  }
}

// ─── Test: no duplicate items within file ────────────────────────────────────

suite('Duplicate detection');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;

  const schema = ITEM_SCHEMAS[data.metadata.category];
  if (!schema) continue;

  const seen = new Set();
  let dupes = 0;
  for (const section of data.sections) {
    for (const item of section.items) {
      const key = item[schema.identityField];
      if (seen.has(key)) {
        dupes++;
        assert(false, `${file} has duplicate: "${key}"`);
      }
      seen.add(key);
    }
  }
  if (dupes === 0) {
    assert(true, `${file} has no duplicate items`);
  }
}

// ─── Test: knowledge-base.html references all db files ───────────────────────

suite('Knowledge base references');

const kbPath = path.join(ROOT, 'knowledge-base.html');
if (fs.existsSync(kbPath)) {
  const kbHTML = fs.readFileSync(kbPath, 'utf8');
  for (const file of dbFiles) {
    assert(
      kbHTML.includes(`db/${file}`),
      `knowledge-base.html references db/${file}`
    );
  }
} else {
  assert(false, 'knowledge-base.html exists');
}

// ─── Test: production drills have valid difficulty ────────────────────────────

suite('Production drill difficulty levels');

const drillData = loaded['production-drills.json'];
if (drillData) {
  const validDifficulty = ['Easy', 'Medium', 'Hard'];
  for (const section of drillData.sections) {
    for (const item of section.items) {
      assert(
        validDifficulty.includes(item.difficulty),
        `drill "${item.drill}" has valid difficulty: ${item.difficulty}`
      );
    }
  }
}

// ─── Test: cross-file category uniqueness ────────────────────────────────────

suite('Category uniqueness across files');

const categories = new Set();
let catDupes = false;
for (const file of dbFiles) {
  const data = loaded[file];
  if (!data || !data.metadata) continue;
  if (categories.has(data.metadata.category)) {
    assert(false, `duplicate category "${data.metadata.category}" in ${file}`);
    catDupes = true;
  }
  categories.add(data.metadata.category);
}
if (!catDupes) {
  assert(true, 'all db files have unique categories');
}

// ─── Test: filename matches category ─────────────────────────────────────────

suite('Filename-category consistency');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data || !data.metadata) continue;
  const expected = file.replace('.json', '');
  assert(
    data.metadata.category === expected,
    `${file} category "${data.metadata.category}" matches filename`
  );
}

// ─── Test: sections are non-empty ────────────────────────────────────────────

suite('Section non-emptiness');

for (const file of dbFiles) {
  const data = loaded[file];
  if (!data) continue;
  for (const section of data.sections) {
    assert(
      section.items.length > 0,
      `${file} section "${section.title}" has items`
    );
  }
}

// ─── Test: notifications.json structure ───────────────────────────────────────

suite('Notifications structure');

const notifPath = path.join(DB_DIR, 'notifications.json');
if (fs.existsSync(notifPath)) {
  try {
    const notifData = loadJSON(notifPath);
    assert(true, 'notifications.json parses as valid JSON');
    assert(notifData.metadata !== undefined, 'has metadata');
    assert(notifData.metadata.category === 'notifications', 'category is notifications');
    assert(isValidDate(notifData.metadata.last_updated), 'last_updated is valid date');
    assert(Array.isArray(notifData.entries), 'entries is an array');

    for (const entry of notifData.entries) {
      assert(typeof entry.timestamp === 'string', `entry has timestamp`);
      assert(typeof entry.type === 'string', `entry "${entry.title}" has type`);
      assert(typeof entry.title === 'string', `entry has title`);
      assert(typeof entry.summary === 'string', `entry "${entry.title}" has summary`);
      assert(Array.isArray(entry.tasks), `entry "${entry.title}" has tasks array`);
      assert(Array.isArray(entry.items_added), `entry "${entry.title}" has items_added array`);
    }
  } catch (e) {
    assert(false, `notifications.json fails to parse: ${e.message}`);
  }
} else {
  assert(false, 'notifications.json exists');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

console.log(`\n${'─'.repeat(60)}`);
console.log(`  \x1b[32m${passes} passing\x1b[0m`);
if (failures > 0) {
  console.log(`  \x1b[31m${failures} failing\x1b[0m`);
}
console.log('');

process.exit(failures > 0 ? 1 : 0);
