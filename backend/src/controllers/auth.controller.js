import cloudinary from "../lib/cloudinary.js";
import { generateToken } from "../lib/utils.js";
import User from "../models/user.model.js";
import bcrypt from "bcryptjs";

export const signup = async (req,res) => {
    const {fullName, email, password} = req.body;
    try {
        // check if all fields are present
        if(!fullName || !email || !password){
            return res.status(400).json({message: "All fields are required"});
        }
        // check if password>8
        if(password.length<8){
            return res.status(400).json({message: "Password must be atleast 8 characters"});
        }

        // check for the user with the email
        const user = await User.findOne({email});
        if(user){
            return res.status(400).json({message:"User already exists!"});
        }

        // hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPass = await bcrypt.hash(password,salt);

        const newUser = new User({
            fullName,
            email,
            password:hashedPass,
        });

        if(newUser) {
            //generate JWT token
            generateToken(newUser._id,res);

            await newUser.save();
            
            res.status(201).json({
                _id:newUser._id,
                fullName:newUser.fullName,
                email:newUser.email,
                profilePic:newUser.profilePic,
            });
        } else{
            return res.status(400).json({message:"Invalid user data"});
        }
    } catch (error) {
        console.log("Error in signup controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const login = async (req,res) => {
    const {email,password} = req.body;
    try {
        const user = await User.findOne({email});

        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }

        const isPasswordCorrect = await bcrypt.compare(password,user.password);
        if(!isPasswordCorrect){
            return res.status(400).json({message:"Invalid credentials"});
        }

        generateToken(user._id,res);
        res.status(200).json({
            _id:user._id,
            fullName:user.fullName,
            email:user.email,
            profilePic:user.profilePic,
        });
    } catch (error) {
        console.log("Error in login controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const logout = (req,res) => {
    try {
        res.cookie("jwt","",{maxAge:0});
    } catch (error) {
        console.log("Error in logout controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const updateProfile = async (req,res) => {
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"Profile picture is required"});
        }

        const uploadRes = await cloudinary.uploader.upload(profilePic);
        const updatedUser = await User.findByIdAndUpdate(userId,{profilePic:uploadRes.secure_url},{new:true});
        
        res.status(200).json(updatedUser);
    } catch (error) {
        console.log("Error in updateProfile controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};

export const checkAuth = (req,res) => {
    try {
        res.status(200).json(req.user);
    } catch (error) {
        console.log("Error in checkAuth controller",error.message);
        res.status(500).json({message:"Internal Server Error"});
    }
};