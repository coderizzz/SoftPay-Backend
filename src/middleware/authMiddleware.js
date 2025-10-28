import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import dotenv from "dotenv"
import { ApiError } from "../utils/apiError.js";


dotenv.config();

const isLoggedIn=asyncHandler(async(req,_res,next)=>{
    const {accessToken}=req.cookies
    console.log(accessToken);
    
        if(!accessToken){
            return next(new ApiError(400,"token is missing"))
        }

        const decodedData= jwt.verify(accessToken,process.env.ACCESS_TOKEN_SECRET)

        req.user=decodedData
        next()
})
export default isLoggedIn;