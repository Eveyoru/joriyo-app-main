import sendEmail from '../config/sendEmail.js'
import UserModel from '../models/user.model.js'
import bcryptjs from 'bcryptjs'
import verifyEmailTemplate from '../utils/verifyEmailTemplate.js'
import generatedAccessToken from '../utils/generatedAccessToken.js'
import genertedRefreshToken from '../utils/generatedRefreshToken.js'
import uploadImageClodinary from '../utils/uploadImageClodinary.js'
import generatedOtp from '../utils/generatedOtp.js'
import forgotPasswordTemplate from '../utils/forgotPasswordTemplate.js'
import jwt from 'jsonwebtoken'

export async function registerUserController(request,response){
    try {
        const { name, email , password } = request.body

        if(!name || !email || !password){
            return response.status(400).json({
                message : "provide email, name, password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(user){
            return response.json({
                message : "Already register email",
                error : true,
                success : false
            })
        }

        const salt = await bcryptjs.genSalt(10)
        const hashPassword = await bcryptjs.hash(password,salt)

        const payload = {
            name,
            email,
            password : hashPassword
        }

        const newUser = new UserModel(payload)
        const save = await newUser.save()

        const VerifyEmailUrl = `${process.env.FRONTEND_URL}/verify-email?code=${save?._id}`

        const verifyEmail = await sendEmail({
            sendTo : email,
            subject : "Verify email from binkeyit",
            html : verifyEmailTemplate({
                name,
                url : VerifyEmailUrl
            })
        })

        return response.json({
            message : "User register successfully",
            error : false,
            success : true,
            data : save
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

export async function verifyEmailController(request,response){
    try {
        const { code } = request.body

        const user = await UserModel.findOne({ _id : code})

        if(!user){
            return response.status(400).json({
                message : "Invalid code",
                error : true,
                success : false
            })
        }

        const updateUser = await UserModel.updateOne({ _id : code },{
            verify_email : true
        })

        return response.json({
            message : "Verify email done",
            success : true,
            error : false
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : true
        })
    }
}

//login controller
export async function loginController(request,response){
    try {
        const { email , password } = request.body


        if(!email || !password){
            return response.status(400).json({
                message : "provide email, password",
                error : true,
                success : false
            })
        }

        const user = await UserModel.findOne({ email })

        if(!user){
            return response.status(400).json({
                message : "User not register",
                error : true,
                success : false
            })
        }

        if(user.status !== "Active"){
            return response.status(400).json({
                message : "Contact to Admin",
                error : true,
                success : false
            })
        }

        const checkPassword = await bcryptjs.compare(password,user.password)

        if(!checkPassword){
            return response.status(400).json({
                message : "Check your password",
                error : true,
                success : false
            })
        }

        const accesstoken = await generatedAccessToken(user._id)
        const refreshToken = await genertedRefreshToken(user._id)

        const updateUser = await UserModel.findByIdAndUpdate(user?._id,{
            last_login_date : new Date()
        })

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }
        response.cookie('accessToken',accesstoken,cookiesOption)
        response.cookie('refreshToken',refreshToken,cookiesOption)

        return response.json({
            message : "Login successfully",
            error : false,
            success : true,
            data : {
                accesstoken,
                refreshToken
            }
        })

    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//logout controller
export async function logoutController(request,response){
    try {
        const userid = request.userId //middleware

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.clearCookie("accessToken",cookiesOption)
        response.clearCookie("refreshToken",cookiesOption)

        const removeRefreshToken = await UserModel.findByIdAndUpdate(userid,{
            refresh_token : ""
        })

        return response.json({
            message : "Logout successfully",
            error : false,
            success : true
        })
    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//upload user avatar
export async function uploadAvatar(request, response) {
    try {
        const userId = request.userId; // auth middleware
        const image = request.file;  // multer middleware

        if (!image) {
            return response.status(400).json({
                message: "No image file provided",
                error: true,
                success: false
            });
        }

        try {
            const upload = await uploadImageClodinary(image);
            
            const updatedUser = await UserModel.findByIdAndUpdate(
                userId,
                { avatar: upload.url },
                { new: true }
            ).select('-password -refresh_token');

            if (!updatedUser) {
                return response.status(404).json({
                    message: "User not found",
                    error: true,
                    success: false
                });
            }

            return response.json({
                message: "Profile picture updated successfully",
                success: true,
                error: false,
                data: updatedUser
            });
        } catch (cloudinaryError) {
            console.error("Cloudinary upload error:", cloudinaryError);
            return response.status(500).json({
                message: `Image upload failed: ${cloudinaryError.message}`,
                error: true,
                success: false
            });
        }
    } catch (error) {
        console.error("Avatar upload error:", error);
        return response.status(500).json({
            message: error.message || "Server error during avatar upload",
            error: true,
            success: false
        });
    }
}

//update user details
export async function updateUserDetails(request, response) {
    try {
        const userId = request.userId; // auth middleware
        const { name, email, mobile } = request.body;

        // Get the user to check their role
        const user = await UserModel.findById(userId);
        if (!user) {
            return response.status(404).json({
                message: "User not found",
                error: true,
                success: false
            });
        }

        // For admin users, only allow mobile number updates
        if (user.role === 'ADMIN') {
            if (name || email) {
                return response.status(403).json({
                    message: "Admin users can only update their mobile number",
                    error: true,
                    success: false
                });
            }
            
            if (!mobile) {
                return response.status(400).json({
                    message: "Please provide a mobile number",
                    error: true,
                    success: false
                });
            }
        } else {
            // For regular users, validate input - at least one field must be provided
            if (!name && !email && !mobile) {
                return response.status(400).json({
                    message: "Provide at least one field to update",
                    error: true,
                    success: false
                });
            }

            // If email is being updated, check if it's already in use
            if (email) {
                const existingUser = await UserModel.findOne({ email, _id: { $ne: userId } });
                if (existingUser) {
                    return response.status(400).json({
                        message: "Email already in use",
                        error: true,
                        success: false
                    });
                }
            }
        }

        // Create update object with only the fields that are provided
        const updateFields = {
            ...(user.role !== 'ADMIN' && name && { name }),
            ...(user.role !== 'ADMIN' && email && { email }),
            ...(mobile && { mobile })
        };

        // Update user and return the updated document
        const updatedUser = await UserModel.findByIdAndUpdate(
            userId,
            updateFields,
            { new: true, runValidators: true }
        ).select('-password -refresh_token');

        // Return success with updated user data
        return response.json({
            message: "Profile updated successfully",
            error: false,
            success: true,
            data: updatedUser
        });
    } catch (error) {
        console.error("Update user details error:", error);
        return response.status(500).json({
            message: error.message || "Server error during profile update",
            error: true,
            success: false
        });
    }
}

//forgot password not login
export async function forgotPasswordController(request, response) {
    try {
        const { email } = request.body;

        if (!email) {
            return response.status(400).json({
                message: "Email is required",
                error: true,
                success: false
            });
        }

        console.log(`Processing forgot password request for email: ${email}`);

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not registered",
                error: true,
                success: false
            });
        }

        const otp = generatedOtp();
        const expireTime = new Date(Date.now() + 60 * 60 * 1000); // 1hr from now

        console.log(`Generated OTP for ${email}: ${otp}, expires at ${expireTime}`);

        // Update user with OTP details
        await UserModel.findByIdAndUpdate(user._id, {
            forgot_password_otp: otp,
            forgot_password_expiry: expireTime.toISOString()
        });

        try {
            // Send email with OTP
            await sendEmail({
                sendTo: email,
                subject: "Forgot password from Binkeyit",
                html: forgotPasswordTemplate({
                    name: user.name,
                    otp: otp
                })
            });

            console.log(`Password reset email sent successfully to ${email}`);

            return response.json({
                message: "Check your email for the OTP",
                error: false,
                success: true
            });
        } catch (emailError) {
            console.error("Failed to send password reset email:", emailError);
            
            // Revert the OTP update since email failed
            await UserModel.findByIdAndUpdate(user._id, {
                forgot_password_otp: null,
                forgot_password_expiry: null
            });

            return response.status(500).json({
                message: "Failed to send password reset email. Please try again later.",
                error: true,
                success: false
            });
        }
    } catch (error) {
        console.error("Forgot password controller error:", error);
        return response.status(500).json({
            message: error.message || "Server error during password reset request",
            error: true,
            success: false
        });
    }
}

//verify forgot password otp
export async function verifyForgotPasswordOtp(request, response) {
    try {
        const { email, otp } = request.body;

        if (!email || !otp) {
            return response.status(400).json({
                message: "Email and OTP are required",
                error: true,
                success: false
            });
        }

        console.log(`Verifying OTP for email: ${email}, OTP: ${otp}`);

        const user = await UserModel.findOne({ email });

        if (!user) {
            return response.status(400).json({
                message: "Email not registered",
                error: true,
                success: false
            });
        }

        // Check if OTP exists and is valid
        if (!user.forgot_password_otp) {
            return response.status(400).json({
                message: "No OTP was requested. Please request a new OTP",
                error: true,
                success: false
            });
        }

        // Verify OTP
        if (user.forgot_password_otp !== otp) {
            return response.status(400).json({
                message: "Invalid OTP",
                error: true,
                success: false
            });
        }

        // Check if OTP is expired
        const expiryTime = new Date(user.forgot_password_expiry);
        const currentTime = new Date();

        if (currentTime > expiryTime) {
            return response.status(400).json({
                message: "OTP has expired. Please request a new one",
                error: true,
                success: false
            });
        }

        // Generate a token for password reset
        const token = jwt.sign(
            { id: user._id },
            process.env.SECRET_KEY_ACCESS_TOKEN,
            { expiresIn: '15m' }
        );

        console.log(`OTP verified successfully for ${email}, reset token generated`);

        return response.json({
            message: "OTP verified successfully",
            error: false,
            success: true,
            token: token
        });
    } catch (error) {
        console.error("Verify forgot password OTP error:", error);
        return response.status(500).json({
            message: error.message || "Server error during OTP verification",
            error: true,
            success: false
        });
    }
}

//reset the password
export async function resetpassword(request, response) {
    try {
        const { email, newPassword, token } = request.body;

        if (!email || !newPassword || !token) {
            return response.status(400).json({
                message: "Email, new password, and token are required",
                error: true,
                success: false
            });
        }

        console.log(`Processing password reset for email: ${email}`);

        // Verify the token
        try {
            const decoded = jwt.verify(token, process.env.SECRET_KEY_ACCESS_TOKEN);
            
            // Find the user
            const user = await UserModel.findOne({ 
                email: email,
                _id: decoded.id 
            });

            if (!user) {
                return response.status(400).json({
                    message: "Invalid token or email",
                    error: true,
                    success: false
                });
            }

            // Hash the new password
            const salt = await bcryptjs.genSalt(10);
            const hashedPassword = await bcryptjs.hash(newPassword, salt);

            // Update the user's password and clear OTP fields
            await UserModel.findByIdAndUpdate(user._id, {
                password: hashedPassword,
                forgot_password_otp: null,
                forgot_password_expiry: null
            });

            console.log(`Password reset successful for ${email}`);

            return response.json({
                message: "Password reset successful",
                error: false,
                success: true
            });
        } catch (tokenError) {
            console.error("Token verification error:", tokenError);
            return response.status(401).json({
                message: "Invalid or expired token",
                error: true,
                success: false
            });
        }
    } catch (error) {
        console.error("Reset password error:", error);
        return response.status(500).json({
            message: error.message || "Server error during password reset",
            error: true,
            success: false
        });
    }
}

//refresh token controler
export async function refreshToken(request,response){
    try {
        const refreshToken = request.cookies.refreshToken || request?.headers?.authorization?.split(" ")[1]  /// [ Bearer token]

        if(!refreshToken){
            return response.status(401).json({
                message : "Invalid token",
                error  : true,
                success : false
            })
        }

        const verifyToken = await jwt.verify(refreshToken,process.env.SECRET_KEY_REFRESH_TOKEN)

        if(!verifyToken){
            return response.status(401).json({
                message : "token is expired",
                error : true,
                success : false
            })
        }

        const userId = verifyToken?._id

        const newAccessToken = await generatedAccessToken(userId)

        const cookiesOption = {
            httpOnly : true,
            secure : true,
            sameSite : "None"
        }

        response.cookie('accessToken',newAccessToken,cookiesOption)

        return response.json({
            message : "New Access token generated",
            error : false,
            success : true,
            data : {
                accessToken : newAccessToken
            }
        })


    } catch (error) {
        return response.status(500).json({
            message : error.message || error,
            error : true,
            success : false
        })
    }
}

//get login user details
export async function userDetails(request,response){
    try {
        const userId = request.userId;
        console.log('Fetching user details for:', userId);

        const user = await UserModel.findById(userId)
            .select('-password -refresh_token')
            .lean();

        if (!user) {
            return response.status(404).json({
                message: 'User not found',
                error: true,
                success: false
            });
        }

        return response.json({
            message: 'User details fetched successfully',
            data: {
                ...user,
                id: user._id // Ensure id is available
            },
            error: false,
            success: true
        });
    } catch (error) {
        console.error('Error fetching user details:', error);
        return response.status(500).json({
            message: "Something went wrong while fetching user details",
            error: true,
            success: false
        });
    }
}

export async function getAllCustomersController(request, response) {
    try {
        // Find all users with role "USER"
        const customers = await UserModel.find({ role: "USER" })
            .select('-password -refresh_token -forgot_password_otp -forgot_password_expiry')
            .populate('address_details');

        return response.status(200).json({
            message: "Customers fetched successfully",
            error: false,
            success: true,
            data: customers,
            count: customers.length
        });
    } catch (error) {
        console.error("Error fetching customers:", error);
        return response.status(500).json({
            message: "Failed to fetch customers",
            error: true,
            success: false,
            errorMessage: error.message
        });
    }
}