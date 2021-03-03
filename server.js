'use strict';
const express = require('express');
require('dotenv').config();
const superagent = require('superagent');
// const ejs = require('ejs');
const pg = require('pg');
const methodOverride = require('method-override');
const client = new pg.Client(process.env.DATABASE_URL);

const PORT = process.env.PORT || 3000;
const app = express();

app.use(express.static('./public'));
app.use(express.urlencoded({extended:true}));

app.set('view engine','ejs');

app.use(methodOverride('_method'));

// localhost:3000/hello
// app.get('/hello',(req,res)=>{
// res.render('pages/index');
// })

// home route
app.get('/', (req,res) => {
    let SQL=`SELECT * FROM books;`;
    client.query(SQL)
    .then(result =>{
        // console.log(result.rows);

        res.render('pages/index',{booklist:result.rows,bookcount:result.rowCount});
    
})
})

// 
app.get('/books/:id',(req,res) => {

    let SQL = `SELECT * from books WHERE id=$1;`;
    let value = [req.params.id];
  client.query(SQL,value)
  .then(result=>{
    console.log(result.rows);
    res.render('pages/books/detail',{task:result.rows[0]})
  })

})
app.post('/addBooks',(req,res) =>{
let SQL = `INSERT INTO books (author,title,isbn,image_url,description) VALUES ($1,$2,$3,$4,$5)RETURNING id;`;
  let value = req.body;
  let safeValues= [value.author,value.title,value.isbn,value.image_url,value.description];
  client.query(SQL,safeValues)
  // .then((result)=>{
  //   console.log(result.rows);
  //   res.redirect(`../show/${result.rows[0].id}`);
  // })
  
  .then((result) =>{
    console.log(result.rows[0].id);
   res.redirect(`/books/${result.rows[0].id}`);
  })
})

app.put('/updateBook/:id',(req,res)=>{
  // console.log(req.body);
  let {author,title,isbn,image_url,description} = req.body;
  let SQL = `UPDATE books SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5 WHERE id =$6;`;
  let values = [author, title,isbn,image_url,description,req.params.id];
  client.query(SQL, values)
    .then(() => {
      res.redirect(`/books/${req.params.id}`);
    })
})


app.delete('/deleteBook/:id',(req,res) =>{
  let SQL = `DELETE FROM books WHERE id=$1;`;
  let value = [req.params.id];
  client.query(SQL,value)
  .then(()=>{
    res.redirect('/');
  })
})










// localhost:3000/searches/new
app.get('/searches/new',(req,res)=>{
 res.render('pages/searches/new');
})

app.post('/searches',(req,res) =>{
let searchMethod=req.body.searchbox;
let url;
if (req.body.radioselect === 'Title' ) {
 url = `https://www.googleapis.com/books/v1/volumes?q=+intitle:${searchMethod}`;
} else if(req.body.radioselect === 'Author') {
url =`https://www.googleapis.com/books/v1/volumes?q=+inauthor:${searchMethod}`;
}
superagent.get (url)
.then (booksResult =>{
// console.log(booksResult.body.items);
let booksArr=booksResult.body.items.map(element => new Book (element));


res.render('pages/searches/show',{mylist:booksArr});
})
//  .catch((errors)=>{
//      app.use("*", (req, res) => {
//          res.status(500).send(errors);
//        })
//    })
})




//Book constructor

function Book(bookData) {
    this.image_url =(bookData.volumeInfo.imageLinks)?bookData.volumeInfo.imageLinks.thumbnail:`https://i.imgur.com/J5LVHEL.jpg`;
    this.title=bookData.volumeInfo.title || 'no title available for this Book';
    this.author=(bookData.volumeInfo.authors)?bookData.volumeInfo.authors:'no Author';
    this.description=bookData.volumeInfo.description || 'no description';
    this.isbn=(bookData.volumeInfo.industryIdentifiers && bookData.volumeInfo.industryIdentifiers[0].type + '' +
    bookData.volumeInfo.industryIdentifiers[0].identifier) || 'No ISBN';
    
}
function errorHandler(error, req, res) {
  // response.status(500).send(error);
  res.render('error', { errorList: error })
}



// app.get('/error', (req,res) => {
//         res.status(500).send('Error in Route');
           
// })
client.connect()
.then (() =>{
app.listen(PORT,()=>{
    console.log(`Listening on PORT ${PORT}`);
})
})


