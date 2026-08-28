const box=document.getElementById('health');
const ids=document.getElementById('identidades');
const fotos=document.getElementById('fotos');
const mapeados=document.getElementById('mapeados');
async function verificar(){
  try{
    const r=await fetch('/health',{cache:'no-store'}); const d=await r.json();
    if(!r.ok) throw new Error(`HTTP ${r.status}`);
    box.className='health ok';
    box.querySelector('strong').textContent='Serviço operacional';
    box.querySelector('span').textContent='FastAPI respondeu normalmente.';
    ids.textContent=d.identidades_carregadas??0; fotos.textContent=d.fotos_carregadas??0; mapeados.textContent=d.alunos_mapeados??0;
  }catch(e){box.className='health bad';box.querySelector('strong').textContent='Serviço com falha';box.querySelector('span').textContent=e.message||'Não foi possível consultar /health';}
}
verificar(); setInterval(verificar,10000);
