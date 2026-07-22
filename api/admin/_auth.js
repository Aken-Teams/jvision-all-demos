const crypto=require("node:crypto");
const COOKIE="jv_admin";
function secret(){return process.env.SESSION_SECRET||""}
function signature(value){return crypto.createHmac("sha256",secret()).update(value).digest("base64url")}
function createSession(){const payload=Buffer.from(JSON.stringify({exp:Date.now()+8*60*60*1000})).toString("base64url");return `${payload}.${signature(payload)}`}
function readCookies(req){return Object.fromEntries(String(req.headers.cookie||"").split(";").map(x=>x.trim().split(/=(.*)/s)).filter(x=>x[0]))}
function verifySession(req){if(!secret())return false;const token=readCookies(req)[COOKIE]||"";const [payload,sig]=token.split(".");if(!payload||!sig)return false;const expected=signature(payload);if(sig.length!==expected.length||!crypto.timingSafeEqual(Buffer.from(sig),Buffer.from(expected)))return false;try{return JSON.parse(Buffer.from(payload,"base64url").toString()).exp>Date.now()}catch{return false}}
function setSession(res){res.setHeader("Set-Cookie",`${COOKIE}=${createSession()}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`)}
function clearSession(res){res.setHeader("Set-Cookie",`${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`)}
function safeEqual(a,b){const ah=crypto.createHash("sha256").update(String(a)).digest(),bh=crypto.createHash("sha256").update(String(b)).digest();return crypto.timingSafeEqual(ah,bh)}
module.exports={verifySession,setSession,clearSession,safeEqual};
