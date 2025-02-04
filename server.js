import { time } from "console";
import http from "http";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import querystring from "querystring";
import url from "url";

// Database initialization function
async function initializeDatabase() {
    // Open (or create) the database file
    const db = await open({
        filename: "./library.db",
        driver: sqlite3.Database,
    });

    // Create books table if it doesn't exist
    await db.exec(`
        CREATE TABLE IF NOT EXISTS books (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            author TEXT NOT NULL,
            year TEXT NOT NULL
        )
    `);

    // Only insert initial books if the table is empty
    const bookCount = await db.get("SELECT COUNT(*) as count FROM books");
    if (bookCount.count === 0) {
        await db.run(`
            INSERT INTO books (title, author, year) VALUES 
            ('The Hobbit', 'J.R.R. Tolkien', '1937'),
            ('1984', 'George Orwell', '1949'),
            ('To Kill a Mockingbird', 'Harper Lee', '1960'),
            ('Pride and Prejudice', 'Jane Austen', '1813'),
            ('The Great Gatsby', 'F. Scott Fitzgerald', '1925')
        `);
    }

    return db;
}

let db;

// VALIDATOR
const validationHandler = (book) => {
    // Validate book structure
    const requiredFields = ["author", "title", "year"];
    const bookKeys = Object.keys(book);
    const hasAllRequiredFields = requiredFields.every((field) =>
        bookKeys.includes(field)
    );
    const hasOnlyRequiredFields = bookKeys.every((key) =>
        requiredFields.includes(key)
    );

    if (!hasAllRequiredFields || !hasOnlyRequiredFields) {
        throw new Error("Invalid book structure");
    }
};

// BASIC error ____
const basicErrorHandler = (res) => {
    res.setHeader("Content-Type", "application/JSON");
    res.statusCode = 200;
    res.end(
        JSON.stringify({
            msg: "You probably used a wrong method or URL",
        })
    );
};

// GET _____
// Base path
const basePathHandler = (res) => {
    let timestamp = new Date().toISOString();
    res.setHeader("Content-Type", "application/JSON");
    res.statusCode = 200;
    res.end(
        JSON.stringify({
            msg: "Hello World",
            time: timestamp,
        })
    );
};
// All books
const getBooksHandler = async (res) => {
    let books = await db.all("SELECT * FROM books");

    if (books.length > 0) {
        res.setHeader("Content-Type", "application/JSON");
        res.statusCode = 200;
        res.end(JSON.stringify(books));
    } else {
        res.setHeader("Content-Type", "application/JSON");
        res.statusCode = 200;
        res.end(
            JSON.stringify({
                msg: "No books in the library yet, add some",
            })
        );
    }
};
// Get book by Id
const getBookById = async (res, id) => {
    // check existance of book in library
    let book = await db.get("SELECT * FROM books WHERE id = ?", [id]);

    res.setHeader("Content-Type", "application/JSON");
    if (book) {
        res.statusCode = 200;
        res.end(JSON.stringify(book));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Book not found" }));
    }
};
// Search
// Dynamic SQL query
const searchHandler = async (res, queryParams) => {
    let conditions = [];
    let params = {};

    if (queryParams.title) {
        conditions.push("title LIKE :titleParam");
        params[":titleParam"] = `%${queryParams.title}%`;
    }
    if (queryParams.author) {
        conditions.push("author LIKE :authorParam");
        params[":authorParam"] = `%${queryParams.author}%`;
    }
    if (queryParams.year) {
        conditions.push("year LIKE :yearParam");
        params[":yearParam"] = `%${queryParams.year}%`;
    }

    let whereClause =
        conditions.length > 0 ? `WHERE ${conditions.join(" OR ")}` : "";
    let query = `SELECT * FROM books ${whereClause}`;

    try {
        let result = await db.all(query, params);
        res.setHeader("Content-Type", "application/JSON");
        res.statusCode = 200;
        res.end(JSON.stringify(result));
    } catch (error) {
        console.error("Error executing query:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
};
// Not Found
const notFoundHandler = (res) => {
    let timestamp = new Date().toISOString();
    res.setHeader("Content-Type", "application/JSON");
    res.statusCode = 404;
    res.end(
        JSON.stringify({
            msg: "Not Found",
            code: res.statusCode,
            time: timestamp,
        })
    );
};

// POST _____
// Add book
const addBookHandler = (req, res) => {
    // create empty variable
    let requestData = "";

    // collect data in chuncks and add it to variable
    req.on("data", (chunk) => {
        requestData += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const book = JSON.parse(requestData);
            validationHandler(book);

            // Insert book in DB
            const result = await db.run(
                "INSERT INTO books (title, author, year) VALUES (?, ?, ?)",
                [book.title, book.author, book.year]
            );

            res.setHeader("Content-type", "application/json");
            res.statusCode = 201; // Created
            res.end(
                JSON.stringify({
                    msg: "Book added to library",
                    book: book,
                })
            );
        } catch (error) {
            res.statusCode = 400; // Bad Request
            res.end(
                JSON.stringify({
                    error: error.message || "Invalid JSON data",
                })
            );
        }
    });
};

// PUT ____
// Update book
const updateBookHandler = (req, res, id) => {
    let requestData = "";

    req.on("data", (chunk) => {
        requestData += chunk.toString();
    });

    req.on("end", async () => {
        try {
            const bookData = JSON.parse(requestData);

            // Get current Book
            const currentBook = await db.get(
                "SELECT * FROM books WHERE id= ?",
                [id]
            );

            if (!currentBook) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Book not found" }));
                return;
            }

            validationHandler(bookData);

            // Update the book
            await db.run(
                "UPDATE books SET title = :title, author = :author, year = :year WHERE id = :id",
                {
                    ":title": bookData.title,
                    ":author": bookData.author,
                    ":year": bookData.year,
                    ":id": id,
                }
            );

            // Get updated book
            const updatedBook = await db.get(
                "SELECT * FROM books WHERE id = ?",
                [id]
            );

            res.statusCode = 200;
            res.end(
                JSON.stringify({
                    msg: "Book updated successfully",
                    book: updatedBook,
                })
            );
        } catch (error) {
            res.statusCode = 400;
            res.end(
                JSON.stringify({ error: error.message || "Invalid JSON data" })
            );
        }
    });
};

