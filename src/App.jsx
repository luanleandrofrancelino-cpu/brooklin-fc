import { useState, useEffect } from "react";

const CORRECT_PIN = "2363";
const SCHEDULE = ["21:10", "21:40", "22:10", "22:40"];
const DAYS = ["Segunda", "Terça", "Quinta"];
const SEASON = "EAFC26";
const SQUAD = [
  {name:"willrodrigues25", pos:"GK"},
  {name:"Guiga_013_BR",    pos:"ZAG"},
  {name:"LUAN27F",         pos:"ZAG"},
  {name:"Rdc_eduzeraa",    pos:"ZAG"},
  {name:"ramonbarbatt",    pos:"ZAG"},
  {name:"calalam",         pos:"ZAG"},
  {name:"Igoor_Xerife",    pos:"ZAG"},
  {name:"x_LINNO_x",       pos:"VOL"},
  {name:"Mtscruz",         pos:"VOL"},
  {name:"Gott_-_Zico",     pos:"VOL"},
  {name:"Lucimito0605",    pos:"VOL"},
  {name:"Ritalino",        pos:"MEI"},
  {name:"Poseidonn07",     pos:"ALA"},
  {name:"Niury_Lopes",     pos:"ALA"},
  {name:"Slowjoao123",     pos:"ALA"},
  {name:"VinaAntunes98",   pos:"ALA"},
  {name:"HellShark013",    pos:"ALA"},
  {name:"Dioliver_777",    pos:"ATA"},
  {name:"ShowNeka",        pos:"ATA"},
  {name:"Meirelesgol",     pos:"ATA"},
  {name:"Dallasxxz",       pos:"ATA"},
];
const DEFAULT_PLAYERS = SQUAD.map(p => p.name);

const makeGame = (time, prefill=null) => ({
  time,
  opponent: prefill?.opponent||"",
  championship: prefill?.championship||"",
  result: prefill?.result||"",
  played: prefill?.played||false,
  players: prefill?.players||SQUAD.map(p=>({name:p.name,pos:p.pos,goals:0,assists:0,rating:0}))
});

const makeDay = (day) => ({
  day, date:"",
  games: SCHEDULE.map((t,i) => {
    if(day==="Segunda"&&i===0) return makeGame(t,{
      opponent:"Exemplo FC",championship:"Div 1",result:"1 x 0",played:true,
      players:[
        {name:"willrodrigues25",pos:"GK", goals:0,assists:0,rating:7.5},
        {name:"Guiga_013_BR",   pos:"ZAG",goals:0,assists:0,rating:0},
        {name:"LUAN27F",        pos:"ZAG",goals:0,assists:1,rating:8.0},
        {name:"Rdc_eduzeraa",   pos:"ZAG",goals:0,assists:0,rating:0},
        {name:"ramonbarbatt",   pos:"ZAG",goals:0,assists:0,rating:0},
        {name:"calalam",        pos:"ZAG",goals:0,assists:0,rating:0},
        {name:"Igoor_Xerife",   pos:"ZAG",goals:0,assists:0,rating:7.3},
        {name:"x_LINNO_x",      pos:"VOL",goals:0,assists:0,rating:6.6},
        {name:"Mtscruz",        pos:"VOL",goals:0,assists:0,rating:6.6},
        {name:"Gott_-_Zico",    pos:"VOL",goals:0,assists:0,rating:0},
        {name:"Lucimito0605",   pos:"VOL",goals:0,assists:0,rating:7.5},
        {name:"Ritalino",       pos:"MEI",goals:0,assists:0,rating:0},
        {name:"Poseidonn07",    pos:"ALA",goals:0,assists:0,rating:0},
        {name:"Niury_Lopes",    pos:"ALA",goals:0,assists:0,rating:0},
        {name:"Slowjoao123",    pos:"ALA",goals:0,assists:0,rating:0},
        {name:"VinaAntunes98",  pos:"ALA",goals:0,assists:0,rating:0},
        {name:"HellShark013",   pos:"ALA",goals:0,assists:0,rating:6.7},
        {name:"Dioliver_777",   pos:"ATA",goals:0,assists:0,rating:6.7},
        {name:"ShowNeka",       pos:"ATA",goals:1,assists:0,rating:7.3},
        {name:"Meirelesgol",    pos:"ATA",goals:0,assists:0,rating:0},
        {name:"Dallasxxz",      pos:"ATA",goals:0,assists:0,rating:0},
      ]
    });
    return makeGame(t);
  })
});

const getWeekKey = () => {
  const now = new Date();
  const d = new Date(Date.UTC(now.getFullYear(),now.getMonth(),now.getDate()));
  const day = d.getUTCDay()||7;
  d.setUTCDate(d.getUTCDate()+4-day);
  const y = new Date(Date.UTC(d.getUTCFullYear(),0,1));
  const w = Math.ceil(((d-y)/86400000+1)/7);
  return `${d.getUTCFullYear()}-W${String(w).padStart(2,"0")}`;
};

const getMvp = (players) => {
  const v = players.filter(p=>p.rating>0);
  if(!v.length) return "";
  return [...v].sort((a,b)=>b.rating-a.rating)[0].name;
};

const fmtDate = (val) => {
  if(!val) return "";
  return new Date(val+"T12:00:00").toLocaleDateString("pt-BR",{day:"2-digit",month:"2-digit"});
};

