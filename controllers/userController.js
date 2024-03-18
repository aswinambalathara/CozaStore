const userSchema = require("../models/userModel");
const addressSchema = require("../models/addressModel");
const verficationController = require("../controllers/verificationController");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken')
module.exports.getUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const user = await userSchema
      .findOne({ _id: authUser.userId })
      .populate({
        path: "addresses",
        model: "addresses",
        match: { status: true },
      });
    res.render("user/userProfile.ejs", {
      title: "userProfile",
      userdetail: user,
      user: authUser.userName,
      addresses: user.addresses,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doSetPrimaryAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const addressId = req.params.id;
    const userId = authUser.userId;
    console.log(addressId, " ", userId);
    await addressSchema.updateOne(
      { userId, _id: addressId },
      {
        $set: {
          isPrimary: true,
        },
      }
    );

    await addressSchema.updateMany(
      { userId, _id: { $ne: addressId } },
      {
        $set: {
          isPrimary: false,
        },
      }
    );
    res.status(200).json({
      status: "success",
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const user = await userSchema.findOne({ _id: authUser.userId });
    res.render("user/editProfile.ejs", {
      title: "Edit Profile",
      userdetail: user,
      user: authUser.userName,
      success: req.flash("success"),
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.getNewEditProfile = async (req,res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    //const user = await userSchema.findOne({ _id: authUser.userId });
    res.render("user/editProfileOld.ejs", {
      title: "Edit Profile",
      user : "None"
    });
  } catch (error) {
    console.log(error)
  }
}

module.exports.DoEditUserProfile = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const id = authUser.userId;
    console.log('entered');
    const { fullNameFt,fullName, password, email, phone, otp } = req.body;
    const user = await userSchema.findOne({ _id: id });
    if(fullName){
      user.fullName = fullName !== ''? fullName : undefined;
      await user.save()
      req.flash('success',"Updates Successfull");
        res.redirect('/user/userprofile')
    }else if (fullNameFt && email && phone && otp) {
      if (otp === user.token.otp) {
        user.fullName = fullNameFt !== " " ? fullNameFt : undefined;
        user.email = email !== "" ? email : undefined;
        user.phone = phone !== "" ? phone : undefined;
        await user.save();
        res.json({
          status: "success",
          message :"Profile Updated"
        });
      }else{
        res.json({
          status : 'error',
          message : "Incorrect OTP"
        });
      }
    } else if (password && otp) {
      if (user.token.otp === otp) {
        const hashPassword = await bcrypt.hash(password,12)
        user.password = hashPassword;
        await user.save();
        res.json({
          status: "success",
          message :"Password Changed Successfully"
        });
      }else{
        res.json({
          status : 'error',
          message : 'Incorrect OTP'
        })
      }
    }else{
      res.redirect('/user/userprofile')
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.DochangeUserPassword =  async (req,res) =>{

};

module.exports.sendOtp = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const id = authUser.userId;
    const { newPassword, oldPassword } = req.body;
    const { email } = req.body;
    const user = await userSchema.findOne({ _id: id });
    if (newPassword && oldPassword) {
      const oldPasswordCheck = await bcrypt.compare(oldPassword, user.password);
      const newPasswordCheck = await bcrypt.compare(newPassword, user.password);

      if (!oldPasswordCheck) {
        //console.log(oldPassword)
        res.json({
          status: "error",
          message: "Incorrect Old Password",
        });
      } else if (newPasswordCheck) {
        res.json({
          status: "error",
          message: "Cannot set old password as new password",
        });
      } else {
        const otp = verficationController.sendEmail(user.email);
        user.token.otp = otp;
        user.token.generatedTime = Date.now();
        await user.save();
        res.json({
          status: "success",
        });
      }
    } else {
      if (email) {
        const emailCheck = await userSchema.findOne({email:email,_id:{$ne:id}})
        if(emailCheck){
          res.json({
            status : 'error',
            message : "Email exist with another account"
          })
        }else{
          const otp = verficationController.sendEmail(email);
          user.token.otp = otp;
          user.token.generatedTime = Date.now();
          await user.save();
          res.json({
            status: "success",
          });
        }
      }
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getAddAddress = (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    res.render("user/addAddress.ejs", {
      title: "Add Address",
      user: authUser.userName,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doAddAddress = async (req, res) => {
  try {
  //  console.log(req.body);
  const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    if (authUser.userId) {
      const address = new addressSchema({
        fullName: req.body.fullName,
        mobile: req.body.mobile,
        address: req.body.address,
        district: req.body.district,
        state: req.body.state,
        pincode: req.body.pincode,
        userId: authUser.userId,
      });
      const result = await address.save();
      await userSchema.updateOne(
        { _id: authUser.userId },
        { $push: { addresses: result._id } }
      );
      res.redirect("/user/userprofile");
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.doUnlistAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    const addressId = req.params.id;
    const userId = authUser.userId;
    console.log(addressId, "  ", userId);
    if (addressId && userId) {
      await addressSchema.updateOne(
        { _id: addressId, userId },
        {
          $set: {
            status: false,
          },
        }
      );
      res.status(200).json({
        status: "success",
      });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports.getEditAddress = async (req, res) => {
  try {
    const authUser = jwt.verify(req.cookies.token,process.env.JWT_SECRET)
    //console.log(req.params.id);
    const address = await addressSchema.findOne({_id:req.params.id});
    res.render("user/editAddress.ejs", {
      title: "Edit Address",
      user: authUser.userName,
      address : address
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports.doEditAddress = async (req, res)=>{
  try {
    const addressId = req.params.id
    const {fullName,mobile,address,district,state,pincode} = req.body
     await addressSchema.updateOne({_id:addressId},{$set:{
      fullName : fullName !== ''? fullName : undefined,
      mobile : mobile !== ''? mobile : undefined,
      address : address !== ''? address : undefined,
      district : district !== ''? district : undefined,
      state : state !== ''? state : undefined,
      pincode : pincode !== ''? pincode : undefined,
     }});
     req.flash('success',"Address Update SuccessFull");
     res.redirect('/user/userprofile')
  } catch (error) {
    console.log(error)
  }
}