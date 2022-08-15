const router = require("express").Router();
const User = require("../models/User");
const bcrypt = require("bcrypt");// ma hoa
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });
};

const protect = asyncHandler(async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
  ) {
    try {
      token = req.headers.authorization.split(" ")[1]

      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      req.user = await User.findById(decoded.id).select("-password");
      next();
    } catch (error) {
      console.log(error);
      res.status(401).send({
        message: `Not authorized, token failed`
      });
    }
  }
  if (!token) {
    res.status(401).send({
      message: `Not authorized, no token`
    });
  }
})

//LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      res.status(404).send({
        message: `Account '${email}' couldn't be found `
      });
    }
    else {
      if (user && (await user.matchPassword(password))) {
        res.status(200).json({
          _id: user._id,
          profilePicture: user.profilePicture,
          coverPicture: user.coverPicture,
          followers: user.followers,
          followings: user.followings,
          isAdmin: user.isAdmin,
          username: user.username,
          email: user.email,
          createdAt: user.createdAt,
          desc: user.desc,
          city: user.city,
          from: user.from,
          relationship: user.relationship,
          token: generateToken(user._id),
        });
      }
      else {
        res.status(404).send({
          message: `wrong password`
        });
      }
    };
  } catch (err) {
    res.status(500).send({ message: `Internal Server Error.\n\n${err}` });
  }
});

//REGISTER
router.post("/register", async (req, res) => {
  try {
    //generate new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);

    //create new user
    const newUser = new User({
      username: req.body.username,
      email: req.body.email,
      password: hashedPassword,
      city: req.body.city,
      from: req.body.from,
      relationship: req.body.relationship,
    });

    //save user and respond
    const user = await newUser.save();
    res.status(200).json(user);
  } catch (err) {
    res.status(500).json(err)
  }
});

//PROFILE
router.get("/profile", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    res.json({
      _id: user._id,
      profilePicture: user.profilePicture,
      coverPicture: user.coverPicture,
      followers: user.followers,
      followings: user.followings,
      isAdmin: user.isAdmin,
      username: user.username,
      email: user.email,
      createdAt: user.createdAt,
      desc: user.desc,
      city: user.city,
      from: user.from,
      relationship: user.relationship,
      token: generateToken(user._id),
    })
  }
  else {
    res.status(404).send({
      message: `User not found`
    });
  }
}));

//UPDATE PROFILE
//PROFILE
router.put("/profile", protect, asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id)

  if (user) {
    user.username = req.body.username || user.username;
    user.email = req.body.email || user.email
    if (req.body.password) {
      user.password = req.body.password
    }
    const updateUser = await user.save()
    res.json({
      _id: updateUser._id,
      profilePicture: updateUser.profilePicture,
      coverPicture: updateUser.coverPicture,
      followers: updateUser.followers,
      followings: updateUser.followings,
      isAdmin: updateUser.isAdmin,
      username: updateUser.username,
      email: updateUser.email,
      createdAt: updateUser.createdAt,
      desc: updateUser.desc,
      city: updateUser.city,
      from: updateUser.from,
      relationship: updateUser.relationship,
      token: generateToken(updateUser._id),
    })
  }
  else {
    res.status(404).send({
      message: `User not found`
    });
  }
}));

//LOGOUT
router.get('/logout', async (req, res) => {
  const user = null;
  res.status(200).json(user);
});

module.exports = router