const loadData = () => {
  try {
    // Try new key first
    const s4 = localStorage.getItem("bfc_v4");
    if(s4) {
      const parsed = JSON.parse(s4);
      // Migrate old player names to new SQUAD if needed
      const needsMigration = Object.values(parsed?.weeks||{}).some(wk =>
        Object.values(wk).some(day =>
          (day?.games||[]).some(g => g.players?.some(p => !p.pos))
        )
      );
      if(needsMigration) {
        // Update all games to use new squad
        Object.keys(parsed.weeks||{}).forEach(wk => {
          Object.keys(parsed.weeks[wk]||{}).forEach(day => {
            (parsed.weeks[wk][day]?.games||[]).forEach((g,gi) => {
              parsed.weeks[wk][day].games[gi].players = SQUAD.map(p => ({
                name:p.name, pos:p.pos, goals:0, assists:0, rating:0
              }));
            });
          });
        });
        localStorage.setItem("bfc_v4", JSON.stringify(parsed));
      }
      return parsed;
    }
    // Try old key
    const s3 = localStorage.getItem("bfc_v3");
    if(s3) {
      const old = JSON.parse(s3);
      // Rebuild with new squad
      Object.keys(old.weeks||{}).forEach(wk => {
        Object.keys(old.weeks[wk]||{}).forEach(day => {
          (old.weeks[wk][day]?.games||[]).forEach((g,gi) => {
            old.weeks[wk][day].games[gi].players = SQUAD.map(p => ({
              name:p.name, pos:p.pos, goals:0, assists:0, rating:0
            }));
          });
        });
      });
      localStorage.setItem("bfc_v4", JSON.stringify(old));
      return old;
    }
  } catch{}
  return null;
};

const computeAllTime = (data) => {
  const map = {};
  const weekHistory = [];
  Object.entries(data?.weeks||{}).forEach(([wk, weekData]) => {
    const weekMap = {};
    DAYS.forEach(day => {
      (weekData[day]?.games||[]).forEach(g => {
        if(!g.played) return;
        const mvp = getMvp(g.players.filter(p=>p.rating>0));
        g.players.forEach(p => {
          if(!map[p.name]) map[p.name]={name:p.name,goals:0,assists:0,ratings:[],mvps:0,games:0};
          map[p.name].goals+=p.goals;
          map[p.name].assists+=p.assists;
          if(p.rating>0){map[p.name].ratings.push(p.rating);map[p.name].games++;}
          if(mvp===p.name) map[p.name].mvps++;
          if(!weekMap[p.name]) weekMap[p.name]={name:p.name,goals:0,assists:0,ratings:[],mvps:0};
          weekMap[p.name].goals+=p.goals;
          weekMap[p.name].assists+=p.assists;
          if(p.rating>0) weekMap[p.name].ratings.push(p.rating);
          if(mvp===p.name) weekMap[p.name].mvps++;
        });
      });
    });
    const weekRanked = Object.values(weekMap).map(p=>({
      ...p,
      pts:+(p.goals*3+p.assists*2+(p.ratings.length?(p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length)*1.5:0)+p.mvps*5).toFixed(1)
    })).sort((a,b)=>b.pts-a.pts);
    if(weekRanked.length) weekHistory.push({week:wk,winner:weekRanked[0]?.name||"",pts:weekRanked[0]?.pts||0});
  });
  return {
    players: Object.values(map).map(p=>({
      ...p,
      avg:p.ratings.length?+(p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length).toFixed(1):0,
    })),
    weekHistory: weekHistory.reverse()
  };
};

// Styles
const F = "Barlow Condensed,sans-serif";
const inp = (edit=true) => ({
  background:edit?"rgba(255,255,255,0.07)":"transparent",
  border:edit?"1px solid rgba(255,107,0,0.4)":"1px solid transparent",
  borderRadius:6,color:"#FFF",padding:"7px 10px",
  fontFamily:F,fontSize:14,outline:"none",
  width:"100%",boxSizing:"border-box",
  pointerEvents:edit?"auto":"none",
});
const inpSm = (edit=true,color="#DDD") => ({
  background:edit?"rgba(255,255,255,0.06)":"transparent",
  border:edit?"1px solid rgba(255,107,0,0.25)":"none",
  borderRadius:4,color,padding:"3px 4px",width:40,
  fontFamily:"monospace",fontSize:13,textAlign:"center",outline:"none",
  pointerEvents:edit?"auto":"none",
});
const lbl = {display:"block",fontFamily:F,fontSize:11,color:"#666",marginBottom:3,letterSpacing:1.5,textTransform:"uppercase"};
const pill = (active,c="#FF6B00") => ({
  fontFamily:F,fontSize:14,letterSpacing:2,fontWeight:700,
  padding:"8px 16px",border:`2px solid ${active?c:"rgba(255,107,0,0.2)"}`,
  background:active?`${c}22`:"rgba(255,107,0,0.03)",
  color:active?c:"#555",borderRadius:8,cursor:"pointer",transition:"all .15s",whiteSpace:"nowrap"
});

function PinModal({onSuccess,onClose}) {
  const [pin,setPin]=useState("");
  const [err,setErr]=useState(false);
  const tryPin=()=>{
    if(pin===CORRECT_PIN){onSuccess();onClose();}
    else{setErr(true);setPin("");setTimeout(()=>setErr(false),1200);}
  };
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.92)",zIndex:999,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px)"}}>
      <div style={{background:"#161008",border:"2px solid #FF6B00",borderRadius:16,
        padding:"32px 28px",textAlign:"center",minWidth:260,
        boxShadow:"0 0 60px rgba(255,107,0,0.3)"}}>
        <img src="/logo.png" alt="" style={{width:72,marginBottom:12,borderRadius:8}}/>
        <div style={{fontFamily:F,fontWeight:700,fontSize:26,color:"#FF6B00",letterSpacing:3,marginBottom:4}}>MODO EDIÇÃO</div>
        <div style={{fontFamily:F,fontSize:13,color:"#555",marginBottom:18}}>Digite o PIN para editar</div>
        <input type="password" value={pin} onChange={e=>setPin(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&tryPin()} maxLength={6} autoFocus
          style={{...inp(true),textAlign:"center",fontSize:28,letterSpacing:10,padding:"10px",
            marginBottom:10,border:`2px solid ${err?"#FF3300":"rgba(255,107,0,0.5)"}`}}/>
        {err&&<div style={{color:"#FF3300",fontSize:12,marginBottom:8}}>PIN incorreto ❌</div>}
        <div style={{display:"flex",gap:8,marginTop:6}}>
          <button onClick={onClose} style={{...pill(false),flex:1}}>CANCELAR</button>
          <button onClick={tryPin} style={{...pill(true),flex:1,background:"#FF6B00",color:"#000"}}>ENTRAR</button>
        </div>
      </div>
    </div>
  );
}

