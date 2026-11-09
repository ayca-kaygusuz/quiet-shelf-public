// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0
import assert from 'node:assert/strict';
export async function checkLibraryViewUI({evaluate}){
 await evaluate(`(()=>{window.__viewQA=QuietShelfApp.snapshot();const b=(id,title,seriesName,volume)=>({id,title,author:'Library author',status:'Unread',history:[],...(seriesName?{seriesMode:'manual',seriesName,seriesVolume:volume}:{})});QuietShelfApp.apply({library:[b('alpha-z','Zulu story','Alpha collection',2),b('alpha-y','Zed story','Alpha collection',1),b('zulu-a','Able story','Zulu collection',1),b('zulu-b','Adam story','Zulu collection',2),b('solo','Middle standalone')],preferences:{theme:'ink',sort:'titleAsc',autoUpdateChecks:false}});document.querySelector('#backToLibrary').click();return true})()`);
 try{
  let state=await evaluate(`({groups:[...document.querySelectorAll('.series-heading strong')].map(e=>e.textContent),children:[...document.querySelectorAll('.series-child strong')].map(e=>e.textContent)})`);
  assert.deepEqual(state.groups,['Alpha collection','Zulu collection']);assert.deepEqual(state.children,['Zed story','Zulu story','Able story','Adam story']);
  state=await evaluate(`(()=>{document.querySelector('#sort').value='titleDesc';document.querySelector('#sort').dispatchEvent(new Event('change'));return [...document.querySelectorAll('.series-heading strong')].map(e=>e.textContent)})()`);assert.deepEqual(state,['Zulu collection','Alpha collection']);
  state=await evaluate(`(()=>{document.querySelector('#showSeries').click();return {groups:document.querySelectorAll('.series-heading').length,titles:document.querySelectorAll('#list .titlebutton').length,total:insightData().total}})()`);assert.equal(state.groups,0);assert.equal(state.titles,1);assert.equal(state.total,5);
  state=await evaluate(`(()=>{document.querySelector('#showStandalones').click();document.querySelector('#plainList').click();return {groups:document.querySelectorAll('.series-heading').length,titles:[...document.querySelectorAll('#list .titlebutton strong')].map(e=>e.textContent),backup:QuietShelfApp.backup().preferences.libraryView,disabled:document.querySelector('#showSeries').disabled,collapseHidden:document.querySelector('#toggleAllSeries').hidden,overflow:document.documentElement.scrollWidth>innerWidth}})()`);
  assert.equal(state.groups,0);assert.deepEqual(state.titles,['Zulu story','Zed story','Middle standalone','Adam story','Able story']);assert.equal(state.backup.flat,true);assert.equal(state.disabled,true);assert.equal(state.collapseHidden,true);assert.equal(state.overflow,false);
  state=await evaluate(`(()=>{document.querySelector('#plainList').click();return visibleBooks().length})()`);assert.equal(state,0);
  console.log('PASS: actual series header/member ordering, independent type filters, reversible plain view, unchanged insights and backed-up display settings');
 }finally{await evaluate('QuietShelfApp.apply(window.__viewQA);delete window.__viewQA;true')}
}
