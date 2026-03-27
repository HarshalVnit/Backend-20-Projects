const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');


const userSchema = mongoose.Schema(
    {
        userName: {
            type: String,
            required:true
        },
        email: {
            type: String,
            required: [true, 'Please add an email'],
            unique: true, // No two users can have the same email
            match: [
                /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
                'Please add a valid email'
            ]
        },
        password: {
            type: String,
            required: [true, 'Please add a password'],
            minlength: 6
        }
        // products: [
        //     {
        //         type: mongoose.Schema.Types.ObjectId,
        //         ref: 'product'
        //     }
        // ]
    }
)


//schemaObject.pre( 'event_name', callback_function )

userSchema.pre('save', async function (next) {

        if (!this.isModified('password')) {
            return next();
        }
    // Generate a "salt" (random data to make hash unique)
    const salt = await bcrypt.genSalt(10);
    // /hash the password with article
    this.password = await bcrypt.hash(this.password, salt);
});


userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};


module.exports = mongoose.model('User', userSchema);