import pool from '../config/db.js';
import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { resend } from '../config/resend.js';
import {googleUserSchema,registerSchema,loginSchema} from '../schemas/userSchema.js';
import { storeOTP,getOTP,deleteOTP } from '../utils/otpstore.js'; 
import crypto from 'crypto';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// Controller functions for google authentication and management
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
        
        const userData = googleUserSchema.safeParse({
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

        const upsertUserQuery ='INSERT INTO users (google_id,name,email,picture,last_login) VALUES ($1,$2,$3,$4,CURRENT_TIMESTAMP) ON CONFLICT (email) DO UPDATE SET google_id = COALESCE(users.google_id, EXCLUDED.google_id), name = EXCLUDED.name, picture = EXCLUDED.picture, last_login = CURRENT_TIMESTAMP RETURNING google_id,name,email,picture';

        const result = await pool.query(upsertUserQuery,[googleId,name,email,picture]);
        const user = result.rows[0];

        const jwtToken = jwt.sign({email : user.email},process.env.JWT_SECRET,{expiresIn : '24h'});

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

// Controller functions for custom registration
export const handleRegister = async (req, res) => {
    try {
        const validation = registerSchema.safeParse(req.body);
        if (!validation.success) {
            return res.status(400).json({
                success: false,
                error: validation.error.errors.map(err => err.message).join(", ")
            });
        }

        const { name, email, password } = validation.data;

        const userExists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (userExists.rows.length > 0) {
            return res.status(400).json({ success: false, error: "A user with this email already exists." });
        }

        const otp = crypto.randomInt(100000, 999999).toString();
        const hashedPassword = await bcrypt.hash(password, 10);

        // Store details in your custom otpStore module (10 minute TTL)
        storeOTP(email, { name, password: hashedPassword, otp }, 10 * 60 * 1000);

        const { error } = await resend.emails.send({
            from: 'Aura Workspace <onboarding@resend.dev>',
            to: [email],
            subject: 'Verify Your Aura Workspace Account',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #e4e4e7; border-radius: 8px; max-width: 480px; margin: 0 auto;">
                    <h2 style="color: #18181b;">Welcome to Aura Workspace, ${name}!</h2>
                    <p style="color: #52525b;">Your verification code is:</p>
                    <h1 style="background: #f4f4f5; padding: 12px; text-align: center; letter-spacing: 8px; color: #09090b; border-radius: 6px;">${otp}</h1>
                    <p style="color: #71717a; font-size: 14px;">This code is valid for 10 minutes. If you didn't request this, you can safely ignore this email.</p>
                </div>
            `
        });

        if (error) {
            console.error("Resend Error:", error);
            return res.status(500).json({ success: false, error: "Failed to send verification email." });
        }

        return res.status(200).json({
            success: true,
            message: "OTP sent to your email! Please verify to complete sign up."
        });

    } catch (err) {
        console.error("Registration Error:", err);
        return res.status(500).json({ success: false, error: "Internal Server Error" });
    }
};

export const handleVerifyOTP = async (req, res) => {
    try{
        const {email,otp} = req.body;
        
        if(!otp || !email){
            return res.status(400).json({
                success : false,
                error : "Missing otp or email"
            })
        }
        
        const cacheData = getOTP(email);
        
        if(!cacheData){
            return res.status(400).json({
                success : false,
                error : "Invalid otp or email"
        })
        }

        if(cacheData.otp !== otp){
            return res.status(400).json({
                success : false,
                error : "Invalid otp"
            })
        }

        const insertQuery=`INSERT INTO users (name, email, password, last_login) VALUES ($1, $2, $3, CURRENT_TIMESTAMP) RETURNING google_id, name, email, picture;`

        const result = await pool.query(insertQuery,[cacheData.name,cacheData.email,cacheData.password]);
        const user = result.rows[0];

        deleteOTP(email);

        const jwtToken = jwt.sign({email : user.email},process.env.JWT_SECRET,{expiresIn : '24h'});

        res.cookie("aura_session",jwtToken,{
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "lax",
            maxAge : 24*60*60*1000
            });

        return res.status(201).json({
            success : true,
            message : "OTP verified successfully",
            user : {
                googleId : user.google_id,
                name : user.name,
                email : user.email,
                picture : user.picture
            }
        });
    }catch(err){
        console.error("Login Error :",err)
        return res.status(500).json({
            success : false,
            error : "Internal Server Error"
        })
    }
}

export const handleCustomLogin = async(req,res)=>{
    try{
        const validation = loginSchema.safeParse(req.body);
        if(!validation.success){
            return res.status(400).json({
                sucess : false,
                error : validation.error.errors.map(err => err.message).join(",")
            })
        }

        const {email,password} = validation.data;

        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if(result.rows.length === 0){
            return res.status(400).json({
                success : false,
                error : "Invalid email or password"
                })
        }

        const user = result.rows[0];
        
        if(!user.password){
            return res.status(400).json({
                success : false,
                error : "Invalid email or password"
            })
        }

        const isMatch = await bcrypt.compare(password,user.password);
        if(!isMatch){
            return res.status(400).json({
                success : false,
                error : "Invalid email or password"
            })
        }

        await pool.query('UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE email = $1',[email]);

        const jwtToken = jwt.sign({email : user.email},process.env.JWT_SECRET,{expiresIn : '24h'})

        res.cookie("aura_session",jwtToken,{
            httpOnly : true,
            secure : process.env.NODE_ENV === "production",
            sameSite : "lax",
            maxAge : 24*60*60*1000
            });

        return res.status(200).json({
            success : true,
            message : "Logged in successfully",
            user : {
                googleId : user.google_id,
                name : user.name,
                email : user.email,
                picture : user.picture
            }
        });
    }catch(err){
        console.error("Login Error :",err)
        return res.status(500).json({
            success : false,
            error : "Internal Server Error"
        })
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