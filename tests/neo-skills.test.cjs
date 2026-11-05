const assert = require('node:assert/strict');
const path = require('node:path');
const jiti = require('jiti')(__filename, { alias: { '@': path.resolve(__dirname, '..') } });
const { SKILLS, skillForTask } = jiti('../config/pages/neo/skills.ts');
const { taskForSkill, pickTask } = jiti('../config/pages/neo/tasks/index.ts');
const { NEO_COMMANDS } = jiti('../config/pages/neo/suggestions.ts');
const { NANDHINI_ID } = jiti('../config/pages/neo/mock-recon.ts');
const ctx = { company: NANDHINI_ID };
for (const skill of SKILLS) {
  assert.equal(taskForSkill(skill.id)?.id, skill.taskId, `Explicit dispatch: ${skill.name}`);
  assert.equal(pickTask(skill.prompt, ctx, [])?.id, skill.taskId, `Chat dispatch: ${skill.name}`);
  assert.equal(skillForTask(skill.taskId)?.id, skill.id);
  assert.equal(NEO_COMMANDS.find(c => c.cmd === skill.slash)?.prompt, skill.prompt);
}
assert.equal(taskForSkill('nonexistent'), undefined);
const recon = SKILLS.find(s => s.id === 'recon');
for (const skill of SKILLS) {
  assert.equal(skill.availability?.(NANDHINI_ID), undefined);
  assert.equal(skill.availability?.("other-company"), undefined);
}
for (const command of ['spend', 'owes', 'journal', 'collect', 'duplicates']) {
  assert(NEO_COMMANDS.some(c => c.cmd === command), `Preserve /${command}`);
}
assert.match(NEO_COMMANDS.find(c=>c.cmd==='duplicates').label, /Set up/);
assert.equal(NEO_COMMANDS.find(c=>c.cmd==='close').label, 'Close reconciliation exceptions');
console.log('Skill dispatch, company scope and retained chat shortcuts passed');

const { RECON_SAMPLE_FILES } = jiti('../config/pages/neo/mock-recon.ts');
const { MOCK_BATCH_DOCUMENTS } = jiti('../config/pages/neo/mock-batch-documents.ts');
const bills = MOCK_BATCH_DOCUMENTS.slice(0, 1).map(d => ({name:d.file.name,docId:d.id}));
for (const [prompt, attachments, expected] of [
  ['Enter these bills. Use the Bengaluru cost centre and flag anything unusual.', [], 'batch-entry'],
  ['Prepare these bills and follow up on missing details.', [], 'batch-entry'],
  ['Match September sales with settlement reports and bank receipts.', [], 'recon-run'],
  ['Use the supplier follow-up procedure to ask for a clearer copy of this bill.', bills, 'chase'],
  ['Ask the supplier for a clearer copy of this bill.', bills, 'chase'],
  ['/chase', bills, 'chase'],
  ['/bills Use Bengaluru cost centre', [], 'batch-entry'],
  ['Use bill entry for these documents', [], 'batch-entry'],
  ['Please process these invoices', [], 'batch-entry'],
  ['1 file attached', bills, 'batch-entry'],
  ['Match these reports', RECON_SAMPLE_FILES.map(f=>({name:f.name})), 'recon-run'],
]) assert.equal(pickTask(prompt, ctx, attachments)?.id, expected, prompt);
assert.notEqual(pickTask('What is a supplier follow-up skill?', ctx, [])?.id, 'chase');
assert.notEqual(pickTask('How much did we spend with Mahindra Logistics?', ctx, [])?.id, 'batch-entry');
console.log('Natural requests, explicit mentions, attachment precedence and query isolation passed');
