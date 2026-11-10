// Copyright 2026 Alex (Ayca Kaygusuz)
// SPDX-License-Identifier: Apache-2.0

// nmcli supplies connection state/cost only; never ask for SSIDs or credentials.
export function linuxMetered(output){
 let connected=false;const costs=[];
 for(const line of String(output).split(/\r?\n/)){
  if(line.startsWith('GENERAL.STATE:'))connected=/^GENERAL\.STATE:100(?:\s|$)/.test(line);
  if(connected&&line.startsWith('GENERAL.METERED:'))costs.push(line.slice('GENERAL.METERED:'.length).trim());
 }
 if(costs.some(value=>['yes','guess-yes'].includes(value)))return true;
 return costs.length&&costs.every(value=>['no','guess-no'].includes(value))?false:null;
}
