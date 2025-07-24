import { getCorsHeaders } from "./index.ts";
function assertEquals(a:unknown,b:unknown){ if(a!==b) throw new Error(`Expected ${b}, got ${a}`); }
Deno.test("cors",()=>{const h=getCorsHeaders();assertEquals(h["Access-Control-Allow-Origin"],"*");});
