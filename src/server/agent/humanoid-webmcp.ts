import { JOINTS, humanoidJointRequirements } from "./humanoid-joints";

// WebMCP for the static humanoid guide, which ships no application bundle:
// the joint data rides along as JSON and a few lines register two read-only
// tools with an in-browser agent (document.modelContext, or the deprecated
// navigator.modelContext). Browsers without WebMCP run nothing.

const IDS = JOINTS.map((j) => j.id);

// Runs in the page. Kept dependency-free and ES2017 so it works everywhere.
const REGISTER = `(function(){var mc=document.modelContext||navigator.modelContext;if(!mc)return;var el=document.getElementById("humanoid-joints-data");if(!el)return;var data=JSON.parse(el.textContent);var ids=${JSON.stringify(IDS)};function res(d,err){var r={content:[{type:"text",text:JSON.stringify(d)}],structuredContent:d};if(err)r.isError=true;return r}function pick(id){return Object.assign({},data,{joints:data.joints.filter(function(j){return !id||j.id===id})})}var joint={type:"string",enum:ids};var tools=[{name:"get_humanoid_joint_requirements",title:"Humanoid joint requirements",description:"Static torque estimate (N·m) per humanoid joint for this guide's hypothetical 50 kg robot, with pose, arithmetic and catalog actuators that reach it (rated fits before peak-only). Omit joint for all seven.",annotations:{readOnlyHint:true},inputSchema:{type:"object",properties:{joint:joint}},execute:async function(a){var id=a&&a.joint;if(id&&ids.indexOf(id)<0)return res({error:"Unknown joint",joints:ids},true);return res(pick(id))}},{name:"show_humanoid_joint",title:"Show a joint",description:"Scroll this page to one joint's section and highlight it on the joint map so the user sees it.",annotations:{readOnlyHint:true},inputSchema:{type:"object",properties:{joint:joint},required:["joint"]},execute:async function(a){var id=a&&a.joint;if(ids.indexOf(id)<0)return res({error:"Unknown joint",joints:ids},true);location.hash=id;return res({shown:id,section:location.href})}}];try{if(typeof mc.registerTool==="function"){tools.forEach(function(t){mc.registerTool(t)})}else if(typeof mc.provideContext==="function"){mc.provideContext({tools:tools})}}catch(e){}})();`;

export function humanoidWebMcpScript(): string {
    // "<" escaped so catalog text can never close the script element.
    const json = JSON.stringify(humanoidJointRequirements(undefined, 5)).replace(
        /</g,
        "\\u003c",
    );
    return `<script type="application/json" id="humanoid-joints-data">${json}</script><script>${REGISTER}</script>`;
}
