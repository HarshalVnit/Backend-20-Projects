const multer = require('multer');

// 1. The Storage Engine (RAM vs. Hard Drive)
// We are using memoryStorage. This keeps the image in the server's RAM as a "Buffer".
// Why? Because if we save it straight to the Hard Drive, our Sharp image processor 
// would have to dig it back up to resize it. Keeping it in RAM is much faster!
const storage = multer.memoryStorage();

// 2. The Bouncer (File Filter)
// We only want recipes, not PDF essays or virus.exe files.
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true); // Accept the file
    } else {
        cb(new Error('Not an image! Please upload an image.'), false); // Reject the file
    }
};

// 3. The Mailroom Worker (Multer Instance)
const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5 Megabytes max limit to stop server crashes
    }
});

module.exports = upload;



// The Final Flow
// When we wire this up in your router later, it will look like this:
// router.post('/', upload.single('image'), createRecipe);

// User sends request.

// upload.single('image') (The code we just wrote) catches it, puts the image in RAM, and creates req.body and req.file.

// createRecipe (The Controller) takes over. This is where Sharp will finally make its appearance!