const path = require('path')
const multer = require('multer')
// const multerS3 = require('multer-s3')
// const { S3Client } = require('@aws-sdk/client-s3')
// const s3 = new S3Client()

// require('dotenv').config();


// S3 Storage:

// const s3Storage = multerS3({
//   s3: s3,
//   bucket: process.env.BUCKET,
//   key: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null, path.parse(file.originalname).name + '-' + uniqueSuffix + path.extname(file.originalname))
//   }
// })


// Disk Storage:

// const diskStorage = multer.diskStorage({
//   filename: (req, file, cb) => {
//     const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
//     cb(null, path.parse(file.originalname).name + '-' + uniqueSuffix + path.extname(file.originalname))
//   },
//   destination: './images'
// })


// Memory Storage:
const memoryStorage =multer.memoryStorage();

const multerInstance = multer({
  storage: memoryStorage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase()
    if (!(ext === '.jpg' || ext === '.jpeg' || ext === '.png')) {
      return cb(new Error('not supported format'))
    }
    cb(null, true)
  }
})
module.exports = multerInstance