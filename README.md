# Book Library API

## ✍️ Description 
A self-made exercise to learn Node.js by building a book library API from scratch. With guidance from Claude (Anthropic's AI), I created this project to understand how APIs and databases work without using frameworks like Express.

## Learning objectives  // 💪 Own Challenge  
- Building a server with Node.js
- Creating API endpoints (GET, POST, PUT, DELETE)
- Working with SQLite database
- Handling errors and data validation
- Managing IDs and data persistence

## 🚀 Features
- Add new books to the library
- View all books or find one by ID
- Update book information
- Remove books from the library
- Data stays saved even after server restart

## 🛠️ Technologies Used  
- Node.js
- SQLite (sqlite3)
- JavaScript

## 🤔 Challenges Encountered  
- Working with async operations in Node.js
- Managing the database correctly
- Handling different types of requests
- Structuring code without a framework

## 🔮 Possible Improvements 
- Add search and filtering
- Create proper documentation
- Add input safety checks

## Getting Started

### Requirements
- Node.js version 14 or higher
- NPM (comes with Node.js)

### Setup
1. Clone this project:
```bash
git clone [your-repo-url]
cd [your-repo-name]
```

2. Install what's needed:
```bash
npm install sqlite3 sqlite
```

3. Start the server:
```bash
node server.js
```

### How to Use the API
- Get all books: `GET /books`
- Get one book: `GET /books/1`
- Add a book: `POST /books`
- Update a book: `PUT /books/1`
- Delete a book: `DELETE /books/1`

Example: Adding a new book
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "title": "The Hobbit",
  "author": "J.R.R. Tolkien",
  "year": "1937"
}' http://localhost:3000/books
```

## Author
- EGeldreich
