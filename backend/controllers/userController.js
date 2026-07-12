import pool from '../config/db.js';
import z from 'zod';

const userSchema = z.object({
    name : z.string().min(2,{message: " Name must be atleast 2 characters long"}).max(60,{message: "Name too long"}),
    email : z.string().email({message: "Invalid email address"}),
    password : z.string().min(6,{message : "Password must be atleast 6 character long"})
});

export const createUser = async(req,res)=>{
    try{
        const {name,email,password}=req.body;
        const query = 'INSERT INTO users (name, email,password) 
    }
    }catch(error){

    }

}