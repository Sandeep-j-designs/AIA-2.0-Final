const assert=require('node:assert/strict');
const path=require('node:path');
const jiti=require('jiti')(__filename,{alias:{'@':path.resolve(__dirname,'..')}});
const batch=jiti('../config/pages/neo/tasks/batch-entry.ts').default;
const {getState}=jiti('../components/inbox/v2/store.ts');
const {taskForSkill}=jiti('../config/pages/neo/tasks/index.ts');
(async()=>{
for (const cancelled of [true,false]) {
  const chained=[]; const touched=[];
  const api={
    prompt:'Prepare these bills and follow up on missing details.',
    attachments:[],context:{company:getState().company},runId:'test-skill-composition',
    say:async()=>{},step:async()=>()=>{},wait:async()=>{},status:()=>{},checkpoint:async()=>{},
    card:async(card)=>cancelled?'cancel':card.kind==='decisions'?'go':card.view==='settings'?'enter':'create',
    touch:ids=>touched.push(...ids),onUndo:()=>{},show:()=>{},suggest:()=>{},
    chain:async prompt=>chained.push(prompt),
  };
  await batch.run(api);
  if(cancelled){assert.equal(chained.length,0);assert.equal(touched.length,0);}
  else {assert.equal(chained.length,1);assert(touched.length>0);assert.deepEqual(api.context.selectedIds,touched);assert.equal(api.context.itemId,undefined);}
}
console.log('Compound request chains supplier follow-up only after draft confirmation and scopes it to created bills');
})().catch(e=>{console.error(e);process.exit(1)});
