import mongoose from "mongoose";

const userSchema=new mongoose.Schema({
    username: {type: String, requried: true},
    email: {type: String, requried: true},
    password: {type: String, requried: true},
    confirmPassword: {type: String, requried: true},   
    address: {
      street: String,
      city: String,
      state: String,
      postalCode: String,
      country: String,
    },

    phone: {
      type: String,
    },

    avatar: {
      type: String,
      default: "",
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    refreshToken: String,
    refreshTokenExpireAt: Date,
    resetPasswordToken: String,
    resetPasswordExpiresAt: Date,
    verificationToken: String,
    verificationTokenExpiresAt: Date,
},
{ timestamps: true }
)
userSchema.methods.generateJWT = function () {
  const accessToken = jwt.sign(
    {
      _id: this._id,
      name: this.name,
      email: this.email,
    },
    process.env.ACCESS_TOKEN_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN }
  );

  const refreshToken = jwt.sign(
    {
      _id: this._id,
    },
    process.env.REFRESH_TOKEN_SECRET,
    { expiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN }
  );
  return { accessToken, refreshToken };
};

export default mongoose.model("User", userSchema);
