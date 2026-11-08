// The managed host strips and re-injects this header at its edge. A self-hosted
// Worker has no such edge, so any visitor could forge it and take over an account.
// Self-hosted deploys set LARO_DISABLE_HOST_AUTH=1 and rely on the guest cookie.
export function hostAuthenticatedUser(headers:Headers,disabled:unknown):string|null{
  return disabled==='1'?null:headers.get('oai-authenticated-user-id');
}
export function isSameOrigin(origin:string|null,requestUrl:string):boolean{
  if(!origin)return true;
  try{return new URL(origin).host===new URL(requestUrl).host;}catch{return false;}
}
