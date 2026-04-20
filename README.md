# Smart Business Management System (SBMS)

A complete, client-side **enterprise dashboard web application** built with **HTML, CSS, and JavaScript**.

This project demonstrates:
- Systems Analysis & Design  
- Business Process Management  
- CRUD data handling with persistent storage  
- Cloud computing concepts (simulated)  
- Cybersecurity fundamentals  

> The application runs locally by opening `index.html` in a browser (no backend required).

---

##  Features

###  1) Authentication & Access Control
- Password-based login gate (admin demo mode)
- Dashboard hidden until authenticated
- Session persistence using `localStorage`
- Logout functionality

**Demo Password:** `Admin@123`

---

###  2) Customer Management
- Add, edit, delete customers  
- Unique customer IDs  
- Duplicate prevention  
- Search & filter functionality  
- High-value customer highlighting  

---

###  3) Product Management
- Add, edit, delete products  
- Fields:
  - Name  
  - Price (ZAR)  
  - Category  
- Input validation  
- Sorting & search  

---

###  4) Order Management
- Create orders using dropdown selection  
- Quantity support  
- Auto-calculated totals  
- Timestamped order history  
- Filter orders by customer  
- Sorting by date/amount  

---

###  5) Data Layer (localStorage)
- Persistent storage for:
  - customers  
  - products  
  - orders  
- Data loads automatically on startup  

---

###  6) Cloud Simulation Tools
- Export system data as JSON (Backup)
- Restore system from JSON file
- Reset system with confirmation
- Export orders to CSV (bonus)

---

###  7) Analytics Dashboard
- Total customers  
- Total orders  
- Total revenue (ZAR)  
- Most popular product  
- Revenue trend chart (Chart.js)

---

###  8) UI / UX Design
- Enterprise SaaS dashboard layout  
- Sidebar navigation  
- Card-based analytics layout  
- Responsive design  
- Light/dark mode toggle  
- Toast notifications  

---

##  Project Structure

```text
Smart-Business-Management-System/
├── index.html      # UI structure
├── style.css       # Styling and layout
├── script.js       # Business logic and system functionality
├── README.md       # Documentation
└── LICENSE
```
##  How to Run

1. Download or clone the repository  
2. Open `index.html` in any browser  
3. Login using:

```
Password: Admin@123
```

---

##  Data Model

Stored in `localStorage`:

### customers[]
- id  
- name  
- email  
- tier  

### products[]
- id  
- name  
- category  
- price  

### orders[]
- id  
- customerId  
- productId  
- quantity  
- total  
- timestamp  

---

##  Validation Rules

- No empty inputs allowed  
- Price and quantity must be numeric  
- Customer names must be unique  
- Inputs are trimmed and sanitized  

---

##  Known Limitations

- Authentication is client-side only  
- No real database integration  
- Single-user system only  

---

##  Future Enhancements

- Backend API integration  
- Role-based access control  
- Database (SQL/NoSQL) integration  
- Advanced analytics dashboard  
- Audit logs & security improvements  

---

## Footer Statement

> Developed as a Business Information Technology systems project demonstrating enterprise system design, analytics, cloud concepts, and cybersecurity fundamentals.
