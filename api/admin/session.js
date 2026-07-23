const {verifySession}=require("./_auth");
module.exports=async function handler(req,res){if(req.method!=="GET")return res.status(405).json({error:"Method not allowed"});return verifySession(req)?res.status(200).json({authenticated:true}):res.status(401).json({authenticated:false})};
