const exp = require("express");
const path = require("path");
const bcrypt = require("bcrypt");
const fs = require('fs');
const collection = require("./config");
const session = require('express-session');

const app = exp();

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, '../views'));

// Serve static files from the 'public' folder
app.use(exp.static(path.join(__dirname, '../public')));
app.use(exp.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: 'secret_key',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false } // set to true if using HTTPS
}));

// Helper function to sanitize paths
function sanitizePath(input) {
  return input.replace(/\.\./g, '').replace(/\//g, '');
}

// Routes
app.get('/', (req, res) => {
  res.render("signup");
});
app.get('/signup', (req,res) => {
  res.render("signup");
})
app.get('/login', (req, res) => {
  res.render("login");
});

app.post('/home', async (req, res) => {
  const requestedpath = {
    branch: sanitizePath(req.body.branch),
    year: sanitizePath(req.body.year),
    sem: sanitizePath(req.body.sem),
    sub: sanitizePath(req.body.subject)
  };

  // Store in session
  req.session.branch = requestedpath.branch;
  req.session.year = requestedpath.year;
  req.session.sem = requestedpath.sem;

  const dirPath = path.join('public', requestedpath.branch, 
                          `${requestedpath.year}bpdfs`, 
                          requestedpath.sem, 
                          requestedpath.sub);
  req.session.rpath = dirPath;

  try {
    if (!fs.existsSync(dirPath)) {
      return res.render('home', {
        error: "Directory not found",
        pdfFiles: [],
        pdfData: null,
        currentPdf: null,
        branch: requestedpath.branch,
        year: requestedpath.year,
        sem: requestedpath.sem
      });
    }

    const files = fs.readdirSync(dirPath);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    res.render('home', {
      pdfFiles,
      pdfData: null,
      currentPdf: null,
      error: pdfFiles.length ? null : "No PDFs found",
      branch: requestedpath.branch,
      year: requestedpath.year,
      sem: requestedpath.sem
    });

  } catch (err) {
    console.error(err);
    res.render('home', {
      error: "Server Error",
      pdfFiles: [],
      pdfData: null,
      currentPdf: null,
      branch: requestedpath.branch,
      year: requestedpath.year,
      sem: requestedpath.sem
    });
  }
});

app.get('/view-pdf/:filename', (req, res) => {
  if (!req.session.rpath) {
    return res.redirect('/');
  }

  const filename = sanitizePath(req.params.filename);
  const filePath = path.join(req.session.rpath, filename);

  try {
    if (!fs.existsSync(filePath)) {
      const files = fs.readdirSync(req.session.rpath);
      const pdfFiles = files.filter(file => file.endsWith('.pdf'));
      
      return res.render('home', {
        error: "PDF Not Found",
        pdfFiles,
        pdfData: null,
        currentPdf: null,
        branch: req.session.branch,
        year: req.session.year,
        sem: req.session.sem
      });
    }

    const databuffer = fs.readFileSync(filePath);
    const base64PDF = databuffer.toString('base64');
    const files = fs.readdirSync(req.session.rpath);
    const pdfFiles = files.filter(file => file.endsWith('.pdf'));

    res.render('home', {
      pdfFiles,
      pdfData: base64PDF,
      currentPdf: filename,
      error: null,
      branch: req.session.branch,
      year: req.session.year,
      sem: req.session.sem
    });

  } catch (err) {
    console.error(err);
    res.render('home', {
      error: "Error Loading PDF",
      pdfFiles: [],
      pdfData: null,
      currentPdf: null,
      branch: req.session.branch,
      year: req.session.year,
      sem: req.session.sem
    });
  }
});

app.post('/signup', async (req, res) => {
  const data = {
    rollnumber: req.body.rollnumber,
    password: req.body.password
  };

  try {
    const userexists = await collection.findOne({ rollnumber: data.rollnumber });
    if (userexists) {
     res.send("user exists try login");
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(data.password, saltRounds);
    data.password = hashedPassword;
    
    await collection.insertMany(data);
    res.render("home", { 
      pdfFiles: [],
      pdfData: null,
      error: null,
      branch: null,
      year: null,
      sem: null
    });

  } catch (err) {
    console.error(err);
    res.render("home", { 
      pdfFiles: [],
      pdfData: null,
      error: "Registration failed",
      branch: null,
      year: null,
      sem: null
    });
  }
});

app.post('/login', async (req, res) => {
  const data = {
    rollnumber: req.body.rollnumber,
    password: req.body.password
  };

  try {
    const checkuser = await collection.findOne({ rollnumber: data.rollnumber });
    if (!checkuser) {
      return res.render("login", { error: "User not found" });
    }

    const isPasswordMatch = await bcrypt.compare(data.password, checkuser.password);
    if (!isPasswordMatch) {
      return res.render("login", { error: "Incorrect password" });
    }

    res.render("home", { 
      pdfFiles: [],
      pdfData: null,
      error: null,
      branch: null,
      year: null,
      sem: null
    });

  } catch (err) {
    console.error(err);
    res.render("login", { error: "Login failed" });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).render('home', {
    error: "Internal Server Error",
    pdfFiles: [],
    pdfData: null,
    currentPdf: null,
    branch: null,
    year: null,
    sem: null
  });
});

const port = 3000;
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});