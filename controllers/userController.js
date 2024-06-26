const User = require('../models/User')
const jwt = require('jsonwebtoken')
const bcrypt = require('bcrypt')
const getJwtEmail = require('../utils/getJwtEmail')
const path = require('path')
const {put} = require('@vercel/blob')

// const multer = require('multer')
const multerInstance = require('../Configuration/multerInstance')
// const diskStorage = multer.diskStorage({
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null, path.parse(file.originalname).name + '-' + uniqueSuffix + path.extname(file.originalname))
//   },
//   destination: './images'
// })

// const upload = multer({
//   storage: diskStorage,
//   fileFilter: (req, file, cb) => {
//     const ext = path.extname(file.originalname)
//     if (!(ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
//       return cb(new Error('not supported format'))
//     }
//     cb(null, true)
//   }
// }).single('img')


const updateProfilePic = async (req, res) => {
  const upload = multerInstance.single('img')
  upload(req, res, async (err) => {
    if (err?.message === 'not supported format') {
      return res.status(400).json({ success: false, msg: 'not supported format' })
    } else if (err) {
      console.log(err);
      return res.status(500).json({ success: false, msg: "server error" })
    }
    try {
      // disk : const filename = res.req.file.filename;
      // s3 : const filename = req.file?.key;

      const fileBuffer = req.file?.buffer;
      const fileOriginalName = req.file?.originalname;
      // const imageFile = new File(fileBuffer,fileOriginalName)
      // const fileBlob = new Blob([fileBuffer]);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
      const fileName = path.parse(fileOriginalName).name + '-' + uniqueSuffix + path.extname(fileOriginalName)
     
      const blob = await put(fileName, fileBuffer, {
        access: 'public',
      });
      const imgURL = blob.url;

      const email = getJwtEmail(req)

      // store filename in DB
      await User.updateOne({ email }, { profilePicture: imgURL })
      res.json({ success: true, msg: "profile picture updated successfully", img: imgURL })
    } catch (e) {
      console.log(err);
      res.status(500).json({ success: false, msg: "server error" })
    }
  })
}


const getProfile = async (req, res) => {

  try {
    const email = getJwtEmail(req)
    let profile = await User.aggregate([
      {
        $match: { email: email }
      },
      {
        $project: { password: 0 }
      },
      {
        $lookup: {
          from: 'orders',
          pipeline: [
            {
              $match: { owner: email }
            },
            {
              $count: 'count'
            }
          ],
          as: 'totalorders'
        }
      }
    ])
    profile = profile[0]
    profile.totalorders = profile.totalorders.length > 0 ? profile.totalorders[0].count : 0
    res.json(profile)

  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, msg: "server error" })
  }

}

const updateInfo = async (req, res) => {
  try {
    const email = getJwtEmail(req)
    const { firstName, lastName, phone, address1, address2 } = req.body;
    await User.updateOne({ email }, { firstName, lastName, phone, address1, address2 })
    res.json({ success: true, msg: "info updated successfully" })
  } catch (e) {
    console.log(e);
    res.status(500).json({ success: false, msg: "server error" })
  }
}


const changePassword = async (req, res) => {
  try {

    const { oldPassword, newPasseord } = req.body;
    const token = req.headers["Authorization"].split(' ')
    const decodedToken = jwt.decode(token, process.env.JWT_SECRET)
    const { email } = decodedToken;
    const currentUser = await User.findOne({ email })
    const currentPw = currentUser.password

    const validpw = await bcrypt.compare(oldPassword, currentPw)
    if (validpw) {
      const newEncodedPW = await bcrypt.hash(newPasseord);
      await User.updateOne({ email }, { password: newEncodedPW })
      res.json({ success: true, msg: "password updated successfully" })
    } else {
      res.status(403).json({ success: false, msg: "invalid password" })
    }


  } catch (e) {
    res.status(500).json({ success: false, msg: "server error" })
  }

}
module.exports = { getProfile, updateInfo, updateProfilePic, changePassword }