function ShareCard({game,dayLabel,onClose}) {
  const mvp = getMvp(game.players.filter(p=>p.rating>0));
  const mvpData = game.players.find(p=>p.name===mvp);
  const scorers = game.players.filter(p=>p.goals>0);
  const assisters = game.players.filter(p=>p.assists>0);
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,0.95)",zIndex:998,
      display:"flex",alignItems:"center",justifyContent:"center",padding:16,
      backdropFilter:"blur(10px)"}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{
        width:"min(360px,100%)",background:"linear-gradient(145deg,#1a0f00,#0C0905)",
        border:"2px solid #FF6B00",borderRadius:16,overflow:"hidden",
        boxShadow:"0 0 60px rgba(255,107,0,0.4)"}}>
        <div style={{background:"linear-gradient(90deg,#FF6B00,#CC4400)",
          padding:"12px 16px",display:"flex",alignItems:"center",gap:10}}>
          <img src="/logo.png" alt="" style={{width:40,height:40,borderRadius:6}}/>
          <div style={{flex:1}}>
            <div style={{fontFamily:F,fontWeight:900,fontSize:20,color:"#000",letterSpacing:2}}>BROOKLIN FC</div>
            <div style={{fontFamily:F,fontSize:11,color:"rgba(0,0,0,0.6)",letterSpacing:1}}>TEMPORADA {SEASON}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontFamily:F,fontWeight:700,fontSize:12,color:"rgba(0,0,0,0.7)"}}>{dayLabel}</div>
            {game.championship&&<div style={{fontFamily:F,fontSize:11,color:"rgba(0,0,0,0.6)"}}>{game.championship}</div>}
          </div>
        </div>
        <div style={{padding:"20px 16px",textAlign:"center",borderBottom:"1px solid rgba(255,107,0,0.2)"}}>
          <div style={{fontFamily:F,fontSize:13,color:"#777",letterSpacing:2,marginBottom:6}}>
            BROOKLIN FC vs {game.opponent||"ADVERSÁRIO"}
          </div>
          <div style={{fontFamily:F,fontWeight:900,fontSize:56,color:"#FF6B00",lineHeight:1}}>
            {game.result||"— x —"}
          </div>
        </div>
        {mvp&&(
          <div style={{padding:"12px 16px",background:"rgba(255,107,0,0.08)",
            borderBottom:"1px solid rgba(255,107,0,0.15)",display:"flex",alignItems:"center",gap:10}}>
            <span style={{fontSize:22}}>🏆</span>
            <div>
              <div style={{fontFamily:F,fontSize:10,color:"#FF6B00",letterSpacing:2}}>MVP DA PARTIDA</div>
              <div style={{fontFamily:F,fontWeight:700,fontSize:18,color:"#FFF"}}>{mvp}</div>
              <div style={{fontFamily:F,fontSize:12,color:"#777"}}>
                Nota {mvpData?.rating.toFixed(1)} · {mvpData?.goals}G · {mvpData?.assists}A
              </div>
            </div>
          </div>
        )}
        <div style={{padding:"12px 16px"}}>
          {scorers.length>0&&<div style={{marginBottom:8}}>
            <div style={lbl}>⚽ Gols</div>
            <div style={{fontFamily:F,fontSize:14,color:"#DDD"}}>{scorers.map(p=>`${p.name}(${p.goals})`).join(" · ")}</div>
          </div>}
          {assisters.length>0&&<div>
            <div style={lbl}>🅰️ Assistências</div>
            <div style={{fontFamily:F,fontSize:14,color:"#DDD"}}>{assisters.map(p=>`${p.name}(${p.assists})`).join(" · ")}</div>
          </div>}
        </div>
        <div style={{padding:"8px 16px",textAlign:"center",borderTop:"1px solid rgba(255,107,0,0.1)"}}>
          <div style={{fontFamily:F,fontSize:11,color:"#333",letterSpacing:1}}>📸 Tire um print e poste no Instagram!</div>
        </div>
        <div style={{padding:"8px 16px 14px",textAlign:"center"}}>
          <button onClick={onClose} style={{...pill(true),width:"100%",justifyContent:"center"}}>FECHAR</button>
        </div>
      </div>
    </div>
  );
}

const POS_ORDER = ["GK","ZAG","VOL","MEI","ALA","ATA"];
const POS_COLOR = {GK:"#FFD700",ZAG:"#4FC3F7",VOL:"#81C784",MEI:"#CE93D8",ALA:"#FFB74D",ATA:"#FF6B00"};

