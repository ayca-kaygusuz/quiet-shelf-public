// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

// Generate a local, credential-free script from the authoritative notice files.
// The same text ships with browser, Windows and Android builds.
export function legalScript({license,notice,thirdParty,font,desugar}){
 if(![license,notice,thirdParty,font,desugar].every(value=>typeof value==='string'&&value.trim())||!license.includes('TERMS AND CONDITIONS FOR USE, REPRODUCTION, AND DISTRIBUTION'))throw Error('The distribution is missing its license or notices.');
 const values={projectLicense:license,projectNotice:notice,thirdPartyNotice:thirdParty+'\n\n'+desugar,fontLicense:font};
 return '// Copyright 2026 Alex (Ayca Kaygusuz)\n// SPDX-License-Identifier: Apache-2.0\n(function(){const notices='+JSON.stringify(values)+';for(const [id,value]of Object.entries(notices)){const element=document.getElementById(id);if(element)element.textContent=value}})();\n';
}
