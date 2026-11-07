import {spawnSync} from 'node:child_process';
const tests=['tests/isbn.mjs','tests/search-ranking.mjs','tests/sorting.cjs','tests/series-wishlist.cjs','tests/reading-archive.cjs','tests/adding.cjs','tests/deletion.cjs','tests/menus.cjs','tests/source-controls.cjs','tests/sources.mjs','tests/integrations.mjs'];
for(const test of tests){const result=spawnSync(process.execPath,[test],{stdio:'inherit'});if(result.error)throw result.error;if(result.status!==0)process.exit(result.status??1)}
console.log('All active checks passed. Archived connector tests were not run.');