function PlayerTable({players,setPlayers,editable}) {
  const mvp = getMvp(players);
  const upd=(i,f,v)=>{if(!editable)return;const n=[...players];n[i]={...n[i],[f]:v};setPlayers(n);};

  // Group by position order
  const grouped = POS_ORDER.map(pos=>({
    pos,
    players: players.map((p,i)=>({...p,_i:i})).filter(p=>p.pos===pos)
  })).filter(g=>g.players.length>0);
  // Players with no pos
  const noPosPlayers = players.map((p,i)=>({...p,_i:i})).filter(p=>!p.pos);

  const renderRow = (p) => {
    const isMvp = p.name===mvp&&p.rating>0;
    const i = p._i;
    return (
      <tr key={i} style={{background:isMvp?"rgba(255,107,0,0.08)":"transparent",
        borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
        <td style={{padding:"4px 3px 4px 4px",width:32}}>
          <span style={{fontFamily:F,fontWeight:700,fontSize:10,
            color:POS_COLOR[p.pos]||"#666",
            background:`${POS_COLOR[p.pos]||"#666"}22`,
            padding:"1px 4px",borderRadius:3,whiteSpace:"nowrap"}}>
            {p.pos||"—"}
          </span>
        </td>
        <td style={{padding:"4px"}}>
          {editable
            ?<input value={p.name} onChange={e=>upd(i,"name",e.target.value)}
                style={{...inp(true),padding:"3px 6px",fontSize:12,color:isMvp?"#FF6B00":"#DDD"}}/>
            :<span style={{fontFamily:F,fontWeight:isMvp?700:400,
                color:isMvp?"#FF6B00":"#DDD",fontSize:13,display:"block",padding:"3px 0"}}>
                {isMvp?"⚡ ":""}{p.name}
              </span>
          }
        </td>
        <td style={{padding:"4px 3px",textAlign:"center",width:36}}>
          {editable
            ?<input type="number" min={0} max={20} value={p.goals} onChange={e=>upd(i,"goals",+e.target.value)} style={inpSm(true,p.goals>0?"#FF6B00":"#DDD")}/>
            :<span style={{fontFamily:"monospace",fontSize:13,color:p.goals>0?"#FF6B00":"#555"}}>{p.goals}</span>
          }
        </td>
        <td style={{padding:"4px 3px",textAlign:"center",width:36}}>
          {editable
            ?<input type="number" min={0} max={20} value={p.assists} onChange={e=>upd(i,"assists",+e.target.value)} style={inpSm(true,p.assists>0?"#FFD700":"#DDD")}/>
            :<span style={{fontFamily:"monospace",fontSize:13,color:p.assists>0?"#FFD700":"#555"}}>{p.assists}</span>
          }
        </td>
        <td style={{padding:"4px 3px",textAlign:"center",width:44}}>
          {editable
            ?<input type="number" min={0} max={10} step={0.1} value={p.rating} onChange={e=>upd(i,"rating",parseFloat(e.target.value)||0)}
                style={{...inpSm(true,p.rating>=8?"#FF6B00":p.rating>=7?"#FFD700":"#DDD"),width:44}}/>
            :<span style={{fontFamily:F,fontWeight:700,fontSize:15,
                color:p.rating>=8?"#FF6B00":p.rating>=7?"#FFD700":p.rating>0?"#AAA":"#333"}}>
                {p.rating>0?p.rating.toFixed(1):"—"}
              </span>
          }
        </td>
        {editable&&<td style={{padding:"4px 3px",textAlign:"center",width:24}}>
          <button onClick={()=>setPlayers(players.filter((_,idx)=>idx!==i))}
            style={{background:"none",border:"none",color:"#441100",cursor:"pointer",fontSize:12}}>✕</button>
        </td>}
      </tr>
    );
  };

  return (
    <div>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
        <thead>
          <tr style={{borderBottom:"1px solid rgba(255,107,0,0.2)"}}>
            <th style={{padding:"4px",color:"#555",fontFamily:F,fontWeight:700,fontSize:11,width:32}}></th>
            <th style={{padding:"4px",color:"#FF6B00",fontFamily:F,fontWeight:700,fontSize:12,letterSpacing:1,textAlign:"left"}}>PSN</th>
            <th style={{padding:"4px",color:"#FF6B00",fontFamily:F,fontWeight:700,fontSize:12,textAlign:"center",width:36}}>G</th>
            <th style={{padding:"4px",color:"#FF6B00",fontFamily:F,fontWeight:700,fontSize:12,textAlign:"center",width:36}}>A</th>
            <th style={{padding:"4px",color:"#FF6B00",fontFamily:F,fontWeight:700,fontSize:12,textAlign:"center",width:44}}>NOTA</th>
            {editable&&<th style={{width:24}}></th>}
          </tr>
        </thead>
        <tbody>
          {grouped.map(g=>g.players.map(p=>renderRow(p)))}
          {noPosPlayers.map(p=>renderRow(p))}
        </tbody>
      </table>
      {editable&&<button onClick={()=>setPlayers([...players,{name:"",pos:"",goals:0,assists:0,rating:0}])}
        style={{...pill(false),fontSize:11,padding:"4px 12px",marginTop:6}}>+ jogador</button>}
    </div>
  );
}

function GameCard({game,onUpdate,editable,dayLabel}) {
  const [open,setOpen]=useState(game.played);
  const [sharing,setSharing]=useState(false);
  const mvp=getMvp(game.players.filter(p=>p.rating>0));
  const topR=game.players.length?Math.max(...game.players.map(p=>p.rating)):0;
  return (
    <>
      {sharing&&<ShareCard game={game} dayLabel={dayLabel} onClose={()=>setSharing(false)}/>}
      <div style={{background:"rgba(18,12,6,0.97)",
        border:`1px solid ${game.played?"#FF6B00":"rgba(255,107,0,0.1)"}`,
        borderRadius:12,marginBottom:10,overflow:"hidden",
        boxShadow:game.played?"0 4px 20px rgba(255,107,0,0.1)":"none"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,padding:"10px 12px",
          background:"rgba(255,107,0,0.03)",cursor:"pointer"}} onClick={()=>setOpen(o=>!o)}>
          <span style={{fontFamily:F,fontWeight:700,fontSize:22,color:"#FF6B00",minWidth:50}}>{game.time}</span>
          {editable&&(
            <label style={{display:"flex",alignItems:"center",gap:4}} onClick={e=>e.stopPropagation()}>
              <input type="checkbox" checked={game.played}
                onChange={e=>onUpdate({...game,played:e.target.checked})}
                style={{accentColor:"#FF6B00",width:14,height:14}}/>
              <span style={{fontSize:10,color:"#555",fontFamily:F,letterSpacing:1}}>JOGADO</span>
            </label>
          )}
          <div style={{display:"flex",alignItems:"center",gap:6,flex:1,flexWrap:"wrap",minWidth:0}}>
            {game.played?(
              <>
                <span style={{fontFamily:F,fontSize:14,color:"#DDD"}}>{game.opponent||"—"}</span>
                {game.result&&<span style={{fontFamily:F,fontWeight:700,fontSize:15,color:"#FF6B00",
                  background:"rgba(255,107,0,0.12)",padding:"1px 7px",borderRadius:4}}>{game.result}</span>}
                {game.championship&&<span style={{fontSize:10,color:"#666",border:"1px solid #222",
                  padding:"1px 5px",borderRadius:3,fontFamily:F}}>{game.championship}</span>}
              </>
            ):<span style={{fontFamily:F,fontSize:12,color:"#333"}}>Aguardando...</span>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:6}}>
            {game.played&&(
              <button onClick={e=>{e.stopPropagation();setSharing(true);}}
                style={{background:"rgba(255,107,0,0.1)",border:"1px solid rgba(255,107,0,0.3)",
                  color:"#FF6B00",borderRadius:6,padding:"3px 8px",cursor:"pointer",
                  fontFamily:F,fontSize:11,letterSpacing:1}}>📸</button>
            )}
            {mvp&&game.played&&<span style={{fontFamily:F,fontWeight:700,fontSize:10,color:"#000",
              background:"#FF6B00",padding:"2px 6px",borderRadius:3}}>MVP:{mvp}</span>}
            <span style={{color:"#FF6B00",fontSize:12}}>{open?"▲":"▼"}</span>
          </div>
        </div>
        {open&&(
          <div style={{padding:"12px"}}>
            {editable?(
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 70px",gap:8,marginBottom:12}}>
                <div><label style={lbl}>Adversário</label>
                  <input style={inp(true)} value={game.opponent} placeholder="Ex: GalaxFC"
                    onChange={e=>onUpdate({...game,opponent:e.target.value})}/></div>
                <div><label style={lbl}>Campeonato</label>
                  <input style={inp(true)} value={game.championship} placeholder="Ex: Div 1"
                    onChange={e=>onUpdate({...game,championship:e.target.value})}/></div>
                <div><label style={lbl}>Placar</label>
                  <input style={inp(true)} value={game.result} placeholder="3 x 1"
                    onChange={e=>onUpdate({...game,result:e.target.value})}/></div>
              </div>
            ):game.played&&(
              <div style={{display:"flex",gap:14,marginBottom:12,flexWrap:"wrap"}}>
                {game.opponent&&<div><span style={lbl}>vs</span>
                  <span style={{fontFamily:F,color:"#DDD",fontSize:15}}>{game.opponent}</span></div>}
                {game.championship&&<div><span style={lbl}>Campeonato</span>
                  <span style={{fontFamily:F,color:"#DDD",fontSize:15}}>{game.championship}</span></div>}
                {game.result&&<div><span style={lbl}>Placar</span>
                  <span style={{fontFamily:F,fontWeight:700,fontSize:24,color:"#FF6B00"}}>{game.result}</span></div>}
              </div>
            )}
            <PlayerTable players={game.players}
              setPlayers={players=>onUpdate({...game,players})} editable={editable}/>
            {mvp&&(
              <div style={{marginTop:10,padding:"8px 12px",background:"rgba(255,107,0,0.07)",
                borderRadius:8,border:"1px solid rgba(255,107,0,0.2)",display:"flex",gap:10,alignItems:"center"}}>
                <span style={{fontSize:16}}>🏆</span>
                <span style={{fontFamily:F,fontWeight:700,color:"#FF6B00",fontSize:16}}>MVP</span>
                <span style={{fontFamily:F,color:"#FFF",fontSize:16}}>{mvp}</span>
                <span style={{color:"#777",fontSize:12}}>
                  {topR.toFixed(1)} · {game.players.find(p=>p.name===mvp)?.goals||0}G · {game.players.find(p=>p.name===mvp)?.assists||0}A
                </span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function WeekRanking({weekData,editable,manualRanking,setManualRanking}) {
  const [mode,setMode]=useState("auto");
  const statsMap={};
  DAYS.forEach(day=>{
    (weekData[day]?.games||[]).forEach(g=>{
      if(!g.played)return;
      const mvp=getMvp(g.players.filter(p=>p.rating>0));
      g.players.forEach(p=>{
        if(!statsMap[p.name]) statsMap[p.name]={name:p.name,goals:0,assists:0,ratings:[],mvps:0};
        statsMap[p.name].goals+=p.goals;
        statsMap[p.name].assists+=p.assists;
        if(p.rating>0) statsMap[p.name].ratings.push(p.rating);
        if(mvp===p.name) statsMap[p.name].mvps++;
      });
    });
  });
  const ranked=Object.values(statsMap).map(p=>({
    ...p,
    avg:p.ratings.length?+(p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length).toFixed(1):0,
    pts:+(p.goals*3+p.assists*2+(p.ratings.length?(p.ratings.reduce((a,b)=>a+b,0)/p.ratings.length)*1.5:0)+p.mvps*5).toFixed(1)
  })).sort((a,b)=>b.pts-a.pts);
  const medals=["🥇","🥈","🥉"];
  return (
    <div>
      <div style={{display:"flex",gap:8,marginBottom:14}}>
        {[["auto","⚡ AUTO"],["manual","✏️ MANUAL"]].map(([k,l])=>(
          <button key={k} onClick={()=>setMode(k)} style={pill(mode===k)}>{l}</button>
        ))}
      </div>
      <div style={{fontSize:11,color:"#444",marginBottom:12,fontFamily:F,letterSpacing:1}}>
        Gol=3pts · Assist=2pts · Nota×1.5 · MVP=5pts
      </div>
      {mode==="auto"?(
        ranked.length===0
          ?<div style={{color:"#333",textAlign:"center",padding:40,fontFamily:F}}>Nenhum jogo registrado ainda</div>
          :ranked.map((p,i)=>(
            <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",
              marginBottom:6,borderRadius:10,
              background:i===0?"rgba(255,107,0,0.12)":"rgba(255,255,255,0.02)",
              border:`1px solid ${i===0?"#FF6B00":"rgba(255,255,255,0.05)"}`,
              boxShadow:i===0?"0 0 20px rgba(255,107,0,0.15)":"none"}}>
              <span style={{fontFamily:F,fontWeight:700,fontSize:20,minWidth:28,color:i<3?"#FF6B00":"#444"}}>{medals[i]||`#${i+1}`}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:16,color:i===0?"#FF6B00":"#DDD"}}>{p.name}</div>
                <div style={{fontSize:11,color:"#666",fontFamily:F}}>
                  ⚽{p.goals} · 🅰️{p.assists} · ⭐{p.avg}
                  {p.mvps>0&&<span style={{color:"#FF6B00",marginLeft:8}}>{p.mvps}×MVP</span>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:22,color:"#FF6B00"}}>{p.pts}</div>
                <div style={{fontSize:9,color:"#444"}}>PTS</div>
              </div>
            </div>
          ))
      ):(
        <ManualRanking ranking={manualRanking} setRanking={setManualRanking} editable={editable}/>
      )}
    </div>
  );
}

function ManualRanking({ranking,setRanking,editable}) {
  const medals=["🥇","🥈","🥉"];
  const add=()=>{if(editable)setRanking(p=>[...p,{name:"",goals:0,assists:0,note:""}]);};
  const remove=(i)=>{if(editable)setRanking(p=>p.filter((_,idx)=>idx!==i));};
  const upd=(i,f,v)=>{if(editable)setRanking(p=>p.map((r,idx)=>idx===i?{...r,[f]:v}:r));};
  if(!ranking.length&&!editable) return <div style={{color:"#333",textAlign:"center",padding:40,fontFamily:F}}>Ranking manual não definido</div>;
  return (
    <div>
      {ranking.map((r,i)=>(
        <div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:6,
          background:i===0?"rgba(255,107,0,0.1)":"rgba(255,255,255,0.03)",
          border:`1px solid ${i===0?"#FF6B00":"rgba(255,255,255,0.05)"}`,borderRadius:8}}>
          <span style={{fontFamily:F,fontWeight:700,fontSize:18,minWidth:24,color:"#FF6B00"}}>{medals[i]||`#${i+1}`}</span>
          {editable?(
            <>
              <input placeholder="Nome" value={r.name} onChange={e=>upd(i,"name",e.target.value)}
                style={{...inp(true),width:110,padding:"4px 8px",fontSize:13}}/>
              <input placeholder="Obs..." value={r.note||""} onChange={e=>upd(i,"note",e.target.value)}
                style={{...inp(true),flex:1,fontSize:12,padding:"4px 8px"}}/>
              <button onClick={()=>remove(i)} style={{background:"none",border:"none",color:"#882200",cursor:"pointer",fontSize:14}}>✕</button>
            </>
          ):(
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:15,color:i===0?"#FF6B00":"#DDD"}}>{r.name}</div>
              {r.note&&<div style={{fontSize:11,color:"#555"}}>{r.note}</div>}
            </div>
          )}
        </div>
      ))}
      {editable&&<button onClick={add} style={{...pill(false),width:"100%",textAlign:"center",marginTop:4,fontSize:12}}>+ ADICIONAR</button>}
    </div>
  );
}

