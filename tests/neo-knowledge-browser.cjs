const { chromium } = require('/Users/sandeepbalajij/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const assert = require('node:assert/strict');
(async () => {
const browser = await chromium.launch({channel:'chrome',headless:true});
try {
const page = await browser.newPage({viewport:{width:1440,height:1000}});
const errors=[]; page.on('pageerror', e => errors.push(e.message));
await page.goto('http://localhost:3001/inbox?module=NEO&page=knowledge');
await page.getByRole('heading',{name:'Company knowledge',exact:true}).waitFor();
await page.screenshot({path:'shots/knowledge/desktop.png',fullPage:true});
console.log('Patterns', await page.locator('.knowledge-row').count());
if(await page.locator('.knowledge-row').count()) {
await page.locator('.knowledge-row').first().click();
const account=page.getByLabel('Suggested account');
await account.fill('Office supplies — reviewed');
await page.getByLabel('Notes for this pattern').fill('Keep this mapping for standard bills.');
await page.getByRole('button',{name:'Save and confirm',exact:true}).click();
await page.reload();
await page.getByText('Office supplies — reviewed',{exact:true}).first().waitFor();
await page.locator('.knowledge-row').filter({hasText:'Office supplies — reviewed'}).click();
await page.getByRole('heading',{name:'History',exact:true}).waitFor();
await page.screenshot({path:'shots/knowledge/detail.png',fullPage:true});
await page.getByRole('button',{name:'Disable pattern',exact:true}).click();
await page.getByRole('button',{name:'Disabled',exact:true}).click();
assert.equal(await page.locator('.knowledge-row').count(),1);
}
await page.setViewportSize({width:390,height:844});
await page.screenshot({path:'shots/knowledge/mobile.png',fullPage:true});
assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
await page.goto('http://localhost:3001/inbox?module=NEO');
await page.locator('.knowledge-home').waitFor();
assert.deepEqual(errors,[]); console.log('Knowledge navigation, editing, persistence, disabling, mobile bounds and home passed');
} finally {await browser.close()}
})().catch(e=>{console.error(e);process.exit(1)});