// DELETE ____
const deleteBookHandler = async (res, id) => {
    const bookExists = await db.get("SELECT * from books WHERE id = ?", [id]);

    if (!bookExists) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Book not found" }));
        return;
    } else {
        await db.run("DELETE from books WHERE id = ?", [id]);
        res.statusCode = 200;
        res.end(
            JSON.stringify({
                message: "Book deleted successfully",
                id: id,
            })
        );
    }
};

// _______________________________________________________________________________________________
// _______________________________________________________________________________________________

const server = http.createServer(async (req, res) => {
    try {
        if (req.url === "/books" && req.method === "POST") {
            addBookHandler(req, res);
        } else if (req.url === "/" && req.method === "GET") {
            basePathHandler(res);
        } else if (req.url === "/books" && req.method === "GET") {
            getBooksHandler(res);
        } else if (
            req.url.startsWith("/books/search") &&
            req.method === "GET"
        ) {
            const parsedUrl = url.parse(req.url);
            const queryParams = querystring.parse(parsedUrl.query);
            if (Object.keys(queryParams).length > 0) {
                await searchHandler(res, queryParams);
            } else {
                getBooksHandler(res);
            }
        } else if (req.url.startsWith("/books/") && req.method === "GET") {
            const id = parseInt(req.url.split("/")[2]);
            if (id) {
                getBookById(res, id);
            } else {
                basicErrorHandler(res);
            }
        } else if (req.url.startsWith("/books/") && req.method === "PUT") {
            const id = parseInt(req.url.split("/")[2]);
            if (id) {
                updateBookHandler(req, res, id);
            } else {
                basicErrorHandler(res);
            }
        } else if (req.url.startsWith("/books/") && req.method === "DELETE") {
            const id = parseInt(req.url.split("/")[2]);
            if (id) {
                deleteBookHandler(res, id);
            } else {
                basicErrorHandler(res);
            }
        } else {
            notFoundHandler(res);
        }
    } catch (error) {
        console.error("Error handling request:", error);
        res.statusCode = 500;
        res.end(JSON.stringify({ error: "Internal Server Error" }));
    }
});

async function startServer() {
    try {
        // Initialize and store the database connection
        db = await initializeDatabase();

        // Only start the server after database is ready
        server.listen(3000, () => {
            console.log("Server running on port 3000");
        });
    } catch (error) {
        console.error("Failed to initialize database:", error);
    }
}

startServer();