function AllTimeStats({data}) {
  const {players,weekHistory}=computeAllTime(data);
  const [view,setView]=useState("artilheiros");
  const medals=["🥇","🥈","🥉"];
  const lists={
    artilheiros:[...players].sort((a,b)=>b.goals-a.goals).filter(p=>p.goals>0),
    assistencias:[...players].sort((a,b)=>b.assists-a.assists).filter(p=>p.assists>0),
    notas:[...players].sort((a,b)=>b.avg-a.avg).filter(p=>p.games>0),
    mvps:[...players].sort((a,b)=>b.mvps-a.mvps).filter(p=>p.mvps>0),
  };
  const val=(p)=>view==="artilheiros"?p.goals:view==="assistencias"?p.assists:view==="notas"?p.avg:p.mvps;
  const suffix=(p)=>view==="artilheiros"?`⚽`:view==="assistencias"?`🅰️`:view==="notas"?`⭐`:view==="mvps"?`🏆`:"";
  return (
    <div>
      {weekHistory.length>0&&(
        <div style={{marginBottom:22}}>
          <div style={{fontFamily:F,fontWeight:700,fontSize:16,color:"#FF6B00",letterSpacing:2,marginBottom:10}}>🏆 CAMPEÕES DE SEMANA</div>
          {weekHistory.map((w,i)=>(
            <div key={w.week} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",marginBottom:6,
              borderRadius:8,background:i===0?"rgba(255,107,0,0.1)":"rgba(255,255,255,0.02)",
              border:`1px solid ${i===0?"rgba(255,107,0,0.4)":"rgba(255,255,255,0.05)"}`}}>
              <span style={{fontSize:16}}>{i===0?"👑":"🏅"}</span>
              <div style={{flex:1}}>
                <div style={{fontFamily:F,fontWeight:700,fontSize:15,color:i===0?"#FF6B00":"#DDD"}}>{w.winner}</div>
                <div style={{fontSize:11,color:"#555",fontFamily:F}}>{w.week}</div>
              </div>
              <div style={{fontFamily:F,fontWeight:700,fontSize:18,color:"#FF6B00"}}>{w.pts}pts</div>
            </div>
          ))}
        </div>
      )}
      <div style={{fontFamily:F,fontWeight:700,fontSize:16,color:"#FF6B00",letterSpacing:2,marginBottom:10}}>📊 TEMPORADA {SEASON}</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
        {[["artilheiros","⚽ ARTILHEIROS"],["assistencias","🅰️ GARÇONS"],["notas","⭐ NOTAS"],["mvps","🏆 MVPs"]].map(([k,l])=>(
          <button key={k} onClick={()=>setView(k)} style={{...pill(view===k),fontSize:12,padding:"8px 6px",textAlign:"center"}}>{l}</button>
        ))}
      </div>
      {lists[view].length===0
        ?<div style={{color:"#333",textAlign:"center",padding:30,fontFamily:F}}>Sem dados ainda</div>
        :lists[view].map((p,i)=>(
          <div key={p.name} style={{display:"flex",alignItems:"center",gap:10,padding:"9px 12px",marginBottom:5,
            borderRadius:8,background:i===0?"rgba(255,107,0,0.1)":"rgba(255,255,255,0.02)",
            border:`1px solid ${i===0?"rgba(255,107,0,0.4)":"rgba(255,255,255,0.04)"}`}}>
            <span style={{fontFamily:F,fontWeight:700,fontSize:18,minWidth:26,color:i<3?"#FF6B00":"#444"}}>{medals[i]||`#${i+1}`}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:F,fontWeight:700,fontSize:15,color:i===0?"#FF6B00":"#DDD"}}>{p.name}</div>
              <div style={{fontSize:11,color:"#555",fontFamily:F}}>
                {view==="artilheiros"&&`${p.goals}G · ${p.assists}A · ${p.games} jogos`}
                {view==="assistencias"&&`${p.assists}A · ${p.goals}G · ${p.games} jogos`}
                {view==="notas"&&`Média ${p.avg} · ${p.games} jogos`}
                {view==="mvps"&&`${p.mvps}× MVP · ${p.goals}G`}
              </div>
            </div>
            <div style={{fontFamily:F,fontWeight:900,fontSize:28,color:"#FF6B00"}}>{val(p)}</div>
          </div>
        ))
      }
    </div>
  );
}

