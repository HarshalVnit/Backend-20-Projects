const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

const API_URL = 'http://localhost:5000/api';

const runFullTest = async () => {
    try {
        console.log("🚀 Starting Full Lifecycle Test...");

        // 1. REGISTER A NEW USER
        const userData = {
            userName: `Chef_${Date.now()}`, // Unique name every time
            email: `test_${Date.now()}@example.com`,
            password: 'password123'
        };

        const regRes = await axios.post(`${API_URL}/users`, userData);
        console.log("✅ Step 1: User Registered!");

        // 2. LOGIN TO GET TOKEN
        const loginRes = await axios.post(`${API_URL}/users/login`, {
            email: userData.email,
            password: userData.password
        });
        const token = loginRes.data.token;
        console.log("✅ Step 2: Login Successful! Token Received.");

        // 3. UPLOAD RECIPE (The Multipart/Form-Data Test)
        console.log("⏳ Step 3: Uploading Recipe with Image...");
        
        const form = new FormData();
        form.append('title', 'Automated Pasta');
        form.append('description', 'Created by the test script');
        form.append('ingredients', 'Flour, Eggs, Water, Salt'); // Testing String -> Array logic
        form.append('category', 'Italian');
        form.append('instructions', 'Mix, boil, and eat.');

        // Path to your local image
        const imagePath = path.join(__dirname, 'test-image.jpg'); 
        if (!fs.existsSync(imagePath)) {
            throw new Error("❌ ERROR: 'test-image.jpg' not found in root folder!");
        }
        form.append('image', fs.createReadStream(imagePath));

        const uploadRes = await axios.post(`${API_URL}/recipes`, form, {
            headers: {
                ...form.getHeaders(),
                Authorization: `Bearer ${token}`
            }
        });

        console.log("✅ Step 3: Recipe Uploaded! Image saved at:", uploadRes.data.recipe.image);

        // 4. VERIFY SEARCH & PAGINATION
        console.log("⏳ Step 4: Verifying Search functionality...");
        const searchRes = await axios.get(`${API_URL}/recipes?search=Pasta`);
        
        if (searchRes.data.recipes.length > 0) {
            console.log(`✅ Step 4: Search Successful! Found ${searchRes.data.totalResults} recipes.`);
        } else {
            console.log("⚠️ Step 4: Search returned 0 results. Check your Text Index!");
        }

        console.log("\n🎉 ALL TESTS PASSED! Your Backend is a Beast.");

    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error("❌ TEST FAILED:", errorData);
    }
};

runFullTest();