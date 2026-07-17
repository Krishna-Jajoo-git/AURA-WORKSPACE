import pool from '../config/db.js';
import z from 'zod';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const userSchema = z.object({
    name : z.string().min(2,{message: " Name must be atleast 2 characters long"}).max(60,{message: "Name too long"}),
    email : z.string().email({message: "Invalid email address"}),
    googleId : z.string().min(1,{message : "Google ID is required"}),
    picture : z.string().url({message: "Invalid Picture URL"}).optional()   

});

export const handleGoogleLogin = async(req,res)=>{
    try{
        const {credential,nickname} = req.body;

        if(nickname){
            console.log("Successfully Login");
            return res.status(200).json({                       // Honeypot intercept
                success:true,
                message:"Authenticated Successfully"
            });
        }
        
        if(!credential){
            return res.status(400).json({
                success:false,
                error : "Missing credential"
            });
        }

        const token = await client.verifyIdToken({
            idToken : credential,                       //Verify the Google ID Token
            audience : process.env.GOOGLE_CLIENT_ID
        })

        const payload = token.getPayload();
        
        const userData = userSchema.safeParse({
            googleId : payload['sub'],
            name : payload['name'],
            email : payload['email'],
            picture : payload['picture']
        })
        
        if(!userData.success){
            return res.status(400).json({
                success: false,
                message : "Invalid user data",
                error : userData.error.errors.map(err => err.message).join(",")
            })
        }

        const {googleId,name,email,picture}=userData.data;

        const upsertUserQuery ='INSERT INTO users (google_id,name,email,picture) VALUES ($1,$2,$3,$4) ON CONFLICT (google_id) DO UPDATE SET name = EXCLUDED.name , email =EXCLUDED.email , picture = EXCLUDED.picture RETURNING google_id,name,email,picture';

        const result = await pool.query(upsertUserQuery,[googleId,name,email,picture]);
        const user = result.rows[0];

        const jwtToken = jwt.sign({googleId : user.google_id},process.env.JWT_SECRET,{expiresIn : '24h'});

        res.cookie("aura_session",jwtToken,{
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "lax",
            maxAge : 24 * 60 * 60 * 1000
        });

        return res.status(200).json({
            success : true,
            message : "Authenticated Successfully",
            user : {
                googleId : user.google_id,
                name : user.name,
                email : user.email,
                picture : user.picture
            }
        });

    }catch(err){
        console.error(err);
        res.status(500).json({error: "Internal Server Error"});
    }   

}

export const getMe = async(req,res)=>{
    try{
        const query = 'SELECT google_id,name,email,picture FROM users WHERE google_id =$1';
        const result = await pool.query(query,[req.user.googleId]);

        if(result.rows.length === 0){
            return res.status(404).json({
                success : false,
                error : "User not found"
            })
        }

        return res.status(200).json({
            success : true,
            user : result.rows[0]
        })
        }catch(err){
            return res.status(500).json({
                success : false,
                error : "Internal Server Error"
            })
        }
}

export const handleLogout = (req,res)=>{
    try{
        res.clearCookie("aura_session",{
            httpOnly:true,
            secure: process.env.NODE_ENV ==="production",
            sameSite: "lax"
        })

        return res.status(200).json({
            success : true,
            message : "Logged out successfully"
        })
    }catch(err){
        return res.status(500).json({
            success : false,
            error : "Internal Server Error"
        })
    }
}