function NextGameBanner({data,weekKey}) {
  let nextGame=null;
  DAYS.forEach(day=>{
    const dayData=data?.weeks?.[weekKey]?.[day];
    if(!dayData) return;
    (dayData.games||[]).forEach(g=>{
      if(g.played||!g.opponent) return;
      if(!nextGame) nextGame={day,date:dayData.date,time:g.time,opponent:g.opponent,championship:g.championship};
    });
  });
  if(!nextGame) return null;
  return (
    <div style={{background:"linear-gradient(135deg,rgba(255,107,0,0.13),rgba(255,107,0,0.04))",
      border:"1px solid rgba(255,107,0,0.35)",borderRadius:12,padding:"12px 14px",
      marginBottom:14,display:"flex",alignItems:"center",gap:12}}>
      <span style={{fontSize:26}}>🎮</span>
      <div style={{flex:1}}>
        <div style={{fontFamily:F,fontSize:10,color:"#FF6B00",letterSpacing:2,marginBottom:2}}>PRÓXIMO JOGO</div>
        <div style={{fontFamily:F,fontWeight:700,fontSize:18,color:"#FFF"}}>vs {nextGame.opponent}</div>
        <div style={{fontFamily:F,fontSize:12,color:"#777"}}>
          {nextGame.day}{nextGame.date?` · ${fmtDate(nextGame.date)}`:""} · {nextGame.time}
          {nextGame.championship&&` · ${nextGame.championship}`}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [weekKey,setWeekKey]=useState(getWeekKey());
  const [activeDay,setActiveDay]=useState("Segunda");
  const [tab,setTab]=useState("jogos");
  const [editable,setEditable]=useState(false);
  const [showPin,setShowPin]=useState(false);
  const [manualRanking,setManualRanking]=useState([]);

  const [data,setData]=useState(()=>{
    const saved=loadData();
    if(saved) return saved;
    const wk=getWeekKey();
    const weeks={[wk]:{}};
    DAYS.forEach(d=>{weeks[wk][d]=makeDay(d);});
    return {weeks};
  });

  useEffect(()=>{
    setData(prev=>{
      const d=JSON.parse(JSON.stringify(prev));
      if(!d.weeks) d.weeks={};
      if(!d.weeks[weekKey]){d.weeks[weekKey]={};DAYS.forEach(day=>{d.weeks[weekKey][day]=makeDay(day);});}
      else{DAYS.forEach(day=>{if(!d.weeks[weekKey][day]) d.weeks[weekKey][day]=makeDay(day);});}
      return d;
    });
  },[weekKey]);

  useEffect(()=>{try{localStorage.setItem("bfc_v4",JSON.stringify(data));}catch{}},[data]);

  const weekData=data?.weeks?.[weekKey]||{};
  const updateGame=(day,gi,game)=>{setData(prev=>{const d=JSON.parse(JSON.stringify(prev));d.weeks[weekKey][day].games[gi]=game;return d;});};
  const setDayDate=(day,date)=>{setData(prev=>{const d=JSON.parse(JSON.stringify(prev));d.weeks[weekKey][day].date=date;return d;});};
  const playedCount=(day)=>(weekData[day]?.games||[]).filter(g=>g.played).length;
  const allWeeks=[...new Set([weekKey,...Object.keys(data?.weeks||{})])].sort().reverse();

  return (
    <div style={{minHeight:"100vh",background:"#0A0704",color:"#FFF",fontFamily:F,
      backgroundImage:"radial-gradient(ellipse at 50% 0%,rgba(255,107,0,0.06) 0%,transparent 60%)",
      maxWidth:480,margin:"0 auto"}}>
      <link href="https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@300;400;600;700;900&display=swap" rel="stylesheet"/>

      {showPin&&<PinModal onSuccess={()=>setEditable(true)} onClose={()=>setShowPin(false)}/>}

      {/* Header */}
      <div style={{background:"rgba(0,0,0,0.88)",borderBottom:"2px solid #FF6B00",
        padding:"10px 14px",display:"flex",alignItems:"center",gap:12,
        backdropFilter:"blur(12px)",position:"sticky",top:0,zIndex:100}}>
        <img src="/logo.png" alt="BFC" style={{width:40,height:40,borderRadius:8,border:"2px solid #FF6B00"}}/>
        <div style={{flex:1}}>
          <div style={{fontFamily:F,fontWeight:900,fontSize:20,letterSpacing:3,color:"#FF6B00",lineHeight:1}}>BROOKLIN FC</div>
          <div style={{fontSize:10,color:"#444",letterSpacing:2}}>TEMPORADA {SEASON}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <select value={weekKey} onChange={e=>setWeekKey(e.target.value)}
            style={{...inp(true),width:"auto",fontSize:11,padding:"3px 6px",color:"#888"}}>
            {allWeeks.map(w=><option key={w} value={w}>{w}</option>)}
          </select>
          <button onClick={()=>editable?setEditable(false):setShowPin(true)}
            style={{fontFamily:F,fontWeight:700,fontSize:13,letterSpacing:1,padding:"6px 10px",
              border:`2px solid ${editable?"#00FF88":"rgba(255,107,0,0.3)"}`,
              background:editable?"rgba(0,255,136,0.08)":"rgba(255,107,0,0.04)",
              color:editable?"#00FF88":"#555",borderRadius:8,cursor:"pointer",transition:"all .2s"}}>
            {editable?"🔓":"🔒"}
          </button>
        </div>
      </div>

      {/* Content */}
      <div style={{padding:"12px 14px 80px"}}>
        <NextGameBanner data={data} weekKey={weekKey}/>

        {tab==="jogos"&&(
          <>
            <div style={{display:"flex",gap:6,marginBottom:12}}>
              {DAYS.map(day=>{
                const dateVal=weekData[day]?.date||"";
                const dateLabel=fmtDate(dateVal);
                return (
                  <div key={day} style={{flex:1,display:"flex",flexDirection:"column",gap:4}}>
                    <button onClick={()=>setActiveDay(day)} style={{
                      width:"100%",fontFamily:F,fontWeight:700,fontSize:15,letterSpacing:1,
                      padding:"10px 4px",
                      border:`2px solid ${activeDay===day?"#FF6B00":"rgba(255,107,0,0.15)"}`,
                      background:activeDay===day?"rgba(255,107,0,0.13)":"rgba(255,107,0,0.02)",
                      color:activeDay===day?"#FF6B00":"#555",
                      borderRadius:8,cursor:"pointer",transition:"all .15s"}}>
                      {day}
                      <div style={{fontSize:11,color:dateLabel||playedCount(day)>0?"#FF6B00":"#333",marginTop:2}}>
                        {dateLabel||`${playedCount(day)}/4`}
                      </div>
                    </button>
                    {editable&&(
                      <input type="date" value={dateVal} onChange={e=>setDayDate(day,e.target.value)}
                        style={{...inp(true),fontSize:11,padding:"4px 6px",textAlign:"center",color:"#FF6B00"}}/>
                    )}
                  </div>
                );
              })}
            </div>
            {(weekData[activeDay]?.games||[]).map((game,i)=>(
              <GameCard key={i} game={game} editable={editable}
                dayLabel={`${activeDay}${weekData[activeDay]?.date?" · "+fmtDate(weekData[activeDay].date):""}`}
                onUpdate={updated=>editable&&updateGame(activeDay,i,updated)}/>
            ))}
          </>
        )}

        {tab==="ranking"&&(
          <>
            <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:"#FF6B00",
              letterSpacing:2,marginBottom:4,marginTop:4}}>🏅 SEMANA · {weekKey}</div>
            <WeekRanking weekData={weekData} editable={editable}
              manualRanking={manualRanking} setManualRanking={setManualRanking}/>
          </>
        )}

        {tab==="temporada"&&(
          <>
            <div style={{fontFamily:F,fontWeight:900,fontSize:22,color:"#FF6B00",
              letterSpacing:2,marginBottom:14,marginTop:4}}>🏆 TEMPORADA {SEASON}</div>
            <AllTimeStats data={data}/>
          </>
        )}
      </div>

      {/* Bottom tab bar */}
      <div style={{position:"fixed",bottom:0,left:"50%",transform:"translateX(-50%)",
        width:"min(480px,100vw)",background:"rgba(8,5,2,0.97)",
        borderTop:"2px solid #FF6B00",display:"flex",zIndex:100,
        backdropFilter:"blur(12px)"}}>
        {[["jogos","⚽","JOGOS"],["ranking","🏆","RANKING"],["temporada","📊","TEMPORADA"]].map(([k,icon,label])=>(
          <button key={k} onClick={()=>setTab(k)} style={{
            flex:1,padding:"10px 4px 8px",border:"none",cursor:"pointer",
            background:tab===k?"rgba(255,107,0,0.1)":"transparent",
            borderTop:tab===k?"2px solid #FF6B00":"2px solid transparent",
            marginTop:-2,transition:"all .15s"}}>
            <div style={{fontSize:20}}>{icon}</div>
            <div style={{fontFamily:F,fontWeight:700,fontSize:10,letterSpacing:1,
              color:tab===k?"#FF6B00":"#444"}}>{label}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
