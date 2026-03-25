// ===============================
// IMPORT REQUIRED MODULES
// ===============================
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // ✅ added
require("dotenv").config();

const app = express();

// ===============================
// MIDDLEWARE
// ===============================
app.use(cors()); // ✅ added (fix frontend connection)
app.use(express.json()); // Parse JSON requests


// ===============================
// DATABASE CONNECTION
// ===============================
mongoose.connect(process.env.MONGO_URI, {
    serverSelectionTimeoutMS: 5000
})
.then(() => {
    console.log("MongoDB Connected Successfully");
})
.catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
});


// ===============================
// BOOK SCHEMA (Database Structure)
// ===============================
const bookSchema = new mongoose.Schema({

    title: {
        type: String,
        required: true
    },

    author: {
        type: String,
        required: true
    },

    isbn: {
        type: String,
        required: true,
        unique: true
    },

    genre: {
        type: String,
        required: true
    },

    publisher: {
        type: String,
        required: true
    },

    publicationYear: {
        type: Number
    },

    totalCopies: {
        type: Number,
        required: true,
        min: 1
    },

    availableCopies: {
        type: Number
    },

    shelfLocation: {
        type: String
    },

    bookType: {
        type: String,
        enum: ["Reference", "Circulating"]
    },

    status: {
        type: String,
        enum: ["Available", "Checked Out"],
        default: "Available"
    }

}, { timestamps: true });


// ===============================
// CREATE MODEL
// ===============================
const Book = mongoose.model("Book", bookSchema);


// ===============================
// ROUTES / API ENDPOINTS
// ===============================


/*
----------------------------------
POST /books
Add new book
----------------------------------
*/
app.post("/books", async (req, res) => {

    try {

        const data = req.body;

        // ✅ fix: auto set availableCopies
        if (!data.availableCopies) {
            data.availableCopies = data.totalCopies;
        }

        const book = new Book(data);

        const savedBook = await book.save();

        res.status(201).json({
            message: "Book added successfully",
            data: savedBook
        });

    } catch (error) {

        console.error("POST ERROR:", error.message); // ✅ better error

        res.status(400).json({
            message: error.message
        });
    }

});



/*
----------------------------------
GET /books
Get all books
----------------------------------
*/
app.get("/books", async (req, res, next) => {

    try {

        const books = await Book.find();

        res.status(200).json(books);

    } catch (error) {
        next(error);
    }

});



/*
----------------------------------
GET /books/:id
Get book by ID
----------------------------------
*/
app.get("/books/:id", async (req, res, next) => {

    try {

        const book = await Book.findById(req.params.id);

        if (!book) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json(book);

    } catch (error) {
        next(error);
    }

});



/*
----------------------------------
PUT /books/:id
Update book
----------------------------------
*/
app.put("/books/:id", async (req, res, next) => {

    try {

        const updatedBook = await Book.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book updated successfully",
            data: updatedBook
        });

    } catch (error) {
        next(error);
    }

});



/*
----------------------------------
DELETE /books/:id
Delete book
----------------------------------
*/
app.delete("/books/:id", async (req, res, next) => {

    try {

        const deletedBook = await Book.findByIdAndDelete(req.params.id);

        if (!deletedBook) {
            return res.status(404).json({
                message: "Book not found"
            });
        }

        res.status(200).json({
            message: "Book deleted successfully"
        });

    } catch (error) {
        next(error);
    }

});



/*
----------------------------------
GET /books/search?title=xyz
Search books by title
----------------------------------
*/
app.get("/books/search", async (req, res, next) => {

    try {

        const title = req.query.title;

        if (!title) {
            return res.status(400).json({
                message: "Title query parameter required"
            });
        }

        const books = await Book.find({
            title: { $regex: title, $options: "i" }
        });

        if (books.length === 0) {
            return res.status(404).json({
                message: "No books found"
            });
        }

        res.status(200).json(books);

    } catch (error) {
        next(error);
    }

});



// ===============================
// ERROR HANDLING MIDDLEWARE
// ===============================
app.use((err, req, res, next) => {

    console.error(err);

    res.status(500).json({
        message: "Server Error",
        error: err.message
    });

});


// ===============================
// START SERVER
// ===============================
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});