import { time } from "console";
import http from "http";

let books = [
    {
        id: 1,
        title: "The Hobbit",
        author: "J.R.R. Tolkien",
        year: "1937",
    },
    {
        id: 2,
        title: "1984",
        author: "George Orwell",
        year: "1949",
    },
    {
        id: 3,
        title: "To Kill a Mockingbird",
        author: "Harper Lee",
        year: "1960",
    },
];
let availableIds = [];

// ID Handler
const generateId = () => {
    if (availableIds.length > 0) {
        return availableIds.shift();
    } else {
        return books.length > 0
            ? Math.max(...books.map((book) => book.id)) + 1
            : 1;
    }
};

// Function to delete a book and manage available IDs
const deleteBookIdHandler = (id) => {
    const index = books.findIndex((book) => book.id === id);
    if (index !== -1) {
        books.splice(index, 1);
        availableIds.push(id);
    }
};

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
const getBooksHandler = (res) => {
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
const getBookById = (res, id) => {
    // check existance of book in library
    let book = books.find((book) => book.id === id);

    res.setHeader("Content-Type", "application/JSON");
    if (book) {
        res.statusCode = 200;
        res.end(JSON.stringify(book));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Book not found" }));
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
    let timestamp = new Date().toISOString();
    // create empty variable
    let requestData = "";

    // collect data in chuncks and add it to variable
    req.on("data", (chunk) => {
        requestData += chunk.toString();
    });

    req.on("end", () => {
        try {
            const book = JSON.parse(requestData);

            validationHandler(book);

            book.id = generateId();
            books.push(book); // Store book in memory

            res.setHeader("Content-type", "application/json");
            res.statusCode = 201; // Created
            res.end(
                JSON.stringify({
                    msg: "Book added to library",
                    book: book,
                    time: timestamp,
                })
            );
        } catch (error) {
            res.statusCode = 400; // Bad Request
            res.end(
                JSON.stringify({
                    error: error.message || "Invalid JSON data",
                    time: timestamp,
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

    req.on("end", () => {
        try {
            const bookData = JSON.parse(requestData);
            const bookIndex = books.findIndex((book) => book.id === id);

            if (bookIndex === -1) {
                res.statusCode = 404;
                res.end(JSON.stringify({ error: "Book not found" }));
                return;
            }

            // Update book while preserving its ID
            const updatedBook = { ...bookData, id: books[bookIndex].id };

            validationHandler(updatedBook);

            books[bookIndex] = updatedBook;

            res.statusCode = 200;
            res.end(
                JSON.stringify({
                    msg: "Book updated successfully",
                    book: updatedBook,
                })
            );
        } catch (error) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: "Invalid JSON data" }));
        }
    });
};

// DELETE ____
const deleteBookHandler = (res, id) => {
    const bookExists = books.some((book) => book.id === id);

    if (!bookExists) {
        res.statusCode = 404;
        res.end(JSON.stringify({ error: "Book not found" }));
        return;
    } else {
        deleteBookIdHandler(id);
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

const server = http.createServer((req, res) => {
    if (req.url === "/books" && req.method === "POST") {
        addBookHandler(req, res);
    } else if (req.url === "/" && req.method === "GET") {
        basePathHandler(res);
    } else if (req.url === "/books" && req.method === "GET") {
        getBooksHandler(res);
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
});

server.listen(3000);
