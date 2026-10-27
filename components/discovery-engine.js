/* Shared, deterministic recommendation rules for browser and website intake. No prices or entitlements. */
(function(root, factory) { const value = factory(); if (typeof module === 'object') module.exports = value; else root.SENZDiscovery = value; })(typeof globalThis === 'object' ? globalThis : this, function() {
  'use strict';
  const VERSION = '2026-10-27.1';
  const options = entries => entries.map(([value,label]) => ({value,label}));
  const audiences = options([['myself','Myself'],['professional','My profession or personal brand'],['business','My business'],['organization','My company or organization'],['education','My school or educational institution'],['government','My government office or public institution'],['other','Something else']]);
  const needs = {
    communications:'Draft and review communications with AI',
    writing:'Write, research, or organize my work', visibility:'Improve visibility and positioning', reputation:'Strengthen reputation and communications', website:'Build or improve a website', customers:'Handle customer questions more consistently', operations:'Improve a repetitive workflow', institutional:'Provide licensed AI tools to our users', portal:'Manage projects and client delivery', events:'Manage events and registrations', photos:'Edit and organize photos', music:'Review and deliver music projects', representative:'Create a disclosed digital representative', unsure:'Help me identify the right approach'
  };
  const routes = {
    myself:['writing','photos','music','unsure'], professional:['visibility','reputation','website','writing','photos','music','representative','communications','unsure'],
    business:['website','visibility','customers','operations','writing','events','portal','communications','unsure'], organization:['reputation','operations','customers','institutional','portal','events','communications','unsure'],
    education:['institutional','writing','operations','website','events','unsure'], government:['reputation','website','operations','institutional','events','unsure'], other:Object.keys(needs)
  };
  const objectives = {
    writing:[['time','Spend less time drafting'],['clarity','Produce clearer work'],['research','Structure research and references']],
    visibility:[['recognition','Become easier to find and understand'],['inquiries','Receive more relevant inquiries'],['positioning','Clarify what makes me different']],
    reputation:[['trust','Build stakeholder trust'],['messaging','Communicate consistently'],['issue','Prepare for a sensitive issue']],
    website:[['presence','Establish a credible online presence'],['inquiries','Capture relevant inquiries'],['transactions','Support bookings, orders, or applications']],
    customers:[['answers','Give consistent answers'],['handoff','Route inquiries to the right person'],['workload','Reduce repetitive questions']],
    institutional:[['student','Support students'],['faculty','Support faculty and staff'],['team','Support several teams']],
    operations:[['time','Reduce repetitive administrative work'],['tracking','Track work and approvals'],['service','Improve service delivery']]
  };
  function question(id,title,items,hint) { return {id,title,options:options(items),hint:hint||''}; }
  function questions(a = {}) {
    const institutional = ['organization','education','government'].includes(a.audience);
    const business = a.audience === 'business';
    const qs = [{id:'audience',title:'Who is this for?',options:audiences,hint:'Choose the closest fit. You can change it later.'}];
    qs.push(question('need',a.audience === 'government' ? 'Which public-service need should we address first?' : a.audience === 'education' ? 'What does your institution need help with first?' : 'What would you most like to improve?',(routes[a.audience] || routes.other).map(k=>[k,needs[k]]),'Choose one priority so we can keep your first solution focused.'));
    qs.push(question('outcome','What outcome matters most?',objectives[a.need] || [['quality','Improve the quality of the work'],['time','Make the process easier'],['delivery','Manage review and delivery more clearly']]));
    qs.push(question('current',institutional ? 'What is already in place in your institution?' : business ? 'Where is your business today?' : 'What do you currently use?',institutional ? [['manual','Mostly manual or paper processes'],['basic','Separate digital tools'],['integrated','An established system to integrate with'],['unknown','I need help assessing this']] : business ? [['manual','Starting or working mostly manually'],['basic','Running with basic digital tools'],['integrated','An established business with connected systems'],['unknown','Not sure what to keep or change']] : [['manual','No dedicated tool yet'],['basic','A few separate tools'],['integrated','A system I want to improve'],['unknown','I am not sure']]));
    qs.push(question('scale',institutional ? 'How many people may need access or support?' : 'Who will use the solution?', [['one','Just one person'],['small','A small team (2–10)'],['department','A department (11–50)'],['institution','Several teams (more than 50)'],['unknown','We need to confirm the number']]));
    qs.push(question('requirements',a.audience === 'government' ? 'What needs review before implementation?' : a.audience === 'education' ? 'Which requirement needs particular care?' : 'What kind of help do you need?',a.audience === 'government' ? [['procurement','Procurement and formal documentation'],['sensitive','Sensitive information or permissions'],['integration','Integration with existing systems'],['unknown','We need a requirements review']] : a.audience === 'education' ? [['sensitive','Student privacy and permissions'],['integration','Existing school systems'],['onboarding','Administrator and user onboarding'],['unknown','We need a requirements review']] : [['self','A system I can use myself'],['managed','A professional to help deliver the work'],['integration','A solution connected to existing tools'],['sensitive','Sensitive information or special permissions'],['unknown','Help me decide']]));
    qs.push(question('timeline','When would you like to begin?', [['soon','As soon as practical'],['month','Within the next month'],['quarter','Within the next three months'],['exploring','I am exploring my options']],'We confirm delivery dates after reviewing the scope.'));
    if(a.audience === 'other') qs.push({id:'context',title:'Tell us a little about your situation.',text:true,hint:'One or two sentences is enough. Do not include confidential, financial, or sensitive personal information.'});
    return qs;
  }
  function normalize(input) {
    const a = {}; const errors = [];
    for(const q of questions(input || {})) {
      const value = typeof input?.[q.id] === 'string' ? input[q.id].trim() : '';
      if(q.text) { if(value.length < 5 || value.length > 600) errors.push(q.id); else a[q.id]=value; }
      else if(!q.options.some(o=>o.value===value)) errors.push(q.id); else a[q.id]=value;
    }
    return {answers:a,errors};
  }
  const solutions = {
    communications:{name:'SENZ Communications Intelligence',capability:'AI Systems',product:'communications-intelligence',scope:['Message and stakeholder briefs','Clarity review and issue preparation','Human approval before export'],limit:'AI-assisted drafts require human review. This is not legal advice, media monitoring, or a guarantee of communications outcomes.'},
    writing:{name:'SENZ AI Workspace',capability:'AI Systems',product:'ai-workspace',scope:['Drafting and rewriting workflows','Saved, versioned outputs','Defined usage allowance'],limit:'AI output needs human review and source verification. Live AI and release readiness are not yet verified.'},
    visibility:{name:'SENZ Visibility & Positioning',capability:'Strategic Communications',scope:['Positioning review','Audience and message priorities','A focused visibility plan'],limit:'Visibility, reach, media coverage, and sales outcomes cannot be guaranteed.'},
    reputation:{name:'SENZ Communications Strategy',capability:'Strategic Communications',scope:['Stakeholder and message assessment','Communications priorities','An appropriate review and response process'],limit:'Sensitive issues require specialist review. This is not legal advice or a guarantee of reputation outcomes.'},
    website:{name:'SENZ Digital Presence',capability:'Digital Solutions',scope:['Core website information architecture','Mobile-friendly pages','Contact and inquiry journey'],limit:'Page count, hosting, content, integrations, and ongoing support are agreed in the quotation.'},
    customers:{name:'SENZ Digital Assistant',capability:'AI Systems',product:'digital-assistant',scope:['Approved knowledge setup','Source-grounded answers','Human handoff workflow'],limit:'Website text assistance only in the current source. Messaging, voice, and autonomous outreach are not included.'},
    operations:{name:'SENZ Workflow Improvement',capability:'Digital Solutions',scope:['Current-process review','A focused workflow specification','A scoped tool or integration recommendation'],limit:'We assess existing tools before recommending a custom build. Integration feasibility must be verified.'},
    institutional:{name:'SENZ Institutional AI',capability:'AI Systems',product:'ai-workspace',scope:['Defined products and authorized users','Administrator and seat arrangements','Usage controls and onboarding scope'],limit:'Access requires a verified paid or authorized contract-backed institutional license and assigned seats. Students and employees need not pay personally.'},
    portal:{name:'SENZ Client Portal',capability:'Digital Solutions',product:'client-portal',scope:['Milestones and deliverables','Versioned feedback','Approval and delivery workflow'],limit:'Contract scope, storage, access roles, and implementation are agreed separately.'},
    events:{name:'SENZ Event Systems',capability:'Digital Solutions',product:'event-systems',scope:['Registration and capacity rules','Waitlist and check-in','Authorized attendee export'],limit:'Ticket payments and external integrations are not part of the verified local workflow.'},
    photos:{name:'SENZ FotoLab',capability:'Digital Solutions',product:'fotolab',scope:['Private photo projects','Non-destructive adjustments','Versioned exports'],limit:'Photo editing workflow; the current product does not provide AI image generation.'},
    music:{name:'SENZ Music Platform',capability:'Digital Solutions',product:'music-platform',scope:['Protected audio previews','Timestamped feedback','Rights confirmation and delivery'],limit:'The current product manages review and delivery; it does not generate music.'},
    representative:{name:'SENZ Digital Representative',capability:'AI Systems',product:'digital-representative',scope:['Recorded authorization and consent','Approved knowledge','Disclosed text responses and human handoff'],limit:'Text only. No voice or video impersonation. Consent, content, and launch readiness require review.'},
    unsure:{name:'SENZ Needs Review',capability:'Human consultation',scope:['Clarify the immediate problem','Review what already exists','Recommend the smallest useful next step'],limit:'An initial recommendation; scope is confirmed with SENZ before any commitment.'}
  };
  function recommend(input) {
    const {answers:a,errors} = normalize(input);
    if(errors.length) return {valid:false,errors};
    let s = solutions[a.need];
    if(a.need==='writing' && a.requirements==='managed') s={...solutions.reputation,name:'SENZ Writing & Communications Support',scope:['A defined writing brief','Professional communications support','Agreed human review and revision scope']};
    if(a.audience==='professional' && a.need==='visibility') s={...s,name:'SENZ Professional Presence'};
    const review = ['government','education','other'].includes(a.audience) || ['sensitive','integration','unknown','procurement'].includes(a.requirements) || a.need==='unsure' || a.current==='integrated';
    const complex = a.requirements==='integration' || a.requirements==='sensitive' || a.current==='integrated';
    const isInstitution = a.need==='institutional' && ['education','organization','government','business'].includes(a.audience);
    const tiers = isInstitution ? ['Department','Institution','Custom Institutional'] : s.product && ['writing','photos','customers'].includes(a.need) ? ['Focused product access','Team access','Custom scope'] : ['Essential','Growth','Custom'];
    const tierIndex = complex ? 2 : ['department','institution'].includes(a.scale) ? 1 : 0;
    const qs=questions(a);const label=id=>qs.find(q=>q.id===id)?.options?.find(o=>o.value===a[id])?.label || a[id];
    return {valid:true,rulesVersion:VERSION,audience:a.audience,challenge:label('need'),outcome:label('outcome'),name:s.name,capability:s.capability,productId:s.product||null,scope:s.scope,limitations:s.limit,tiers,suggestedTier:tiers[tierIndex],why:[`You prioritized: ${label('need')}.`,`Your desired outcome is: ${label('outcome')}.`,`The suggested scope reflects: ${label('scale')}.`],humanReviewRequired:review,confidence:review?'provisional':'initial',informationGaps:[...(a.scale==='unknown'?['Number of users']:[]),...(a.current==='unknown'?['Existing tools and process']:[]),...(review?['Privacy, permissions, integration or procurement requirements']:[]),'Final scope, approved price and delivery date'],nextAction:a.audience==='government'||a.audience==='education'?'Submit an Institutional Inquiry':s.product?'Request a Demonstration':'Request a Quote',pricing:'Pricing Based on Requirements',availability:s.product?'Not released for self-service purchase':'Scope subject to SENZ review',answers:a};
  }
  return {VERSION,audiences,needs,questions,normalize,recommend};
});
