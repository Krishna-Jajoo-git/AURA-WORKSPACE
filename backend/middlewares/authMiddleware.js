import jwt from "jsonwebtoken";

export const requireAuth =(req,res,next)=>{
    try{
        const token = req.cookies.aura_session;

    if(!token){
        return res.status(401).json({
            success : false,
            error : "Unauthorized access , please login to continue"
        });
    }

    const decoded = jwt.verify(token,process.env.JWT_SECRET);
    req.user={email : decoded.email};
    next();
    }catch(err){
        return res.status(401).json({
            success : false,
            error : "Unauthorized access , please login to continue"
        });
    }
}