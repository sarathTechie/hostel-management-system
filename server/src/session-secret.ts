export const DEVELOPMENT_SESSION_SECRET='hms-development-only-change-before-deployment';

export function isStrongSessionSecret(secret:string|undefined):secret is string {
 if(!secret||secret===DEVELOPMENT_SESSION_SECRET||secret.length<32)return false;

 const frequencies=new Map<string,number>();
 for(const character of secret)frequencies.set(character,(frequencies.get(character)??0)+1);

 const entropy=[...frequencies.values()].reduce((total,count)=>{
  const probability=count/secret.length;
  return total-probability*Math.log2(probability);
 },0);

 return frequencies.size>=16&&entropy>=3.5;
}
