(function(){
  'use strict';
  const tag=document.currentScript, org=tag&&tag.getAttribute('data-senz-org');
  if(!org||!/^[a-f0-9-]{36}$/i.test(org))return;
  const host=new URL(tag.src).origin, url=host+'/api/widget/';
  const suffix='?org_id='+encodeURIComponent(org);
  async function request(route,body){
    const r=await fetch(url+route+suffix,body?{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)}:{});
    const j=await r.json();if(!r.ok)throw Error(j.error||'Temporarily unavailable');return j;
  }
  function node(tag,cls,text){const n=document.createElement(tag);if(cls)n.className=cls;if(text)n.textContent=text;return n;}
  async function init(){
    const config=await request('config');
    const container=document.createElement('div');document.body.appendChild(container);
    const root=container.attachShadow({mode:'closed'}), style=node('style');
    style.textContent=':host{all:initial;font:13px/1.5 Arial,sans-serif}*{box-sizing:border-box}button,input,textarea{font:inherit}.launch{position:fixed;right:18px;bottom:18px;z-index:2147483000;background:var(--accent);color:#fff;border:0;border-radius:30px;padding:13px 19px;font-weight:700;box-shadow:0 10px 34px #0c204044;cursor:pointer}.box{position:fixed;right:18px;bottom:75px;width:min(380px,calc(100vw - 24px));height:min(540px,calc(100dvh - 100px));z-index:2147483000;background:white;border-radius:17px;border:1px solid #d9e4ed;box-shadow:0 15px 45px #0c204044;display:flex;flex-direction:column;overflow:hidden;color:#10233c}.hide{display:none}.head{background:#0A1730;color:#fff;padding:14px 17px;display:flex;justify-content:space-between;align-items:center}.head button{background:none;border:0;color:white;font-size:19px;cursor:pointer}.chat{flex:1;overflow:auto;background:#f3f7fc;padding:17px;display:flex;flex-direction:column;gap:10px}.bubble{max-width:95%;padding:11px 12px;background:#e6edf7;border-radius:12px;white-space:pre-wrap;overflow-wrap:anywhere;align-self:flex-start}.mine{background:#dbeaff;align-self:flex-end}.input{display:flex;gap:7px;padding:10px;border-top:1px solid #dce6f1}.input input{flex:1;min-width:0;border:1px solid #cddae8;border-radius:9px;padding:9px}.input button,.lead button{border:0;background:var(--accent);color:white;padding:9px 12px;border-radius:9px;cursor:pointer}.lead{padding:10px 12px;border-top:1px solid #e4e9f0;font-size:11px}.lead summary{cursor:pointer;font-weight:bold}.lead input,.lead textarea{display:block;width:100%;border:1px solid #cddae8;border-radius:8px;padding:8px;margin:7px 0}.lead textarea{max-height:60px}.lead label{display:flex;gap:6px;margin:8px 0}.lead label input{width:auto}.hint{color:#66758b;font-size:10px}';
    root.appendChild(style);
    const wrap=node('div');wrap.style.setProperty('--accent',/^#[0-9a-f]{6}$/i.test(config.color||'')?config.color:'#2451D9');
    const launch=node('button','launch','Ask us');const box=node('section','box hide');
    const head=node('div','head');head.appendChild(node('strong',null,config.name||'Customer support'));
    const close=node('button',null,'×');head.appendChild(close);
    const chat=node('div','chat');chat.setAttribute('role','log');chat.setAttribute('aria-live','polite');
    const compose=node('form','input'),ask=node('input'),send=node('button',null,'Send');ask.placeholder='Ask a question';ask.maxLength=700;ask.required=true;send.type='submit';compose.append(ask,send);
    const lead=node('div','lead'),details=node('details'),summary=node('summary',null,'Leave an inquiry for a person');
    const form=node('form'),name=node('input'),email=node('input'),message=node('textarea'),check=node('input'),consent=node('label'),submit=node('button',null,'Submit inquiry'),hint=node('div','hint');
    name.placeholder='Name';name.maxLength=100;name.required=true;email.type='email';email.placeholder='Email';email.required=true;message.placeholder='How can we help?';message.maxLength=1500;message.required=true;check.type='checkbox';check.required=true;
    consent.append(check,node('span',null,'I agree to share my contact details with this business to respond to my inquiry.'));
    submit.type='submit';form.append(name,email,message,consent,submit,hint);details.append(summary,form);lead.append(details);
    box.append(head,chat,compose,lead);wrap.append(launch,box);root.appendChild(wrap);
    function bubble(text,mine){const b=node('div','bubble'+(mine?' mine':''),text);chat.appendChild(b);chat.scrollTop=chat.scrollHeight;}
    bubble(config.greeting||'Hello. How can we help?',false);
    function toggle(){box.classList.toggle('hide');launch.textContent=box.classList.contains('hide')?'Ask us':'Close chat';}
    launch.addEventListener('click',toggle);close.addEventListener('click',toggle);
    compose.addEventListener('submit',async e=>{e.preventDefault();const question=ask.value.trim();if(!question)return;ask.value='';bubble(question,true);send.disabled=true;
      try{const r=await request('ask',{question});bubble(r.answer||'Please leave an inquiry.',false);}catch{bubble('The assistant is unavailable. You can leave an inquiry.',false);}finally{send.disabled=false;}});
    form.addEventListener('submit',async e=>{e.preventDefault();submit.disabled=true;try{await request('lead',{name:name.value,email:email.value,message:message.value,consent:check.checked});hint.textContent='Inquiry submitted to this business.';form.reset();}
      catch(err){hint.textContent=err.message;}finally{submit.disabled=false;}});
  }
  init().catch(()=>{ /* Do not display widget without an active paid license and verified origin. */});
})();