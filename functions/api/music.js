// Lists public audio and image files currently present in /music in this GitHub repository.
// No manifest needs to be maintained when new files are added.
const REPO_API='https://api.github.com/repos/davilanco/davilanco/contents/music';
const AUDIO=/\.(mp3|m4a|aac|ogg|oga|wav|flac|opus)$/i;
const IMAGE=/\.(png|jpe?g|webp|gif|avif)$/i;
export async function onRequest({request}) {
  if(request.method!=='GET') return Response.json({error:'Method not allowed'},{status:405});
  try {
    const url=new URL(REPO_API);
    const response=await fetch(url,{headers:{Accept:'application/vnd.github+json','User-Agent':'Davilanco-Music-Site','X-GitHub-Api-Version':'2022-11-28'},cf:{cacheTtl:60,cacheEverything:true}});
    if(!response.ok) return Response.json({error:'Could not read the music folder from the public repository.'},{status:502});
    const files=await response.json();
    if(!Array.isArray(files)) return Response.json({tracks:[]});
    const images=new Map(files.filter(f=>f.type==='file'&&IMAGE.test(f.name)).map(f=>[f.name.replace(IMAGE,'' ).toLowerCase(),f.name]));
    const tracks=files.filter(f=>f.type==='file'&&AUDIO.test(f.name)).map(file=>{
      const base=file.name.replace(AUDIO,'');
      const imageName=images.get(base.toLowerCase())||'';
      const id=base.toLowerCase().replace(/[^a-z0-9_-]+/g,'-').replace(/^-|-$/g,'').slice(0,120)||base;
      return {id,title:base.replace(/[_-]+/g,' ').replace(/\s+/g,' ').trim(),audio:'/music/'+encodeURIComponent(file.name),image:imageName?'/music/'+encodeURIComponent(imageName):'',downloadName:file.name};
    }).sort((a,b)=>a.title.localeCompare(b.title));
    return Response.json({tracks},{headers:{'Cache-Control':'public, max-age=60'}});
  } catch (_) { return Response.json({error:'Music folder could not be loaded.'},{status:500}); }
}